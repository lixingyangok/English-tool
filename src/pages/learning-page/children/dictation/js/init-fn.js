/*
 * @Author: 李星阳
 * @Date: 2021-01-17 11:30:35
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-03-14 15:19:04
 * @Description: 
 */

import {
	fileToBuffer,
	getFakeBuffer,
	getChannelDataFromBlob,
} from 'assets/js/pure-fn.js';
import {getOneMedia, getSubtitle} from 'assets/js/learning-api.js';
import {trainingDB} from 'assets/js/common.js';
// import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

const {media: mediaTB} = trainingDB;
const axios = window.axios;

class part01{
	// ▼初始化（查询故事信息
	async init(){
		const oStory = this.context.oStoryInfo;
		const {words, names} = oStory;
		const aWords = words ? words.split(',') : [];
		const aNames = names ? names.split(',') : [];
		const oWords = aWords.reduce((oResult, cur)=>({
			...oResult, [cur.toLowerCase()]: true,
		}), {});
		const oNames = aNames.reduce((oResult, cur)=>({
			...oResult, [cur.toLowerCase()]: true,
		}), {});
		setTimeout(()=>{
			this.setState({oStory, aWords, aNames, oWords, oNames});
		}, 1 * 1000);
	}
	// ▼查询媒体信息，做一些清空操作等
	async getMediaInfo(mediaId){
		const [oMediaInfo, oMediaInTB={}] = await Promise.all([
			getOneMedia(mediaId),
			mediaTB.where('ID').equals(mediaId * 1).first(),
		]);
		if (!oMediaInfo) return; // 查不到媒体信息
		const oWaveWrap = this.oWaveWrap.current;
		if (oWaveWrap) oWaveWrap.scrollLeft = 0; // 滚动条归位
		this.context.setMedia(oMediaInfo); // 汇报父级页面当前媒体信息
		this.setSubtitle(oMediaInfo, oMediaInTB); // 查询字幕
		this.setMedia(oMediaInfo, oMediaInTB); // 查询媒体
	}
}


// ▼媒体文件
const aboutMedia = class {
	// ▼ 加载本地/云端媒体文件（2参是本地的媒体数据）
	async setMedia(oMediaInfo, oMediaInTB){
		const { id, changeTs_: changeTs, } = oMediaInTB; // 先加载本地字幕
		const {
			buffer, // 媒体buffer
			mediaFile_, // 媒体文件
			needUpDateDB, // true = 需要更新DB
		} = await this.getMediaAndButter({oMediaInfo, oMediaInTB});
		if (!buffer) return this.setState({loading: false});
		const oMediaInTBForSave = (()=>{
			if (!needUpDateDB) { // 不用更新
				oMediaInfo.id = id;
				return {oMediaInTB}; // 保存保存到state
			}
			this.saveMediaToTb({ // 保存到浏览 db
				oMediaInfo, oMediaInTB, mediaFile_, buffer,
			});
		})();
		this.setState({
			oMediaInfo, mediaFile_, buffer,
			changeTs, loading: false,
			fileSrc: URL.createObjectURL(mediaFile_), // 10兆以下小文件 < 1毫秒
			// fileSrc: URL.createObjectURL(mediaFile_, {type: 'video/aac'}),
			...oMediaInTBForSave,
		});
		this.bufferToPeaks();
		oMediaInTB.subtitleFile_ || this.giveUpThisOne(0); // 智能处理第一句
	}
	
	// ▼取得媒体文件、和buffer
	async getMediaAndButter({oMediaInfo, oMediaInTB}){
		let {fileModifyTs: fTs, subtitleFile_, oBuffer_} = oMediaInTB; // 本地媒体信息
		const isSame = fTs && (fTs === oMediaInfo.fileModifyTs); // 两地媒体文件一致
		let needUpDateDB = !subtitleFile_; // 值为true表示需要更新DB
		const {success, error} = this.message;
		const mediaFile_ = await (async ()=>{
			if (isSame && oMediaInTB.mediaFile_) {
				success('已加载【本地】媒体文件');
				return oMediaInTB.mediaFile_; // 值相同取本地媒体
			}
			success('正在加载【云端】媒体文件');
			const qiNiuUrl = 'http://qn.hahaxuexi.com/';
			const {data} = await axios.get(`${qiNiuUrl}${oMediaInfo.fileId}`,  // 返回新数据
				{responseType: "blob", params: {ts: new Date() * 1}},
			);
			needUpDateDB = true;
			return data; // 返回：Blob {size: 620705, type: "audio/mpeg"}
		})();
		const buffer = await (async ()=>{
			if (isSame && oBuffer_) {
				const oBlob = oBuffer_.oChannelDataBlob_;
				oBuffer_.aChannelData_ = await getChannelDataFromBlob(oBlob);
				return oBuffer_;
			}
			needUpDateDB = true;
			success('正在读取媒体波形');
			const oResult = await fileToBuffer(mediaFile_);
			if (oResult) return getFakeBuffer(oResult);
			error('读取媒体波形未成功');
			return;
		})();
		return {mediaFile_, buffer, needUpDateDB};
	}
	// ▼保存数据（不涉及字幕文件）
	async saveMediaToTb(oData){
		const {
			oMediaInTB: {id},
			oMediaInfo, mediaFile_, buffer,
		} = oData;
		const {oStory, aLineArr: subtitleFile_} = this.state;
		const oBuffer_ = Object.entries(buffer).reduce((result, [key, val])=>{
			if (key === 'aChannelData_') {
				result[key] = [];
			}else if (key === 'oChannelDataBlob_'){
				result[key] = new Blob([buffer.aChannelData_], {type: 'text/plain'});
			}else{
				result[key] = val;
			}
			return result;
		}, {});
		const dataToDB = {
			...oMediaInfo, mediaFile_, subtitleFile_, oBuffer_,
			...(id ? {id} : null),
			// ▼ 0开头方便调试
			'0': `${oMediaInfo.fileName} ● ${oStory.storyName}`,
		};
		oMediaInfo.id = await mediaTB[id ? 'put' : 'add'](dataToDB);
		this.setState({oMediaInfo});
	}
	
	// ▼音频数据转换波峰数据
	bufferToPeaks(perSecPx_) {
		const oWaveWrap = this.oWaveWrap.current;
		const {offsetWidth, scrollLeft} = oWaveWrap || {};
		const {buffer, iPerSecPx} = this.state;
		if (!buffer || !oWaveWrap) return;
		const obackData = this.getPeaks(
			buffer, (perSecPx_ || iPerSecPx), scrollLeft, offsetWidth,
		);
		this.setState({ ...obackData });
		this.toDraw();
		return obackData.aPeaks;
	}
}


// ▼字幕
class aboutSubtitle{
	// ▼加载字幕
	setSubtitle(oMediaInfo, oMediaInTB){
		const {subtitleFileModifyTs, subtitleFileId} = oMediaInfo;
		const {changeTs_, subtitleFile_, id} = oMediaInTB; // 可能得不到值
		const {aLineArr} = this.state;
		if (!changeTs_ && !subtitleFile_) { // 本地无字幕
			if (subtitleFileId){ // 网上有，上网取
				this.getSubtitleFromNet(true); // 查询网络字幕，并应用
			}else{ // 网上也没有
				aLineArr[0].text = '★没有字幕★';
				this.setState({aLineArr});
				this.toSaveInDb(id);
			}
			return;
		}
		// 本地有，就先把本地字幕显示出来
		const oFirst = {
			aLineArr: subtitleFile_,
			iCurLineIdx: 0,
			sCurLineTxt: subtitleFile_[0].text,
		};
		this.aHistory = [oFirst.dc_];
		this.setState(oFirst);
		const gap = changeTs_ - subtitleFileModifyTs;
		if (gap === 0) return;
		if (subtitleFileModifyTs > changeTs_ ){
			return this.message.warning('网络字幕新，需要同步');
		}
		this.message.warning('本地字幕新，需要同步');
	}
	// ▼从云上获取字幕
	async getSubtitleFromNet(toSave=false){
		const {oMediaInfo} = this.state;
		if (!oMediaInfo.subtitleFileId) return; //没有字幕就不用查询
		const aLineArr = await getSubtitle(oMediaInfo);
		if (!aLineArr) return;
		this.setState({aSubtitleFromNet: aLineArr});
		toSave && this.useSubtitleFromNet(aLineArr);
	}
}

export default window.mix(
	part01, aboutMedia, aboutSubtitle,
);


// if (0) {
// 	const ffmpeg = createFFmpeg({
// 		log: true,
// 		corePath: `${window.location.origin}/ffmpeg-core.js`,
// 	});
// 	console.time('ffmpeg 耗时 ■■■■■■■■■■');
// 	const {'1': mp3Data} = await Promise.all([
// 		ffmpeg.load(), fetchFile(mediaFile_),
// 	]);
// 	let fileName = 'mu.mp3'; //oMediaInfo.fileName + '.mp3';
// 	console.log('fileName - - - - ', fileName);
// 	ffmpeg.FS('writeFile', fileName, mp3Data); // 没有返回值
// 	await ffmpeg.run('-i', fileName, 'music1.ogg');
// 	// 10M 文件转 aac、ogg 之后体积减半，耗时 20 多秒
// 	console.timeEnd('ffmpeg 耗时 ■■■■■■■■■■');
// 	const bata = ffmpeg.FS('readFile', 'music1.ogg');
// 	const myBlob2 = new Blob(
// 		[bata.buffer], {type: 'audio/ogg'},
// 	);
// 	console.log('新体积---■', ~~(myBlob2.size / 1024) + 'kb');
// 	// mediaFile_ = myBlob2;
// }