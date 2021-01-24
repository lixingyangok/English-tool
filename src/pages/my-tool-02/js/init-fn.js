/*
 * @Author: 李星阳
 * @Date: 2021-01-17 11:30:35
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-01-24 10:22:57
 * @Description: 
 */
import {
	// fileToTimeLines,
	fileToBuffer,
	getFaleBuffer,
	// downloadString,
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
		const [{data:oStoryInfo}, oStoryFromTB, oMedia] = await Promise.all([
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
		this.getMediaFromDb(mediaId, oMedia);
	}
	// ▼ 按媒体 id 查询媒体信息、并保存
	// ▼ 2参是本地的媒体数据
	async getMediaFromDb(mediaId, oMediaFromTB={}){
		const {data: oMediaInfo} = await axios.get('/media/one-media/' + mediaId);
		if (!oMediaInfo) return; // 查不到媒体信息
		const {id, fileModifyTs: fTs, subtitleFileModifyTs: sTs} = oMediaFromTB; // 本地媒体信息
		let [mediaFile_, subtitleFile_] = []; // 最终的媒体文件、字幕文件
		if (id && (oMediaInfo.fileModifyTs === fTs)) { // 媒体文件一样
			mediaFile_ = oMediaFromTB.mediaFile_;
		}
		if (id && sTs && (oMediaInfo.subtitleFileModifyTs === sTs)) { // 字幕文件一样
			subtitleFile_ = oMediaFromTB.subtitleFile_;
		}
		if (!mediaFile_ || !subtitleFile_) {
			return this.getMediaFromNet({ // 从网络获取
				oMediaInfo, oMediaFromTB, // id, mediaFile_, subtitleFile_,
			});
		}
		this.message.success('已加载本地数据');
		const {aSteps} = this.state; // aSteps,
		aSteps.last_.aLines = subtitleFile_ || [];
		this.setState({
			aSteps,
			loading: false,
			oMediaInfo: oMediaFromTB,
			buffer: oMediaFromTB.oBuffer,
			fileSrc: URL.createObjectURL(mediaFile_),
		});
		this.bufferToPeaks();
	}
	// ▼到网络查询媒体数据
	async getMediaFromNet({oMediaInfo, oMediaFromTB}){
		const qiNiuUrl = 'http://qn.hahaxuexi.com/';
		const params = {ts: new Date() * 1};
		const {fileId, subtitleFileId} = oMediaInfo;
		const {id, fileModifyTs: fTs, subtitleFileModifyTs: sTs} = oMediaFromTB;
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
			const data = [this.state.oFirstLine];
			if (!subtitleFile_) { // 没有旧文件
				if (!oMediaInfo.subtitleFileId) {
					needToSetFirstLine = true;
					return {data};
				}
				return axios.get(`${qiNiuUrl}${subtitleFileId}`, // 字幕文件 
					{params},
				);
			}
			if (!sTs){
				needToSetFirstLine = true;
				return {data};
			}
			const isSame = sTs === oMediaInfo.subtitleFileModifyTs; //本地文件是新的
			if (isSame) return {data: subtitleFile_};
		})();
		const [p01, p02] = await Promise.all([a01, a02]);
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
	// 给章节添加buffer
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