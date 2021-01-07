/*
 * @Author: 李星阳
 * @LastEditors: 李星阳
 * @Description: 
 */
import {
	fileToTimeLines, fileToBuffer,
	getFaleBuffer, downloadString,
} from 'assets/js/pure-fn.js';
const axios = window.axios;
// var URLSafeBase64 = require('urlsafe-base64');
// console.log('URLSafeBase64', URLSafeBase64);

export default class FileList {
	// ▼分割2类文件
	getTwoKindsFilesArr(targetFiles=[]){
		return [...targetFiles].reduce((aResult, curFile)=>{
			const {type, name} = curFile;
			const lastIndex = name.lastIndexOf('.');
			if (lastIndex === -1) return aResult;
			curFile.name_ = name.slice(0, lastIndex); // 保存去除后缀的名字
			if (/^(audio|video)\/.+/.test(type)) {
				aResult[0].push(curFile);
			}else if (name.endsWith('.srt')) {
				aResult[1].push(curFile);
			}
			return aResult;
		}, [[], []]);
	}
	// ▼把2类文件组织成列表显示出来
	toCheckFile(ev, oStory){
		const [mediaArr, subtitleArr] = this.getTwoKindsFilesArr(ev.target.files);
		ev.target.value = ''; // 清空
		if (!mediaArr.length) return;
		// ▼把文件整理成列表用于显示
		const needToUploadArr = mediaArr.map(curMediaFile => { 
			const {name, name_} = curMediaFile;
			const forQiNiu = { // 用于七牛
				file: curMediaFile,
				fname: name,
				token: '', //真值后补
			};
			const forOwnDB = { // 用于自已的服务器
				storyId: oStory.ID,
				fileName: name,
				fileSize: curMediaFile.size,
				fileId: '', //真值后补
				subtitleFile: subtitleArr.find(cur=>cur.name_ === name_) || '',
			};
			return {file: curMediaFile, forQiNiu, forOwnDB};
		});
		this.setState({
			aStory: this.state.aStory.map(cur=>{
				if (cur.ID === oStory.ID) cur.needToUploadArr_ = needToUploadArr;
				return cur;
			}),
		});
		console.log('needToUploadArr', needToUploadArr);
	}
	// ▼input导入文件到某个故事（通过第3个参数判断是新增还是修改
	async toUpload(oFileInfo) {
		const {forQiNiu, forOwnDB} = oFileInfo;
		const showError = this.message.error;
		this.setState({loading: true});
		// ▼ 先从七牛 sdk 取一个 token 值
		const tokenRes = await axios.get('/qiniu/gettoken');
		if (!tokenRes) {
			this.setState({loading: false});
			return showError('查询token未成功');
		}
		// ▼ 再上传媒体到七牛
		const fileRes = await axios.post('http://upload-z2.qiniup.com', {
			...forQiNiu,
			token: tokenRes.token,
		});
		if (!fileRes) {
			this.setState({loading: false});
			return showError('保存文件未成功');
		}
		// ▼再上传到自已的服务器
		const uploadRes = await axios.post('/media', { //保存媒体记录
			...forOwnDB,
			fileId: fileRes.key,
		});
		if (!uploadRes) return showError('保存媒体记录未成功');
		this.setState({loading: false});
		// this.getMediaForOneStory(oStory); //
	}
	// ▼查询故事下的文件
	async getMediaForOneStory(oStory){ 
		const res = await axios.get('/media/' + oStory.ID);
		if (!res) return;
		const aStory = this.state.aStory.map(cur=>{
			if (cur.ID === oStory.ID) cur.aMedia_ = res || [];
			return cur;
		});
		this.setState({aStory});
	}
	// ▼删除一个文件
	async delOneMedia(oStory, oneMedia){
		const res = await axios.delete('/media/', {
			params: {
				mediaId: oneMedia.ID,
				fileId: oneMedia.fileId,
			},
		});
		if (!res) return this.message.error('删除文件未成功');
		this.getMediaForOneStory(oStory);
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

