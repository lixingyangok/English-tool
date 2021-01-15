/*
 * @Author: 李星阳
 * @LastEditors: 李星阳
 * @Description: 处理文件上传、下载
 */
import {
	fileToTimeLines, fileToBuffer,
	getFaleBuffer, downloadString,
} from 'assets/js/pure-fn.js';
const axios = window.axios;
// var URLSafeBase64 = require('urlsafe-base64');
// console.log('URLSafeBase64', URLSafeBase64);

export default class FileList {
	// ▼将选中的文件整理，配对，返回
	toMatchFiles(targetFiles=[]){
		const [resultArr, subtitleObj] = [...targetFiles].reduce((aResult, curFile)=>{
			const {type, name} = curFile;
			const lastIndex = name.lastIndexOf('.');
			if (lastIndex === -1) return aResult;
			curFile.name_ = name.slice(0, lastIndex); // 保存去除后缀的名字
			if (/^(audio|video)\/.+/.test(type)) {
				aResult[0].push({
					file: curFile, oSubtitleFile: null,
				});
			}else if (name.endsWith('.srt')) {
				aResult[1][curFile.name_] = curFile;
			}
			return aResult;
		}, [[], {}]);
		resultArr.forEach(cur=>{
			cur.oSubtitleFile = subtitleObj[cur.name_];
		});
		return resultArr;
	}
	// ▼将配对完成的文件补充一些信息，用于显示
	getFileArrToShow(aListForShow, oStoryID){
		if (!(aListForShow || {}).length) return [];
		aListForShow.forEach(oItem => { // 用于显示和上传的表格
			const {file, oSubtitleFile} = oItem;
			oItem.mediaFile = { // 用于七牛
				file: file,
				fileName: file.name,
			};
			if (oSubtitleFile) oItem.oSubtitleInfo = { // 用于七牛
				file: null, // 后面会填充一个 Blob
				fileName: oSubtitleFile.name,
			}
			oItem.forOwnDB = { // 用于自已的服务器
				storyId: oStoryID,
				fileId: '', //媒体文件id-真值后补
				fileName: file.name,
				fileSize: file.size,
				subtitleFileId: '', //字幕文件-真值后补
				subtitleFileName: oSubtitleFile ? oSubtitleFile.name : '',
				subtitleFileSize: oSubtitleFile ? oSubtitleFile.size : 0,
			};
		});
		return aListForShow;
	}
	// ▼把2类文件组织成列表显示出来，用于准备上传
	toCheckFile(ev, oStory){
		const aListForShow = this.toMatchFiles(ev.target.files);
		const needToUploadArr = this.getFileArrToShow(aListForShow, oStory.id);
		ev.target.value = ''; // 清空
		if (!needToUploadArr.length) return; //没有媒体文件就返回
		const aStory = this.state.aStory.map(cur=>{
			if (cur.ID === oStory.ID) cur.needToUploadArr_ = needToUploadArr;
			return cur;
		});
		this.setState({aStory});
	}
	// ▼上传一个媒体文件+字幕
	async toUpload(oStory, oFileInfo, iFileIdx) {
		// if (1) return; //测试
		this.setState({loading: true}); // 开始loading
		const tokenRes = await axios.get('/qiniu/gettoken');
		if (!tokenRes) {
			this.setState({loading: false});
			return this.message.error('查询token未成功');
		}
		// ▼ 上传媒体到七牛
		const fileRes01 = await axios.post('http://upload-z2.qiniup.com', {
			...oFileInfo.mediaFile,
			token: tokenRes.token,
		});
		if (!fileRes01) { //上传失败
			this.setState({loading: false});
			return this.message.error('保存媒体文件未成功');
		}
		// ▼ 再上传字幕到七牛
		let fileRes02 = false; // false表示不用上传，或上传不成功
		if (oFileInfo.oSubtitleInfo) {
			fileRes02 = await axios.post('http://upload-z2.qiniup.com', {
				...oFileInfo.oSubtitleInfo,
				token: tokenRes.token,
			});
			if (!fileRes02) this.message.error('字幕上传未成功');
		}
		// ▼再上传到自已的服务器
		const uploadRes = await axios.post('/media', { //保存媒体记录
			...oFileInfo.forOwnDB,
			fileId: fileRes01.key,
			subtitleFileId: fileRes02 ? fileRes02.key : '',
		});
		this.setState({loading: false}); // 无论如何关闭loading
		if (!uploadRes) return this.message.error('保存媒体记录未成功');
		this.message.success('上传成功');
		this.deleteOneCandidate(oStory, iFileIdx)
		this.getMediaForOneStory(oStory); //刷新
	}
	// ▼删除一个【待上传】的文件
	deleteOneCandidate(oStory, iFileIdx){
		const aStory = this.state.aStory.map(cur=>{
			if (cur.ID === oStory.ID) oStory.needToUploadArr_.splice(iFileIdx, 1);
			return cur;
		});
		this.setState({aStory});
	}
	// ▼查询某个故事下的文件
	async getMediaForOneStory(oStory){ 
		const res = await axios.get('/media/' + oStory.ID);
		if (!res) return;
		const aStory = this.state.aStory.map(cur=>{
			if (cur.ID === oStory.ID) cur.aMedia_ = res || [];
			return cur;
		});
		this.setState({aStory});
	}
	// ▼删除一个已上传的文件
	async delOneMedia(oStory, oneMedia){
		const res = await axios.delete('/media/', {
			params: {
				mediaId: oneMedia.ID,
				fileId: oneMedia.fileId,
				subtitleFileId: oneMedia.subtitleFileId,
			},
		});
		if (!res) return this.message.error('删除文件未成功');
		this.getMediaForOneStory(oStory);
	}
	// ▼下载一个媒体&字幕
	async downloadOneMedia(oStory, oneMedia){
		const filePath = 'http://qn.hahaxuexi.com/' + oneMedia.fileId;
		const res = await axios.get(filePath, {
			responseType: "blob",
		});
		const mediaFile = new File( [res], oneMedia.fileName, {
			type: res.type,
		});
		console.log('mediaFile\n', mediaFile);
		this.saveOneMedia(oStory, {
			...oneMedia, mediaFile,
		});
	}
	
	// 新旧分界------------------
	
	// ▼保存章节
	async saveSection(oStory, aFiles) {
		const [audioFile, srtFile] = aFiles;
		const aMakeSections = audioFile.map(async curFile=>{
			const aLines = await (async () => {
				const sCurFileName = curFile.name.split('.').slice(0,-1).join('.');
				const matchedSrtFile = srtFile.find(cur => cur.name.startsWith(sCurFileName));
				if (!matchedSrtFile) return [];
				return await fileToTimeLines(matchedSrtFile);
			})();
			return {
				idx: 0,
				aLines,
				parent: oStory.id,
				audioFile: curFile,
				buffer: undefined,
				srtFile: undefined, //字幕文件好像没用
			};
		});
		const aSections = await Promise.all(aMakeSections);
		const idArr = [];
		for (const curSct of aSections) {
			const id = await this.state.oSectionTB.add(curSct);
			idArr.push(id);
		}
		await this.getSctToStory(oStory.id); //更新故事下的章节
		idArr.forEach((id, idx)=>{
			this.getSectionBuffer({...aSections[idx], id});
		});
		this.message.success('保存完成，正在解析波形数据'); //放在最后？
	}
	// ▼【更新】章节
	async upDateSection(oSct, aFiles) {
		const [audioFile, srtFile] = aFiles;
		if (audioFile) {
			const aStories = this.state.aStories.map(cur => {
				if (cur.id !== oSct.parent) return cur;
				const oTarget = cur.aSections.find(item => item.id === oSct.id);
				oTarget.audioFile = audioFile;
				oTarget.buffer = undefined;
				return cur;
			});
			this.setState({aStories}); // 先更新视图，即把旧文件清除掉
		}
		const {srtFile: srtFileOld, audioFile: audioFileOld} = oSct;
		const aLines = srtFile ? await fileToTimeLines(srtFile) : oSct.aLines;
		const oSection = {
			aLines,
			srtFile: srtFile || srtFileOld,
			audioFile: audioFile || audioFileOld,
		};
		await this.state.oSectionTB.update(oSct.id, oSection);
		await this.getSctToStory(oSct.parent);
		audioFile && this.getSectionBuffer(oSct);
		this.message.success('保存完成' + (audioFile ? '，正在解析波形数据' : '')); //放在最后
	}
	// 给章节添加buffer
	async getSectionBuffer(oSct){
		if (!oSct.audioFile) return this.message.error('没有音频文件，无法初始化');
		const getStories = (isLoading, buffer) => this.state.aStories.map(cur=>{
			if (cur.id === oSct.parent)  Object.assign(
				cur.aSections.find(item=>item.id === oSct.id),
				{isLoading, buffer},
			);
			return cur;
		});
		this.setState({aStories: getStories(true, {})});
		let buffer = await fileToBuffer(oSct.audioFile);
		this.message.success('解析完成，正在保存波形数据');
		await new Promise(resolve=>setTimeout(resolve, 700));
		buffer = getFaleBuffer(buffer);
		this.setState({aStories: getStories(false, buffer)});
		await this.state.oSectionTB.update(oSct.id, {buffer});
		this.message.success('波形数据保存完成');
	}
	// ▼删除某章节
	toDelSection(oSct){
		const onOk = ()=>{
			this.state.oSectionTB.delete(oSct.id);
			this.getSctToStory();
		};
		this.Modal.confirm({
			title: `是否确认删除?`,
			content: `正在删除：${oSct.audioFile.name}`,
			cancelText: '取消',
			okText: '确认',
			onOk,
		});
	}
	// ▼导出字幕文件
	toExport(oSct) {
		const aStr = oSct.aLines.map(({start_, end_, text}, idx) => {
			return `${idx + 1}\n${start_} --> ${end_}\n${text}\n`;
		});
		const fileName = oSct.audioFile.name.split('.').slice(0, -1).join('.');
		downloadString(aStr.join('\n'), fileName, 'srt');
	}
};

