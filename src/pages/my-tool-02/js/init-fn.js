/*
 * @Author: 李星阳
 * @Date: 2021-01-17 11:30:35
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-01-27 20:13:13
 * @Description: 
 */

import {
	fileToBuffer,
	getFakeBuffer,
	getChannelDataFromBlob,
} from 'assets/js/pure-fn.js';
const axios = window.axios;

export default class {
	// ▼格式化 search
	getSearchOjb(oLocation){
		const sSearch = oLocation.search;
		if (!sSearch) return {};
		const oResult = sSearch.slice(1).split('&').reduce((result, cur)=>{
			const [key, val] = cur.split('=');
			return {...result, [key]: val};
		}, {});
		return oResult;
	}
	// ▼初始化的方法（查询故事信息并保存）
	async init({storyId, mediaId}){
		const {storyTB, oMediaTB} = this.state; // aSteps,
		const [{data: oStory}, oStoryFromTB, oMediaInTB] = await Promise.all([
			axios.get('/story/' + storyId), // 故事信息
			storyTB.where('ID').equals(storyId*1).first(), //故事信息【本地】
			oMediaTB.where('ID').equals(mediaId*1).first(), // 媒体数据【本地】
		]);
		if (!oStory) return; // 查不到故事故事，返回
		this.setState({oStory});
		if (oStoryFromTB) { // 更新本地故事数据
			storyTB.put({...oStory, id: oStoryFromTB.id}); //全量更新
		}else{
			storyTB.add(oStory);
		}
		this.setMedia(mediaId, oMediaInTB);
	}
	// ▼ 加载本地/云端媒体文件（2参是本地的媒体数据）
	async setMedia(mediaId, oMediaInTB={}){
		const {data: oMediaInfo} = await axios.get('/media/one-media/' + mediaId);
		if (!oMediaInfo) return; // 查不到媒体信息
		const {aSteps, oFirstLine} = this.state;
		const {
			id, changeTs_: changeTs,
			subtitleFile_ = [oFirstLine.dc_], 
		} = oMediaInTB; // 先加载本地字幕
		const {
			buffer, // 媒体buffer
			mediaFile_, // 媒体文件
			needUpDateDB, // 值为true表示需要更新DB
		} = await this.getMediaAndButter({oMediaInfo, oMediaInTB});
		aSteps.last_.aLines = subtitleFile_;
		const oMediaInTBForSave = (()=>{
			console.log('需要更新本地？', needUpDateDB);
			if (!needUpDateDB) { // 有 oMediaInTB 且不用更新
				oMediaInfo.id = id;
				this.setSubtitle({oMediaInfo, oMediaInTB}); // 查询字幕
				return {oMediaInTB}; // 保存到state
			}
			this.saveMediaToTb({ // 保存
				oMediaInfo, oMediaInTB, mediaFile_, buffer,
			});
		})();
		this.setState({
			aSteps, buffer, changeTs, oMediaInfo,
			loading: false,
			fileSrc: URL.createObjectURL(mediaFile_),
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
		const mediaFile_ = await (async ()=>{
			if (isSame && oMediaInTB.mediaFile_) {
				this.message.success('正在加载【本地】媒体文件');
				return oMediaInTB.mediaFile_; // 值相同取本地媒体
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
			if (isSame && oBuffer_) {
				const oBlob = oBuffer_.oChannelDataBlob_;
				oBuffer_.aChannelData_ = await getChannelDataFromBlob(oBlob);
				return oBuffer_;
			}
			this.message.success('正在读取媒体波形');
			const oResult = await fileToBuffer(mediaFile_);
			needUpDateDB = true;
			return getFakeBuffer(oResult);
		})();
		return {mediaFile_, buffer, needUpDateDB};
	}
	// ▼保存数据（不涉及字幕文件）
	async saveMediaToTb(oData){
		const {
			oMediaInTB,
			oMediaInTB: {id},
			oMediaInfo, mediaFile_, buffer,
		} = oData;
		const {aSteps, oMediaTB} = this.state;
		const subtitleFile_ = aSteps.last_.aLines;
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
		};
		oMediaInfo.id = await oMediaTB[id ? 'put' : 'add'](dataToDB);
		this.setState({oMediaInfo});
		this.setSubtitle({oMediaInfo, oMediaInTB}); // 查询字幕
	}
	// ▼加载字幕
	setSubtitle({oMediaInfo, oMediaInTB}){
		const {subtitleFileModifyTs, subtitleFileId} = oMediaInfo;
		const {changeTs_, subtitleFile_} = oMediaInTB;
		const {aSteps} = this.state; //oMediaTB
		if (!changeTs_) { // 本地无字幕
			if (subtitleFileId){ // 网上有，上网取
				this.getSubtitleFromNet(oMediaInfo); // 
			}else{ // 网上也没有
				aSteps.last_.aLines[0].text = '★没有字幕★';
				this.setState({aSteps});
				this.toSaveInDb();
			}
			return;
		}
		// ▼两地相同
		if (subtitleFile_ && changeTs_ === subtitleFileModifyTs){
			aSteps.last_.aLines = subtitleFile_;
			this.setState({aSteps});
		}
	}
	// ▼从云上获取字幕
	async getSubtitleFromNet(forMatch=false){
		const {
			id, subtitleFileId,
			subtitleFileModifyTs: changeTs,
		} = this.state.oMediaInfo;
		const qiNiuUrl = `http://qn.hahaxuexi.com/${subtitleFileId}`;
		const params = {ts: new Date() * 1};
		const {data: subtitleFile_} = await axios.get(qiNiuUrl, {params});
		if (!subtitleFile_) return;
		if (forMatch){
			this.setState({aSubtitleFromNet: subtitleFile_});
			return;
		}
		const {aSteps, oMediaTB} = this.state;
		aSteps.last_.aLines = subtitleFile_;
		this.setState({aSteps, changeTs, oSubtitleTips: 0});
		oMediaTB.update(id, {changeTs_: changeTs, subtitleFile_ }); //增量更新
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




