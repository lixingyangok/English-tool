/*
 * @Author: 李星阳
 * @Date: 2021-01-17 11:30:35
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-01-17 12:46:35
 * @Description: 
 */
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
	// ▼主要方法等
	async init({storyId, mediaId}){
		console.log('init()');
		const {storyTB, oMediaTB} = this.state; // aSteps,
		const [oStoryInfo, oStoryFromTB, oMedia] = await Promise.all([
			axios.get('/story/' + storyId),
			storyTB.where('ID').equals(storyId*1).first(),
			oMediaTB.where('ID').equals(mediaId*1).first(),
		]);
		if (!oStoryInfo) return; // 查不到故事故事，返回
		if (oStoryFromTB) {
			storyTB.put({...oStoryInfo, id: oStoryFromTB.id}); //全量更新
		}else{
			storyTB.add(oStoryInfo);
		}
		this.getMedia(mediaId, oMedia);
	}
	// ▼ 按媒体 id 查询媒体信息
	async getMedia(mediaId, oMedia){
		// const {oMediaTB} = this.state; // aSteps,
		const media = await axios.get('/media/one-media/' + mediaId);
		console.log('媒体：media', media);
		const promiseArr = await Promise.all([
			axios.get('http://qn.hahaxuexi.com/' + media.fileId, {responseType: "blob"}),
			axios.get('http://qn.hahaxuexi.com/' + media.subtitleFileId),
		]);
		console.log(promiseArr[0]);
		console.log(promiseArr[1]);
	}
	async init123({storyId, mediaId}){
		// console.log("故事\n", oStory, '媒体\n', oMedia);
		// if (!oMedia){ // 如果找不到对应的故事
		// 	const oMidaInfo = oStory.aMedia_.find(cur=>{
		// 		return cur.ID === mediaId * 1;
		// 	});
		// 	this.downLoadMedia(oMidaInfo);
		// }
		// const aChannelData_ = await (async ()=>{
		// 	const theBlob = oSct.buffer.oChannelDataBlob_;
		// 	if (!theBlob.arrayBuffer) return;
		// 	const res = await theBlob.arrayBuffer();
		// 	return new Int8Array(res);
		// })();
		// if (!aChannelData_) {
		// 	this.setState({loading: false});
		// 	return alert('浏览器无法解析音频数据');
		// }
		// const buffer = {...oSct.buffer, aChannelData_};
		// const [{aWords=[]}, loading] = [oStory, false];
		// const fileSrc = URL.createObjectURL(oSct.audioFile);
		// const iAlines = oSct.aLines.length;
		// if (iAlines) aSteps.last_.aLines = oSct.aLines; //字幕
		// this.setState({fileSrc, buffer, aSteps, oStory, oSct, aWords, loading});
		// this.bufferToPeaks();
		// iAlines || this.giveUpThisOne(0);
	}
	// ▼下载音频字幕，然后保存
	async downLoadMedia(oMidaInfo){
		console.log('收到参数oMidaInfo', oMidaInfo);
		const filePath = 'http://qn.hahaxuexi.com/' + oMidaInfo.fileId;
		const res = await window.axios.get(filePath, {
			responseType: "blob",
		});
		if (!res) return;
		const mediaFile = new File([res], oMidaInfo.fileName, {
			type: res.type,
		});
		console.log('媒体文件\n', mediaFile);
		const subtitleFilePath = 'http://qn.hahaxuexi.com/' + oMidaInfo.subtitleFileId;
		const res02 = await window.axios.get(subtitleFilePath, {
			// responseType: "blob",
		});
		if (!res02) return;
		console.log('字幕\n', res02);
		// var file=document.getElementById("file").file[0];
		// var reader=new FileReader();
		// //将文件以文本形式读入页面
		// read.readAsText(file);
		// reader.οnlοad=function(f)
		// {
		// 	var result=document.getElementById("result");
		// 	//在页面上显示读入文本
		// 	result.innerHTML=this.result;
		// }
		// this.saveOneMedia(oStory, {
		// 	...oMidaInfo, mediaFile,
		// });
	}
	// ▼保存媒体的方法
	async saveOneMedia(oStory, oneMedia){
		const {mediaTB} = this.state;
		oneMedia.ownerStoryId = oStory.ID;
		const collection  = await mediaTB.where('fileId').equals(oneMedia.fileId);
		const oFirst = await collection.first();
		if (!oFirst) return mediaTB.add(oneMedia);
		mediaTB.put({
			...oFirst, ...oneMedia,
		});
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