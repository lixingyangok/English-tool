/*
 * @Author: 李星阳
 * @Date: 2021-01-17 11:30:35
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-01-22 20:19:46
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
		const {id, fileModifyTs, subtitleFileModifyTs} = oMediaFromTB; // 本地媒体信息
		let [mediaFile_, subtitleFile_] = []; // 最终的媒体文件、字幕文件
		if (id && (oMediaInfo.fileModifyTs === fileModifyTs)) { // 媒体文件一样
			mediaFile_ = oMediaFromTB.mediaFile_;
		}
		if (id && (oMediaInfo.subtitleFileModifyTs === subtitleFileModifyTs)) { // 字幕文件一样
			subtitleFile_ = oMediaFromTB.subtitleFile_;
		}
		if (!mediaFile_ || !subtitleFile_) {
			return this.getMediaFromNet({ // 从网络获取
				id, oMediaInfo,
				mediaFile_, subtitleFile_,
			});
		}
		console.log('本地【有】数据');
		const {aSteps} = this.state; // aSteps,
		aSteps.last_.aLines = subtitleFile_;
		this.setState({
			loading: false,
			fileSrc: URL.createObjectURL(mediaFile_),
			buffer: oMediaFromTB.oBuffer,
			aSteps,
		});
		this.bufferToPeaks();
	}
	// ▼到网络查询媒体数据
	async getMediaFromNet(ooo){
		const {oMediaInfo, id, mediaFile_, subtitleFile_} = ooo;
		const [p01, p02] = await Promise.all([
			mediaFile_ || axios.get( // 媒体文件
				`http://qn.hahaxuexi.com/${oMediaInfo.fileId}`,
				{responseType: "blob"},
			),
			subtitleFile_ || axios.get( // 字幕文件
				`http://qn.hahaxuexi.com/${oMediaInfo.subtitleFileId}`, 
				{params: {ts: new Date() * 1}},
			),
		]);
		const dataToDB = {
			...oMediaInfo,
			mediaFile_: mediaFile_ || p01.data,
			subtitleFile_: subtitleFile_ || p02.data,
			...(id ? {id} : null),
		};
		const {oMediaTB, aSteps} = this.state; // aSteps,
		const sMethod = id ? 'put' : 'add';
		const idInTb = await oMediaTB[sMethod](dataToDB);
		const buffer = await this.getSectionBuffer(idInTb);
		aSteps.last_.aLines = subtitleFile_;
		this.setState({
			loading: false,
			fileSrc: URL.createObjectURL(mediaFile_), 
			buffer,
			aSteps,
		});
		this.bufferToPeaks();
	}
	// 给章节添加buffer
	async getSectionBuffer(iMediaIdInTb){
		const {oMediaTB} = this.state; // aSteps,
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