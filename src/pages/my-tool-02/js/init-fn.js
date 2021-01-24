/*
 * @Author: 李星阳
 * @Date: 2021-01-17 11:30:35
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-01-24 16:14:52
 * @Description: 
 */
import {
	fileToBuffer,
	getFaleBuffer,
	getFakeBuffer,
	getChannelDataFromBlob,
} from 'assets/js/pure-fn.js';
const axios = window.axios;

export default class {
	// ▼格式化search
	getSearchOjb(oLocation){
		const sSearch = oLocation.search;
		if (!sSearch) return {};
		const oResult = sSearch.slice(1).split('&').reduce((result, cur)=>{
			const [key, val] = cur.split('=');
			return {...result, [key]: val};
		}, {});
		return oResult;
	}
	// ▼初始化的方法
	async init({storyId, mediaId}){
		const {storyTB, oMediaTB} = this.state; // aSteps,
		const [{data:oStoryInfo}, oStoryFromTB, oMediaFromTB] = await Promise.all([
			axios.get('/story/' + storyId), // 故事信息
			storyTB.where('ID').equals(storyId*1).first(), //故事信息【本地】
			oMediaTB.where('ID').equals(mediaId*1).first(), // 媒体数据【本地】
		]);
		if (!oStoryInfo) return; // 查不到故事故事，返回
		if (oStoryFromTB) { // 更新本地故事数据
			storyTB.put({...oStoryInfo, id: oStoryFromTB.id}); //全量更新
		}else{
			storyTB.add(oStoryInfo);
		}
		this.setMedia(mediaId, oMediaFromTB);
	}
	// ▼ 加载本地/云端媒体文件（2参是本地的媒体数据）
	async setMedia(mediaId, oMediaFromTB={}){
		const {data: oMediaInfo} = await axios.get('/media/one-media/' + mediaId);
		if (!oMediaInfo) return; // 查不到媒体信息
		const {aSteps, oFirstLine} = this.state;
		const {subtitleFile_ = ([oFirstLine.dc_])} = oMediaFromTB; // 先加载本地字幕
		const {
			buffer, // 媒体buffer
			mediaFile_, // 媒体文件
			needUpDateDB, // 值为true表示需要更新DB
		} = await this.getMediaAndButter({oMediaInfo, oMediaFromTB});
		aSteps.last_.aLines = subtitleFile_; 
		this.setState({
			aSteps,
			buffer,
			loading: false,
			oMediaInfo: oMediaInfo, // {...oMediaInfo, ...oMediaFromTB},
			fileSrc: URL.createObjectURL(mediaFile_),
		});
		this.bufferToPeaks();
		oMediaFromTB.subtitleFile_ || this.giveUpThisOne(0); // 智能处理第一句
		this.setSubtitle({oMediaInfo, oMediaFromTB}); // 查询字幕
		needUpDateDB && this.saveMediaToTb({ // 保存
			oMediaInfo, oMediaFromTB,
			mediaFile_, buffer, // subtitleFile_, 
		});
	}
	// ▼取得媒体文件、和buffer
	async getMediaAndButter({oMediaInfo, oMediaFromTB}){
		let {fileModifyTs: fTs, subtitleFile_, oBuffer} = oMediaFromTB; // 本地媒体信息
		const isSame = fTs && (fTs === oMediaInfo.fileModifyTs); // 两地媒体文件一致
		let needUpDateDB = !subtitleFile_; // 值为true表示需要更新DB
		const mediaFile_ = await (async ()=>{
			if (isSame && oMediaFromTB.mediaFile_) {
				this.message.success('正在加载【本地】媒体文件');
				return oMediaFromTB.mediaFile_; // 值相同取本地媒体
			}
			this.message.success('正在加载【云端】媒体文件');
			const qiNiuUrl = 'http://qn.hahaxuexi.com/';
			const {data} = await axios.get(`${qiNiuUrl}${oMediaInfo.fileId}`,  // 返回新数据
				{responseType: "blob", params: {ts: new Date() * 1}},
			);
			needUpDateDB = true;
			return data;
		})();
		const buffer = await (async ()=>{
			if (isSame && oBuffer) {
				const oBlob = oBuffer.oChannelDataBlob_;
				oBuffer.aChannelData_ = await getChannelDataFromBlob(oBlob);
				return oBuffer;
			}
			this.message.success('正在读取媒体波形');
			const oResult = await fileToBuffer(mediaFile_);
			needUpDateDB = true;
			return getFakeBuffer(oResult);
		})();
		return {mediaFile_, buffer, needUpDateDB};
	}
	async saveMediaToTb(oData){
		const {
			oMediaFromTB: {id},
			oMediaInfo, mediaFile_, buffer,
		} = oData;
		const subtitleFile_ = this.state.aSteps.last_.aLines;
		const oBuffer = Object.entries(buffer).reduce((result, [key, val])=>{
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
			...oMediaInfo, mediaFile_, subtitleFile_, oBuffer,
			...(id ? {id} : null),
		};
		this.state.oMediaTB[id ? 'put' : 'add'](dataToDB);
	}
	setSubtitle({oMediaInfo, oMediaFromTB}){
		const {subtitleFileModifyTs} = oMediaInfo;
		const {subtitleFileModifyTs: sTs} = oMediaFromTB;
		if (sTs >= subtitleFileModifyTs) return; // 本地字幕为最新，返回
		
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







const c01 = class {
	// if (!mediaFile_ || !subtitleFile_) {
	// 	return this.getMediaFromNet({ // 从网络获取
	// 		oMediaInfo, oMediaFromTB, // id, mediaFile_, subtitleFile_,
	// 	});
	// }
	// this.message.success('已加载本地数据');
	// ▼到网络查询媒体数据
	async getMediaFromNet({oMediaInfo, oMediaFromTB}){
		const {id} = oMediaFromTB;
		let {mediaFile_, subtitleFile_} = oMediaFromTB;
		const arr = this.getPromiseArr({oMediaInfo, oMediaFromTB});
		const [p01, p02, needToSetFirstLine] = await Promise.all(arr);
		[mediaFile_, subtitleFile_] = [p01.data, p02.data];
		const dataToDB = {
			...oMediaInfo, mediaFile_, subtitleFile_,
			...(id ? {id} : null),
		};
		const {oMediaTB, aSteps} = this.state;
		aSteps.last_.aLines = subtitleFile_;
		oMediaInfo.id = await oMediaTB[id ? 'put' : 'add'](dataToDB);
		const buffer = await this.getSectionBuffer(oMediaInfo.id);
		this.setState({
			loading: false,
			oMediaInfo, buffer, aSteps,
			fileSrc: URL.createObjectURL(mediaFile_),
		});
		this.bufferToPeaks();
		needToSetFirstLine && this.giveUpThisOne(0);
	}
	// 给章节添加buffer TODO:废弃？
	async getSectionBuffer(iMediaIdInTb){
		const {oMediaTB} = this.state;
		const oMediaInTb = await oMediaTB.where('id').equals(iMediaIdInTb).first();
		let oBuffer = await fileToBuffer(oMediaInTb.mediaFile_);
		this.message.success('解析完成，正在保存波形数据');
		oBuffer = getFaleBuffer(oBuffer);
		oBuffer.aChannelData_ = await (async ()=>{
			const theBlob = oBuffer.oChannelDataBlob_;
			if (!theBlob.arrayBuffer) return;
			const res = await theBlob.arrayBuffer();
			return new Int8Array(res);
		})();
		oMediaTB.update(
			iMediaIdInTb, {...oMediaInTb, oBuffer},
		);
		this.message.success('波形数据保存完成');
		return oBuffer;
	}
	getPromiseArr({oMediaInfo, oMediaFromTB}){
		const qiNiuUrl = 'http://qn.hahaxuexi.com/';
		const params = {ts: new Date() * 1};
		const {fileId, subtitleFileId} = oMediaInfo;
		const {fileModifyTs: fTs} = oMediaFromTB;
		let {mediaFile_, subtitleFile_} = oMediaFromTB;
		let needToSetFirstLine = false;
		const a01 = (()=>{
			const isNew = fTs >= oMediaInfo.fileModifyTs; //本地文件是新的
			if (mediaFile_ && isNew) return {data: mediaFile_}; // 返回旧数据
			return axios.get(`${qiNiuUrl}${fileId}`,  // 返回新数据
				{responseType: "blob", params},
			);
		})();
		const a02 = (() => {
			if (subtitleFile_) return {data: subtitleFile_}; // 本地有字幕，先加载再说
			if (subtitleFileId) return axios.get( // 本地无，网上有
				`${qiNiuUrl}${subtitleFileId}`, {params}, // 查询网上字幕
			); // ▼至此表示，本地无字幕、网上无字幕
			needToSetFirstLine = true;
			return {data: [this.state.oFirstLine]}; // 显示第一句
		})();
		// if sTs
		// const isSame = sTs === oMediaInfo.subtitleFileModifyTs; //本地文件是新的
		this.informToChoose({oMediaInfo, oMediaFromTB});
		return [a01, a02, needToSetFirstLine];
	}
	informToChoose({oMediaInfo, oMediaFromTB}){
		const {subtitleFileModifyTs: fTsFromTB} = oMediaFromTB;
		const {subtitleFileModifyTs: fTsFromNet} = oMediaInfo;
		if (fTsFromTB && fTsFromTB === fTsFromNet) return;
		console.log('网上字幕和本地字幕不同步');
	}
}

if (0) console.log(c01);