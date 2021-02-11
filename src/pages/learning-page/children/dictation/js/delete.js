/*
 * @Author: 李星阳
 * @Date: 2021-01-24 19:35:31
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-01-24 19:35:39
 * @Description: 
 */


const c01 = class {
	// if (!mediaFile_ || !subtitleFile_) {
	// 	return this.getMediaFromNet({ // 从网络获取
	// 		oMediaInfo, oMediaInTB, // id, mediaFile_, subtitleFile_,
	// 	});
	// }
	// this.message.success('已加载本地数据');
	// ▼到网络查询媒体数据
	async getMediaFromNet({oMediaInfo, oMediaInTB}){
		const {id} = oMediaInTB;
		let {mediaFile_, subtitleFile_} = oMediaInTB;
		const arr = this.getPromiseArr({oMediaInfo, oMediaInTB});
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
	getPromiseArr({oMediaInfo, oMediaInTB}){
		const qiNiuUrl = 'http://qn.hahaxuexi.com/';
		const params = {ts: new Date() * 1};
		const {fileId, subtitleFileId} = oMediaInfo;
		const {fileModifyTs: fTs} = oMediaInTB;
		let {mediaFile_, subtitleFile_} = oMediaInTB;
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
		this.informToChoose({oMediaInfo, oMediaInTB});
		return [a01, a02, needToSetFirstLine];
	}
	informToChoose({oMediaInfo, oMediaInTB}){
		const {subtitleFileModifyTs: fTsFromTB} = oMediaInTB;
		const {subtitleFileModifyTs: fTsFromNet} = oMediaInfo;
		if (fTsFromTB && fTsFromTB === fTsFromNet) return;
		console.log('网上字幕和本地字幕不同步');
	}
}

if (0) console.log(c01);