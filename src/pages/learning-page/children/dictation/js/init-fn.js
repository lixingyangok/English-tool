/*
 * @Author: 李星阳
 * @Date: 2021-01-17 11:30:35
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-02-15 21:15:56
 * @Description: 
 */

import {
	fileToBuffer,
	getFakeBuffer,
	getChannelDataFromBlob,
} from 'assets/js/pure-fn.js';
import {getOneMedia} from 'common/js/learning-api.js';
import {trainingDB} from 'common/js/common.js';

const {media: mediaTB, story: storyTB} = trainingDB;
const axios = window.axios;

export default class {
	// ▼初始化的方法（查询故事信息并保存）
	async init(){
		const oStory = this.context.oStoryInfo;
		const {ID, words, names} = oStory;
		const oStoryFromTB = await storyTB.where('ID').equals(ID).first();
		const aWords = words ? words.split(',') : [];
		const aNames = names ? names.split(',') : [];
		this.setState({oStory, aWords, aNames});
		if (oStoryFromTB) { // 更新本地故事数据
			storyTB.put({...oStory, id: oStoryFromTB.id}); //全量更新
		}else{
			storyTB.add(oStory);
		}
	}
	// ▼ 加载本地/云端媒体文件（2参是本地的媒体数据）
	async setMedia(mediaId){
		const {oFirstLine} = this.state;
		const [oMediaInfo, oMediaInTB={}] = await Promise.all([
			getOneMedia(mediaId),
			mediaTB.where('ID').equals(mediaId*1).first(),
		]);
		if (!oMediaInfo) return; // 查不到媒体信息
		this.context.setMedia(oMediaInfo);
		this.setState({
			iCurStep: 0,
			aSteps: [{iCurLine: 0, aLines: [oFirstLine.dc_]}],
		});
		const {
			id, changeTs_: changeTs,
			subtitleFile_ = [oFirstLine.dc_], 
		} = oMediaInTB; // 先加载本地字幕
		const {
			buffer, // 媒体buffer
			mediaFile_, // 媒体文件
			needUpDateDB, // 值为true表示需要更新DB
		} = await this.getMediaAndButter({oMediaInfo, oMediaInTB});
		if (!buffer) return this.setState({loading: false});
		const {aSteps} = this.state;
		aSteps.last_.aLines = subtitleFile_;
		const oMediaInTBForSave = (()=>{
			console.log('是否需要更新本地数据：', needUpDateDB);
			if (!needUpDateDB) { // 有 oMediaInTB 且不用更新
				oMediaInfo.id = id;
				this.setSubtitle({oMediaInfo, oMediaInTB}); // 查询字幕
				return {oMediaInTB}; // 保存到state
			}
			this.saveMediaToTb({ // 保存到浏览 db
				oMediaInfo, oMediaInTB, mediaFile_, buffer,
			});
		})();
		this.setState({
			oMediaInfo, mediaFile_, buffer,
			aSteps, changeTs, loading: false,
			fileSrc: URL.createObjectURL(mediaFile_), // 10兆以下小文件 < 1毫秒
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
			return data;
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
			oMediaInTB,
			oMediaInTB: {id},
			oMediaInfo, mediaFile_, buffer,
		} = oData;
		const {oStory, aSteps} = this.state;
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
			// ▼添加一个记号方便调试
			'0': `${oMediaInfo.fileName} ● ${oStory.storyName}`,
		};
		oMediaInfo.id = await mediaTB[id ? 'put' : 'add'](dataToDB);
		this.setState({oMediaInfo});
		this.setSubtitle({oMediaInfo, oMediaInTB}); // 查询字幕
	}
	// ▼加载字幕
	setSubtitle({oMediaInfo, oMediaInTB}){
		const {subtitleFileModifyTs, subtitleFileId} = oMediaInfo;
		const {changeTs_, subtitleFile_} = oMediaInTB;
		const {aSteps} = this.state;
		if (!changeTs_) { // 本地无字幕
			if (subtitleFileId){ // 网上有，上网取
				this.getSubtitleFromNet(true); // 查询网络字幕
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
	async getSubtitleFromNet(toSave=false){
		const { subtitleFileId } = this.state.oMediaInfo;
		if (!subtitleFileId) return; //没有字幕就不用查询
		const qiNiuUrl = `http://qn.hahaxuexi.com/${subtitleFileId}`;
		const params = {ts: new Date() * 1};
		const {data: subtitleFile_} = await axios.get(qiNiuUrl, {params});
		if (!subtitleFile_) return;
		this.setState({aSubtitleFromNet: subtitleFile_});
		toSave && this.useSubtitleFromNet(subtitleFile_);
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




