/*
 * @Author: 李星阳
 * @LastEditors: 李星阳
 * @Description: 处理文件上传、下载
 */
import React from 'react';
import {trainingDB, timeAgo} from 'assets/js/common.js';
import {getMediaByStoryId, getSubtitle, getQiniuToken} from 'assets/js/learning-api.js';
import {Modal} from 'antd';
import {
	fileToTimeLines, 
	fileToBlob,
	getTimeInfo,
	downloadSrt,
	arrToblob,
	// fileToBuffer,
	// getStrFromFile,
	// getFaleBuffer, 
} from 'assets/js/pure-fn.js';

const { confirm } = Modal;
const {axios} = window;
const {media: mediaTB} = trainingDB;

class beforeUpload {
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
			cur.loadingMark = !!cur.oSubtitleFile; // 标记是否在加载字幕
		});
		return aMedia;
	}
	// ▼将配对完成的文件补充一些信息，用于显示
	getFileArrToShow(aListForShow=[]){
		if (!aListForShow.length) return [];
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
				storyId: this.state.oStory.ID,
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
	toCheckFile(ev){
		const iMax = 100;
		if (ev.target.files.length > iMax) {
			return this.message.warning(`最多可选“${iMax}个”文件`);
		}
		const aQueuer = this.toMatchFiles(ev.target.files);
		this.getFileArrToShow(aQueuer);
		ev.target.value = ''; // 清空
		if (!aQueuer.length) return; //没有媒体文件就返回
		this.setState({aQueuer}, ()=>{
			this.subTitleToBlob();
		});
	}
	// ▼将排队的文件的字幕转 Blob
	async subTitleToBlob(){
		const {aQueuer} = this.state;
		for (const curFile of aQueuer) {
			const {oSubtitleFile} = curFile;
			if (!oSubtitleFile) continue; //没有字幕
			const res = await fileToTimeLines(oSubtitleFile);
			if (!res) return;
			curFile.loadingMark = false;
			curFile.oSubtitleInfo.file = arrToblob(res);
			this.setState({ aQueuer });
		}
	}
}

/*
	▲上传之前
	▼开始上传及上传之后
*/

class upload {
	async uploadAll(){
		const {length, '0': oCur} = this.state.aQueuer;
		if (!length) return;
		const oState = await this.toUpload(oCur, 0, length===1);
		if (!oState || !oState.iRest) return;
		this.uploadAll();
	}
	// ▼上传一个媒体文件+字幕
	async toUpload(oFileInfo, iFileIdx, toFresh=true) {
		const sst = this.setState.bind(this);
		sst({sLoadingAction: '正在上传'}); // 开始loading
		const sUrl = 'http://upload-z2.qiniup.com';
		const {mediaFile, oSubtitleInfo} = oFileInfo;
		const [token, oTime] = await getQiniuToken();
		if (!token) return sst({sLoadingAction: false}); // 关闭loading;
		const {data: fileRes01} = await axios.post(sUrl, { // 上传【媒体】到七牛
			token, ...mediaFile,
		});
		if (!fileRes01) { // 上传失败
			sst({sLoadingAction: false});
			return this.message.error('保存媒体文件未成功');
		}
		const oTimeInfo = getTimeInfo(oTime, 'f');
		const fileRes02 = await (async ()=>{
			if (!oSubtitleInfo) return false; // 没有字幕文件
			const {data} = await axios.post(sUrl, {
				token, ...oSubtitleInfo,
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
			subtitleFileId: fileRes02 ? fileRes02.key : '',
		});
		sst({sLoadingAction: false}); // 无论如何关闭loading
		if (!uploadRes) return this.message.error('保存媒体记录未成功');
		this.message.success('上传成功');
		if (toFresh) this.getMediaForOneStory(); //刷新【已上传】文件
		const iRest = this.deleteOneCandidate(iFileIdx); //删除【排除文件】
		return {iRest};
	}
	// ▼ 处理要上传（要拿去覆盖旧资源）的文件
	checkForUpload(ev, oMedia, iType) {
		const [oFile] = ev.target.files;
		ev.target.value = ''; // 清空
		if (!oFile || (iType !== 0 && iType !== 1)) return;
		const {warning, success} = this.message;
		if (iType === 0 && /^(audio|video)\/.+/.test(oFile.type) === false) {
			return warning('媒体文件不正确');
		}else if (iType === 1 && oFile.name.endsWith('.srt') === false) {
			return warning('字幕文件不正确');
		}
		const onOk = async ()=>{
			const res = await this.upLoadOne(oFile, oMedia, iType);
			if (!res) return warning('上传未成功');
			success('上传成功');
			this.getMediaForOneStory(); //刷新【已上传】文件
		};
		confirm({
			title: '提示',
			content: '立即上传？上传后会覆盖旧的文件！',
			onOk, // onCancel(){},
		});
	}
	// ▼上传（替换）一条数据的媒体/字幕
	async upLoadOne(oFile, oMedia, iType){
		const fileId = ['fileId', 'subtitleFileId'][iType]; // iType为0表示是字幕
		const fileName = ['fileName', 'subtitleFileName'][iType];
		const fileSize = ['fileSize', 'subtitleFileSize'][iType];
		const key = oMedia[fileId] || '';
		const [[token, oTime], file] = await Promise.all([
			getQiniuToken(key), //token值
			iType === 0 ? oFile : fileToBlob(oFile), //媒体或字幕文件
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
			[fileId]: data.key,
			[fileName]: oFile.name,
			[fileSize]: oFile.size,
			...getTimeInfo(oTime, ['f', 's'][iType]),
		});
		return res;
	}
}



class FileList {
	// ▼删除一个【待上传】的文件
	deleteOneCandidate(iFileIdx){
		const {aQueuer} = this.state;
		aQueuer.splice(iFileIdx, 1);
		this.setState({aQueuer});
		return aQueuer.length;
	}
	// ▼查询某个故事下的媒体列表
	async getMediaForOneStory(storyId){
		storyId = storyId || this.state.oStory.ID;
		const aMedia = await getMediaByStoryId(storyId);
		if (!aMedia) return;
		const aMediaFinished = aMedia.filter(cur => cur.finish === 2);
		const iFinished = aMediaFinished.length;
		const fRate = (iFinished / aMedia.length * 100).toFixed(2) * 1;
		const iRest = aMedia.length - iFinished;
		this.setState({
			aMedia,
			aMediaFinished,
			fRate,
			iRest,
		});
		this.checkMediaListInTB();
	}
	// ▼删除一个已上传的文件
	async delOneMedia(oneMedia){
		this.setState({sLoadingAction: '正在删除'});
		const {data: res} = await axios.delete('/media/', {
			params: {
				mediaId: oneMedia.ID,
				fileId: oneMedia.fileId,
				subtitleFileId: oneMedia.subtitleFileId,
			},
		});
		this.setState({sLoadingAction: ''});
		if (!res) return this.message.error('删除文件未成功');
		this.getMediaForOneStory();
		const oCollection = mediaTB.where('ID').equals(oneMedia.ID);
		oCollection.count().then(res=>{
			res && oCollection.delete();
		});
	}
	// ▼导出字幕文件
	async toExport(oMedia) {
		const {message} = this;
		const {ID, subtitleFileModifyTs, subtitleFileId} = oMedia;
		const oInTB = await mediaTB.where('ID').equals(ID).first() || {};
		const {subtitleFile_, changeTs_} = oInTB;
		if (!subtitleFileId && !subtitleFile_) {
			return message.error("没有字幕数据");
		}
		this.setState({oDownLoading: {oMedia, oInTB}});
		let iType = 0;
		const isSame = subtitleFileModifyTs === changeTs_;
		if (isSame || !subtitleFileId) iType = 2; // (两地相同 || 网上没有) 用本地的
		if (!subtitleFile_) iType = 1; // (本地也没有) 用网上的
		if (iType) return this.downloadSrtFileFn(iType);
		const tipForChoseSrt = <div>
			网上字幕：{timeAgo(subtitleFileModifyTs)}<br/>
			本地字幕：{timeAgo(changeTs_)}<br/>
			{subtitleFileModifyTs > changeTs_ ? '网新' : '本地新'}<br/>
		</div>
		this.setState({tipForChoseSrt});
	}
	// ▼下载
	async downloadSrtFileFn(iType){
		const {oMedia, oInTB} = this.state.oDownLoading;
		const {name_} = oMedia;
		const {message} = this;
		let closeFn = xx=>xx;
		if (iType===1){ // 网上
			closeFn = message.loading(`正在下载网上数据${name_}`);
			await getSubtitle(oMedia, true);
		}else if (iType===2){ // 本地
			closeFn = message.loading(`正在导出本地数据${name_}`);
			downloadSrt(oInTB.subtitleFile_, name_);
		}
		await new Promise(resolve=>setTimeout(resolve, 2.5 * 1000));
		closeFn();
	}
	// ▼添加标记，用于描述本地信息的标记
	async checkMediaListInTB(){
		const {aMedia} = this.state;
		for (let [idx, cur] of aMedia.entries()) {
			const oCollection = mediaTB.where('ID').equals(cur.ID);
			const oInTB = await oCollection.first();
			const {subtitleFileModifyTs: ts} = cur;
			cur.compare_ = ts ? '未修改' : '无字幕';
			if (!oInTB) continue;
			cur.hasMedia_ = oInTB.id;
			cur.iSrtLen_ = oInTB.subtitleFile_.length || 0;
			cur.compare_ = (()=>{
				if (!ts) return '无字幕';
				if (!oInTB.changeTs_) return '未修改';
				if (ts === oInTB.changeTs_) return '两地相同';
				cur.class_ = 'red';
				if (ts > oInTB.changeTs_) return '网新';
				return '本地新';
			})();
			aMedia[idx] = cur;
			this.setState({aMedia});
		}
	}
	// ▼变成媒体状态
	async changeFinishState(oMedia, oNew){
		const iNewVal = oNew.key * 1;
		// console.log(iNewVal);
		const {data} = await axios.put('/media/set-finish', { // 上传【媒体】到七牛
			mediaId: oMedia.ID,
			finish: iNewVal,
		});
		if (!data) return;
		this.getMediaForOneStory();
	}
};

export default window.mix(
	beforeUpload, upload, FileList,
);
