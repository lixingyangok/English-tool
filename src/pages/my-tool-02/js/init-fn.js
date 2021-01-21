/*
 * @Author: 李星阳
 * @Date: 2021-01-17 11:30:35
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-01-20 20:45:13
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
		this.getMedia(mediaId, oMedia);
	}
	// ▼ 按媒体 id 查询媒体信息、并保存
	// ▼ 2参是本地的媒体数据
	async getMedia(mediaId, oMediaFromTB={}){
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
		if (mediaFile_ && subtitleFile_) {
			this.setState({loading: false});
			return console.log('本地【有】数据');
		}
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
		const {oMediaTB} = this.state; // aSteps,
		if (id) { // 有本地故事数据
			oMediaTB.put(dataToDB);
		}else{
			oMediaTB.add(dataToDB);
		}
		this.setState({loading: false});
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