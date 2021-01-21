/*
 * @Author: 李星阳
 * @LastEditors: 李星阳
 * @Description: 处理文件上传、下载
 */
import {
	fileToTimeLines, 
	downloadString, 
	fileToBlobForUpload,
	getTimeInfo,
	getQiniuToken,
	// fileToBuffer,
	//getStrFromFile,
	// getFaleBuffer, 
} from 'assets/js/pure-fn.js';
const {axios} = window;
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
	getFileArrToShow(aListForShow, oStoryID, oMedia){
		if (!(aListForShow || {}).length) return [];
		aListForShow.forEach(oItem => { // 用于显示和上传的表格
			const {file, oSubtitleFile} = oItem;
			oItem.oCoverTo = oMedia; // 覆盖目标（可能为空）
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
	}
	// ▼把2类文件组织成列表显示出来，用于准备上传
	toCheckFile(ev, oStory, oMedia){
		const iMax = oMedia ? 1 : 100;
		if (ev.target.files.length > iMax * 2) {
			return this.message.warning(`最多可选“${iMax}对”文件`);
		}
		const aListForShow = this.toMatchFiles(ev.target.files);
		this.getFileArrToShow(aListForShow, oStory.ID, oMedia);
		ev.target.value = ''; // 清空
		if (!aListForShow.length) return; //没有媒体文件就返回
		const oQueuer = Object.assign(this.state.oQueuer, {
			[oStory.ID]: aListForShow,
		});
		console.log('oMedia', oMedia)
		this.setState({ oQueuer }, ()=>{
			this.subTitleToBlob(oStory.ID);
		});
	}
	// ▼将排队的文件的字幕转 Blob
	async subTitleToBlob(oStoryId){
		const aQueuerList = this.state.oQueuer[oStoryId];
		for (const curFile of aQueuerList) {
			const {oSubtitleFile} = curFile;
			if (!oSubtitleFile) continue; //没有字幕
			const res = await fileToTimeLines(oSubtitleFile);
			if (!res) return;
			curFile.loadingStr = false;
			curFile.oSubtitleInfo.file = new Blob(
				[JSON.stringify(res)],
				{type: 'application/json;charset=utf-8'}, //
			);
			const oQueuer = Object(this.state.oQueuer, {
				[oStoryId]: aQueuerList,
			});
			this.setState({ oQueuer });
		}
	}
	// ▼上传一个媒体文件+字幕
	async toUpload(oStory, oFileInfo, iFileIdx) {
		this.setState({loading: true}); // 开始loading
		const sUrl = 'http://upload-z2.qiniup.com';
		const {oCoverTo={}, mediaFile, oSubtitleInfo} = oFileInfo;
		let [token, oTime] = await getQiniuToken(oCoverTo.fileId);
		if (!token) return this.setState({loading: false}); // 关闭loading;
		const {data: fileRes01} = await axios.post(sUrl, { // 上传媒体到七牛
			token, ...mediaFile,
			...(oCoverTo.fileId ? {key: oCoverTo.fileId} : null),
		});
		if (!fileRes01) { //上传失败
			this.setState({loading: false});
			return this.message.error('保存媒体文件未成功');
		}
		const oTimeInfo = getTimeInfo(oTime, 'f');
		const fileRes02 = await (async ()=>{
			if (!oSubtitleInfo) return false; // 没有字幕文件
			[token, oTime] = await getQiniuToken(oCoverTo.subtitleFileId);
			if (!token) {
				this.setState({loading: false}); // 关闭loading;
				return false;
			}
			const {data} = await axios.post(sUrl, {
				token, ...oSubtitleInfo,
				...(oCoverTo.subtitleFileId ? {key: oCoverTo.subtitleFileId} : null),
			});
			if (!data) {
				this.message.error('字幕上传未成功');
				return false;
			}
			getTimeInfo(oTime, 's', oTimeInfo);
			return data;
		})();
		// ▼再上传到自已的服务器
		const {data: uploadRes} = await axios.post('/media', { // 保存媒体记录
			...oFileInfo.forOwnDB,
			...oTimeInfo,
			fileId: fileRes01.key,
			subtitleFileId: (()=>{
				if (fileRes02) return fileRes02.key;
				return oCoverTo.subtitleFileId || '';
			})(),
		});
		this.setState({loading: false}); // 无论如何关闭loading
		if (!uploadRes) return this.message.error('保存媒体记录未成功');
		this.message.success('上传成功');
		this.deleteOneCandidate(oStory.ID, iFileIdx); //删除【排除文件】
		this.getMediaForOneStory(oStory); //刷新【已上传】文件
	}
	// ▼替换一条数据的媒体/字幕
	async upLoadOne(ev, oStory, oMedia, iType){
		const [oFile] = ev.target.files;
		if (!oFile || (iType !== 0 && iType !== 1)) return;
		if (iType === 0 && /^(audio|video)\/.+/.test(oFile.type) === false) {
			return this.message.warning('选择正确的媒体文件');
		}else if (iType === 1 && oFile.name.endsWith('.srt') === false) {
			return this.message.warning('选择字幕的媒体文件');
		}
		const fileId = ['fileId', 'subtitleFileId'][iType];
		const fileName = ['fileName', 'subtitleFileName'][iType];
		const fileSize = ['fileSize', 'subtitleFileSize'][iType];
		const key = oMedia[fileId] || '';
		const [[token, oTime], file] = await Promise.all([
			getQiniuToken(key), //token值
			iType === 0 ? oFile : fileToBlobForUpload(oFile), //媒体或字幕文件
		]);
		if (!token) return;
		const sUrl = 'http://upload-z2.qiniup.com';
		const {data} = await axios.post(sUrl, { // 上传媒体到七牛
			token, file, 
			fileName: oFile.name,
			...(key ? {key} : {}),
		});
		if (!data) return;
		const {data: res} = await axios.put('/media/update-file', {
			ID: oMedia.ID,
			[fileName]: oFile.name,
			[fileSize]: oFile.size,
			...getTimeInfo(oTime, ['f', 's'][iType]),
		});
		if (!res) return;
		this.getMediaForOneStory(oStory); //刷新【已上传】文件
		this.message.success('上传成功');
	}
	// ▼删除一个【待上传】的文件
	deleteOneCandidate(oStoryID, iFileIdx){
		const {oQueuer} = this.state;
		oQueuer[oStoryID].splice(iFileIdx, 1);
		this.setState({oQueuer});
	}
	// ▼查询某个故事下的文件
	async getMediaForOneStory(oStory){ 
		const {data: res} = await axios.get('/media/' + oStory.ID);
		if (!res) return;
		const aStory = this.state.aStory.map(cur=>{
			if (cur.ID === oStory.ID) cur.aMedia_ = res || [];
			return cur;
		});
		this.setState({aStory});
	}
	// ▼删除一个已上传的文件
	async delOneMedia(oStory, oneMedia){
		const {data: res} = await axios.delete('/media/', {
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
	// async downloadOneMedia(oStory, oneMedia){
	// 	const filePath = 'http://qn.hahaxuexi.com/' + oneMedia.fileId;
	// 	const {data: res} = await axios.get(filePath, {
	// 		responseType: "blob",
	// 	});
	// 	const mediaFile = new File( [res], oneMedia.fileName, {
	// 		type: res.type,
	// 	});
	// 	console.log('mediaFile\n', mediaFile);
	// 	this.saveOneMedia(oStory, {
	// 		...oneMedia, mediaFile,
	// 	});
	// }
	
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
