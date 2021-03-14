import {
	getTimeInfo,
	downloadSrt,
	fixTime,
	arrToblob,
} from 'assets/js/pure-fn.js';
import {trainingDB} from 'assets/js/common.js';
import {getQiniuToken} from 'assets/js/learning-api.js';
import {iLineHeight} from '../style/dictation.style.js';

const {media: mediaTB} = trainingDB;
const axios = window.axios;

export default class {
	// buffer.sampleRate  // 采样率：浮点数，单位为 sample/s
	// buffer.length  // 采样帧率：整形
	// buffer.duration  // 时长(秒)：双精度型
	// buffer.numberOfChannels  // 通道数：整形
	// ▼计算波峰波谷（纯函数）
	getPeaks(buffer, iPerSecPx, left=0, iCanvasWidth=500) {
		const aChannel = buffer.aChannelData_ || buffer.getChannelData(0);
		const sampleSize = ~~(buffer.sampleRate / iPerSecPx); // 每一份的点数 = 每秒采样率 / 每秒像素
		const aPeaks = [];
		let idx = Math.round(left);
		const last = idx + iCanvasWidth;
		while (idx <= last) {
			let start = idx * sampleSize;
			const end = start + sampleSize;
			let min = 0;
			let max = 0;
			while (start < end) {
				const value = aChannel[start];
				if (value > max) max = value;
				else if (value < min) min = value;
				start++;
			}
			aPeaks.push(max, min);
			idx++;
		}
		const fPerSecPx = buffer.length / sampleSize / buffer.duration;
		return {aPeaks, fPerSecPx};
	}
	// ▼导出文件 TODO 文件名不正确
	async toExport() {
		downloadSrt(this.state.aLineArr, '文件名', 'srt');
	}
	// ▼打开对比字幕窗口
	compareSubtitle(){
		this.setState({matchDialogVisible: true})
		this.getSubtitleFromNet();
	}
	goToCurLine(){
		this.goLine(this.state.iCurLineIdx, false, true);
	}
	// ▼跳至某行
	async goLine(iAimLine, oNewLine, doNotSave) {
		const {aLineArr, iCurLineIdx, sCurLineTxt=''} = this.state;
		const oNewState = {aLineArr};
		if (typeof iAimLine === 'number') { // 观察：能不能进来？
			oNewState.iCurLineIdx = iAimLine;
		}else{
			iAimLine = iCurLineIdx;
		}
		if (aLineArr[iCurLineIdx].text !== sCurLineTxt){
			aLineArr[iCurLineIdx].text = sCurLineTxt.trim(); // 旧的值，存起来
			if (iAimLine % 2) this.toSaveInDb();
		}
		// console.log(`行号：${iCurLineIdx}-${iAimLine}`);
		if (oNewLine) {
			oNewState.aLineArr.push(oNewLine);
			oNewState.sCurLineTxt = oNewLine.text;
		}else{
			oNewState.sCurLineTxt = aLineArr[iAimLine].text;
		}
		if(!doNotSave) this.saveHistory(oNewState); // 有报错补上 dc_
		this.setState(oNewState);
		this.setLinePosition(oNewLine || aLineArr[iAimLine], iAimLine);
	}
	// ▼跳行后定位
	setLinePosition(oLine, iAimLine){
		const oWaveWrap = this.oWaveWrap.current;
		const {offsetWidth} = oWaveWrap;
		const {fPerSecPx} = this.state;
		const {start, long} = oLine;
		const iTopVal = (() => { // 计算波形框定位的位置
			const startPx = fPerSecPx * start;
			const restPx = offsetWidth - long * fPerSecPx;
			if (restPx <= 0) return startPx - 100; //100表示起点距离左边100
			return startPx - restPx / 2;
		})();
		this.goThere(oWaveWrap, 'Left', iTopVal);
		// ▲波形定位
		// ▼字幕定位
		const oSententList = this.oSententList.current;
		const {scrollTop: sTop, offsetHeight: oHeight} = oSententList;
		const abloveCurLine = iAimLine * iLineHeight; // 当前行以上高度
		oSententList.scrollTop = (()=>{
			if (abloveCurLine < sTop + iLineHeight) return abloveCurLine - iLineHeight;
			// ▲上方超出可视区，▼下方超出可视区（以下代码没能深刻理解）
			if (abloveCurLine > sTop + oHeight - iLineHeight * 2) {
				return abloveCurLine - oHeight + iLineHeight * 2;
			}
			return sTop;
		})();
	}

	// ▼清空画布
	cleanCanvas() {
		const oCanvas = this.oCanvas.current;
		const width = oCanvas.parentElement.offsetWidth;
		const Context = oCanvas.getContext('2d');
		oCanvas.width = width;
		Context.clearRect(0, 0, width, oCanvas.height);
	}
	// ▼绘制（//修改波形高度的时候不需要参数
	toDraw(aPeaks_) {
		this.cleanCanvas();
		const { iHeight, drawing } = this.state; //波形高
		const aPeaks = aPeaks_ || this.state.aPeaks;
		const oCanvas = this.oCanvas.current;
		const Context = oCanvas.getContext('2d');
		const halfHeight = oCanvas.height / 2;
		const fCanvasWidth = aPeaks.length / 2;
		let idx = 0;
		Context.fillStyle = '#55c655';
		while (idx < fCanvasWidth) {
			const cur1 = aPeaks[idx * 2] * iHeight;
			const cur2 = aPeaks[idx * 2 + 1] * iHeight;
			Context.fillRect(idx, (halfHeight - cur1), 1, cur1 - cur2);
			idx++;
		}
		Context.fillStyle = '#0f0';
		Context.fillRect(0, ~~halfHeight, oCanvas.width, 1);
		if (drawing) this.setState({ drawing: false });
		return oCanvas;
	}
	// ▼播放
	async toPlay(isFromHalf) {
		clearInterval(this.state.playing); //把之前播放的关闭再说
		const { fPerSecPx } = this.state;
		const { start, long } = this.getCurLine();
		const Audio = this.oAudio.current;
		if (!Audio) {
			return console.log('有没音频对象');
		}
		const { style={} } = this.oPointer.current || {}; 
		const fStartTime = start + (isFromHalf ? long * 0.4 : 0);
		style.left = `${fStartTime * fPerSecPx}px`;
		Audio.currentTime = fStartTime;
		Audio.play && Audio.play();
		const playing = setInterval(() => {
			const { currentTime: cTime } = Audio;
			if (cTime < this.getCurLine().end && this.state.playing) {
				return style.left = `${cTime * this.state.fPerSecPx}px`;
			}
			Audio.pause();
			clearInterval(this.state.playing);
			this.setState({ playing: false });
		}, ~~(1000 / 70)); //每秒执行次数70
		this.setState({playing});
	}
	// ▼得到点击处的秒数，收受一个事件对象
	getPointSec({ clientX }) {
		const {scrollLeft, parentElement: {offsetLeft}} = this.oWaveWrap.current;
		const iLeftPx = clientX - offsetLeft + scrollLeft; //鼠标距左边缘的px长度
		const iNowSec = iLeftPx / this.state.fPerSecPx; //当前指向时间（秒）
		return iNowSec;
	}
	// ▼设定时间。1参是类型，2参是秒数
	setTime(sKey, fVal) {
		const oCurLine = this.getCurLine().dc_;
		const {start, end} = oCurLine;
		if (sKey === 'start' && fVal > end) { //起点在终点右侧
			oCurLine.start = end;
			oCurLine.end = fVal;
		} else if (sKey === 'end' && fVal < start) { // 终点在起点左侧
			oCurLine.start = fVal;
			oCurLine.end = start;
		} else {
			oCurLine[sKey] = fVal;
		}
		fixTime(oCurLine);
		this.setCurLine(oCurLine);
	}
	// ▼更新当前步骤的数据
	saveHistory(oNewHistory) {
		const maxStep = 10; //最多x步
		let iCurStep = this.state.iCurStep;
		if (iCurStep + 1 < maxStep) iCurStep++;
		this.setState({ iCurStep });
		const aHistory = this.aHistory;
		aHistory.splice(iCurStep, Infinity, oNewHistory);
		if (aHistory.length > maxStep) aHistory.shift();
	}
	// ▼设定当前行 TODO 要废弃？
	setCurLine(oLine) {
		const aLineArr = this.state.aLineArr;
		const iCurLineIdx = this.state.iCurLineIdx;
		aLineArr[iCurLineIdx] = oLine;
		this.saveHistory({
			aLineArr: aLineArr.dc_, // 需要拷贝
			iCurLineIdx,
		});
		this.setState({aLineArr});
	}
	// ▼得到当前行，或某个指定行
	getCurLine(idx) {
		const { aLineArr } = this.state;
		if (typeof idx !== 'number') idx = this.state.iCurLineIdx;
		return aLineArr[idx] || aLineArr[idx - 1];
	}
	// ▼传递给子级的方法
	commander(sFnName, aRest=[]) {
		console.log('收到信号：', sFnName);
		const theFn = this[sFnName];
		if (!theFn) return;
		theFn.call(this, ...aRest);
	}
	// ▼得到可视区域的起点/终点的秒数，例：[3,9] 表示3-9秒
	getArea(){
		const oWaveWrap = this.oWaveWrap.current;
		if (!oWaveWrap) return [0, 0];
		const {fPerSecPx} = this.state;
		const {scrollLeft=0, offsetWidth=window.innerWidth} = oWaveWrap;
		let start = ~~(scrollLeft / fPerSecPx - 1);
		const end = ~~((scrollLeft + offsetWidth) / fPerSecPx + 1);
		return [start > 0 ? start : 0, end];
	}
	// 波形横向滚动动画
	// 会触发 onScroll 事件，所以一直在 render 
	goThere(oDom, sDirection, iNewVal){
		// console.log("开始滚动");
		clearInterval(this.state.scrollTimer);
		const sType = `scroll${sDirection}`;
		const iOldVal = oDom[sType];
		if (~~iOldVal === ~~iNewVal) return;
		if ('不要动画效果') return (oDom[sType] = iNewVal);
		const [iTakeTime, iTimes] = [350, 40]; //走完全程耗时, x毫秒走一步
		const iOneStep = ~~((iNewVal - iOldVal) / (iTakeTime / iTimes));
		const scrollTimer = setInterval(()=>{
			let iAimTo = oDom[sType] + iOneStep;
			if (iNewVal > iOldVal ? iAimTo >= iNewVal : iAimTo <= iNewVal){
				iAimTo = iNewVal;
				clearInterval(scrollTimer);
				// {
				// 	// ▼后补
				// 	let {buffer, iPerSecPx} = this.state;
				// 	let {offsetWidth, scrollLeft} = this.oWaveWrap.current;
				// 	const {aPeaks, fPerSecPx} = this.getPeaks(
				// 		buffer, iPerSecPx, scrollLeft, offsetWidth,
				// 	);
				// 	this.setState({aPeaks, fPerSecPx});
				// }
			}
			oDom[sType] = iAimTo;
		}, iTimes);
		this.setState({scrollTimer});
	}
	// ▼提示字幕信息
	getSubtitleInfo(){
		const {oMediaInfo, changeTs } = this.state;
		const {subtitleFileModifyTs: sTs} = oMediaInfo;
		let status = 0;
		// const getTimeStr = ts => new Date(ts).toLocaleString();
		// ▼ 此提示可能不会出现（因为本地会生成默认字幕）
		const tips = (()=>{
			if (!changeTs) return sTs ? '网新/本地无' : '两地无'; 
			// ▲【无】本地文件提示，▼【有】本地文件的情况
			if (!sTs) return '本地新/网无';
			if (changeTs === sTs) return '两地相同';
			if (changeTs > sTs) {
				status = 1;
				return '本地新/网旧';
			}
			status = 1;
			return '网新/本地旧';
		})();
		const sTime = ['', `两次间隔：${this.longTime(changeTs, sTs)}`][status];
		return [tips, sTime];
	}
	longTime(aa, bb){
		const seconds = Math.abs(aa - bb) / 1000;
		const [hour, rest] = [seconds / 3600, seconds % 3600];
		const [mm, ss] = [rest / 60, rest % 60];
		return parseInt(hour)+":"+parseInt(mm)+":"+parseInt(ss);
	}
	// ▼提示是否上传字幕
	uploadToCloudBefore(){
		this.goLine();
		const {oMediaInfo, changeTs} = this.state;
		const {
			name_,
			subtitleFileId,
			subtitleFileName, 
			subtitleFileModifyTs,
		} = oMediaInfo;
		const onOk = async () => {
			const toHide = this.message.loading('开始保存');
			await this.uploadToCloud({
				fileName: subtitleFileName || (name_ + '.srt'),
				key: subtitleFileId || '',
			});
			toHide();
		};
		if (changeTs >= subtitleFileModifyTs) return onOk();
		// ▲本新新，直接提交，▼本地旧，询问
		this.confirm({
			title: '提示',
			content: '本地数据比上网络数据更旧！确定上传？上传后会覆盖云端的文件！',
			onOk,
		});
	}
	// ▼保存字幕到云（上传字幕）
	async uploadToCloud(oParams){
		const {oMediaInfo, aLineArr} =  this.state;
		const subtitleFile_ = aLineArr;
		const file = arrToblob(subtitleFile_);
		const {fileName, key} = oParams;
		const [token, oTime] = await getQiniuToken(key);
		if (!token) return;
		const changeTs = oTime.getTime();
		const sUrl = 'http://upload-z2.qiniup.com';
		const {data} = await axios.post(sUrl, { // 上传媒体到七牛
			token, file, fileName,
			...(key ? {key} : {}), // key表示覆盖目标
		});
		if (!data) return;
		const {data: res} = await axios.put('/media/update-file', {
			ID: oMediaInfo.ID,
			subtitleFileId: data.key,
			subtitleFileName: fileName,
			subtitleFileSize: file.size,
			...getTimeInfo(oTime, 's'),
		}, {
			msg_: ['保存字幕未成功', '字幕保存成功'],
		});
		if (!res) return;
		mediaTB.update(oMediaInfo.id, {
			subtitleFile_, changeTs_: changeTs,
		});
		oMediaInfo.subtitleFileModifyTs = changeTs;
		this.setState({changeTs, oMediaInfo});
		// this.message.success('上传成功');
	}
	beforeUseNetSubtitle(){
		this.confirm({
			title: '提示',
			content: '确定使用网络字幕？此操作会覆盖本地字幕！',
			onOk: () => this.useSubtitleFromNet(),
		});
	}
	// ▼使用网络字幕
	useSubtitleFromNet(subtitleFile_){
		subtitleFile_ = subtitleFile_ || this.state.aSubtitleFromNet || [];
		let { oMediaInfo, aLineArr } = this.state;
		const {id, subtitleFileModifyTs: changeTs} = oMediaInfo;
		aLineArr = subtitleFile_;
		this.setState({ aLineArr, changeTs });
		mediaTB.update(id, {changeTs_: changeTs, subtitleFile_ }); //增量更新
	}
	// ▼防抖方法
	debounceFn(iLong=350){
		clearTimeout(this.doingTimer);
		this.state.isDoing || this.setState({isDoing: true});
		this.doingTimer = setTimeout(()=>{
			this.setState({isDoing: false});
		}, iLong);
	}
}


// TODO 旧的换行定位，可能将来删除它
// oldFn(){
// 	let iAimLine = 0;
// 	const oSententList = this.oSententList.current;
// 	const {offsetHeight, scrollTop, children} = oSententList;
// 	const [top01, abloveCurLine, curLine, bottom01] = [...children].reduce((result, {offsetHeight}, iCurIdx)=>{
// 		// iLineHeight
// 		if (iCurIdx === iAimLine - 1) result[0] = offsetHeight; //取得目标行【上一行】高度
// 		if (iCurIdx < iAimLine) result[1] += offsetHeight; //当前行小于目标行，累计高度
// 		if (iCurIdx === iAimLine) result[2] = offsetHeight; //取得【目标行】高度
// 		if (iCurIdx === iAimLine + 1) result[3] = offsetHeight; //取得目标行【下一行】高度
// 		return result;
// 	}, [0, 0, 0, 50]);
// 	oSententList.scrollTop = (()=>{
// 		if (abloveCurLine < scrollTop + top01) return abloveCurLine - top01;
// 		// ▲上方超出可视区，▼下方超出可视区（以下代码没能深刻理解）
// 		if (abloveCurLine > scrollTop + offsetHeight - curLine - bottom01) {
// 			return abloveCurLine - offsetHeight + curLine + bottom01;
// 		}
// 		return scrollTop;
// 	})();
// }