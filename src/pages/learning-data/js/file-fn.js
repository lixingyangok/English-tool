/*
 * @Author: 李星阳
 * @LastEditors: 李星阳
 * @Description: 处理文件上传、下载
 */
import {
	fileToTimeLines, 
	downloadString, 
	// fileToBuffer,
	//getStrFromFile,
	// getFaleBuffer, 
} from 'assets/js/pure-fn.js';
const axios = window.axios;
// var URLSafeBase64 = require('urlsafe-base64');
// console.log('URLSafeBase64', URLSafeBase64);

export default class FileList {
	// ▼将选中的文件整理，配对，返回
	toMatchFiles(targetFiles=[]){
		const [aMedia, oSubtitle] = [...targetFiles].reduce((aResult, curFile)=>{
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
		aMedia.forEach(cur=>{
			cur.oSubtitleFile = oSubtitle[cur.file.name_]; // 字幕文件
			cur.loadingStr = !!cur.oSubtitleFile; // 标记是否在加载字幕
		});
		return aMedia;
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
		const aQueuerList = this.getFileArrToShow(aListForShow, oStory.id);
		ev.target.value = ''; // 清空
		if (!aQueuerList.length) return; //没有媒体文件就返回
		const oQueuer = Object.assign(this.state.oQueuer, {
			[oStory.ID]: aQueuerList,
		});
		this.setState({ oQueuer }, ()=>{
			this.subTitleToBlob(oStory.ID);
		});
	}
	// ▼排除文件的字幕转 Blob
	async subTitleToBlob(oStoryId){
		const aQueuerList = this.state.oQueuer[oStoryId];
		// console.log('aQueuerList', aQueuerList);
		for (const curFile of aQueuerList) {
			const {oSubtitleFile} = curFile;
			if (!oSubtitleFile) continue; //没有字幕
			console.log('curFile', curFile);
			const res = await fileToTimeLines(oSubtitleFile);
			if (!res) return;
			curFile.loadingStr = false;
			curFile.oSubtitleInfo.file = new Blob(
				[JSON.stringify(res)], {type: 'text/plain'},
			);
			const oQueuer = Object(this.state.oQueuer, {
				[oStoryId]: aQueuerList,
			});
			this.setState({ oQueuer });
		}
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
	deleteOneCandidate(oStoryID, iFileIdx){
		const {oQueuer} = this.state;
		oQueuer[oStoryID].splice(iFileIdx, 1);
		this.setState({oQueuer});
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
	
	// ▼导出字幕文件
	toExport(oSct) {
		const aStr = oSct.aLines.map(({start_, end_, text}, idx) => {
			return `${idx + 1}\n${start_} --> ${end_}\n${text}\n`;
		});
		const fileName = oSct.audioFile.name.split('.').slice(0, -1).join('.');
		downloadString(aStr.join('\n'), fileName, 'srt');
	}
};

