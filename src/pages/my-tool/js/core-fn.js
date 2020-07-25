
export default class {
	// ▼跳转到当前行（可以删除）因为 goLine 没收到目标行，即跳到当前行
    goToCurLine(){
        const {iCurLine} = this.getCurStep();
        this.goLine(iCurLine, false, true);
    }
	// ▼跳至某行
	async goLine(idx, oNewLine, doNotSave) {
		const oWaveWrap = this.oWaveWrap.current;
		const {scrollLeft, offsetWidth} = oWaveWrap;
		const {fPerSecPx} = this.state;
		const {start, end, long} = oNewLine || this.getCurLine(idx);
		oWaveWrap.scrollLeft = (() => {
			if ((start * fPerSecPx > scrollLeft) && (end * fPerSecPx < scrollLeft + offsetWidth)) return scrollLeft;
			// ▲【起点】在可视区内 && 【终点】也在可视区内， 返回旧值（不滚动）
			const startPx = fPerSecPx * start;
			const restPx = offsetWidth - long * fPerSecPx;
			if (restPx <= 0) return startPx - 100; //100表示起点距离左边100
			return startPx - restPx / 2;
		})();
		// ▲波形定位，▼下方句子定位
		const oSententList = this.oSententList.current;
		const {offsetHeight, scrollTop, children} = oSententList;
		const [top01, abloveCurLine, curLine, bottom01] = [...children].reduce((result, {offsetHeight}, iCurIdx)=>{
			if (iCurIdx === idx - 1) result[0] = offsetHeight; //取得目标行【上一行】高度
			if (iCurIdx < idx) result[1] += offsetHeight; //当前行小于目标行，累计高度
			if (iCurIdx === idx) result[2] = offsetHeight; //取得【目标行】高度
			if (iCurIdx === idx + 1) result[3] = offsetHeight; //取得目标行【下一行】高度
			return result;
		}, [0, 0, 0, 50]);
		oSententList.scrollTop = (()=>{
			if (abloveCurLine < scrollTop + top01) return abloveCurLine - top01;
			// ▲上方超出可视区，▼下方超出可视区（以下代码没能深刻理解）
			if (abloveCurLine > scrollTop + offsetHeight - curLine - bottom01) {
				return abloveCurLine - offsetHeight + curLine + bottom01;
			}
			return scrollTop;
		})();
        if (doNotSave) return;
		const { oCurStepDc } = this.getCurStep();
		oCurStepDc.iCurLine = idx;
		if (oNewLine) oCurStepDc.aLines.push(oNewLine);
		this.setCurStep(oCurStepDc);
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
		const { iHeight } = this.state; //波形高
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
		this.setState({ drawing: false });
		return oCanvas;
	}
	// ▼播放
	async toPlay(isFromHalf) {
		clearInterval(this.state.playing); //把之前播放的关闭再说
		const { fPerSecPx } = this.state;
		const { start, long } = this.getCurLine();
		const Audio = this.oAudio.current;
		const { style } = this.oPointer.current;
		const fStartTime = start + (isFromHalf ? long * 0.4 : 0);
		style.left = `${fStartTime * fPerSecPx}px`;
		Audio.currentTime = fStartTime;
		Audio.play();
		const playing = setInterval(() => {
			const { currentTime: cTime } = Audio;
			if (cTime < this.getCurLine().end && this.state.playing) {
				return style.left = `${cTime * this.state.fPerSecPx}px`;
			}
			Audio.pause();
			clearInterval(this.state.playing);
			this.setState({ playing: false });
		}, 1000 / 70); //每秒执行次数70
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
		this.fixTime(oCurLine);
		this.setCurLine(oCurLine);
		this.goToCurLine();
	}
	// ▼修整某一行
	fixTime(oTarget) {
		const { start, end, text } = oTarget;
		oTarget.start_ = this.secToStr(start);
		oTarget.end_ = this.secToStr(end);
		oTarget.long = end - start;
		oTarget.text = text || '';
		return oTarget;
	}
	// ▼时间轴的时间转秒
	getSeconds(text) {
		const [hour, minute, second, tail] = text.match(/\d+/g);
		let number = (hour * 60 * 60) + (minute * 60) + `${second}.${tail}` * 1;
		return number.toFixed(2) * 1;
	};
	// ▼秒-转为时间轴的时间
	secToStr(fSecond) {
		let iHour = Math.floor(fSecond / 3600) + ''; //时
		let iMinut = Math.floor((fSecond - iHour * 3600) / 60) + ''; //分
		let fSec = fSecond - (iHour * 3600 + iMinut * 60) + ''; //秒
		let [sec01, sec02 = '000'] = fSec.split('.');
		const sTime = `${iHour.padStart(2, 0)}:${iMinut.padStart(2, 0)}:${sec01.padStart(2, 0)},${sec02.slice(0, 3).padEnd(3, 0)}`;
		return sTime;
	}
	// ▼得到当前步骤
	getCurStep(isJustCurStep = false) {
		const oCurStep = this.state.aSteps[this.state.iCurStep];
		if (isJustCurStep) return oCurStep; //简化版
		const { iCurLine, aLines, dc_ } = oCurStep;
		return { oCurStep, iCurLine, aLines, oCurStepDc: dc_ }; //丰富信息版
	}
	// ▼更新当前步骤的数据
	setCurStep(oNewStep) {
		const maxStep = 30; //最多x步
		const iCurStep = this.state.iCurStep;
		this.setState({
			// ▼如果最大步数是10，那“当前步”最大值为9，例：8+1 < 10 ? 9 : 8; 例：9+1 < 10 ? 10 : 9;
			iCurStep: iCurStep + 1 < maxStep ? iCurStep + 1 : iCurStep,
			// ▼如 [0]【1】[2] 在当前第1步产生新历史，则：[].slice(0, 1+1) 第1步留下，第2步用新历史数据代替
			aSteps: this.state.aSteps.slice(0, iCurStep + 1).concat(oNewStep).slice(-1 * maxStep),
		});
	}
	// ▼设定当前行
	setCurLine(oLine) {
		const { oCurStepDc, iCurLine } = this.getCurStep();
		oCurStepDc.aLines[iCurLine] = oLine;
		this.setCurStep(oCurStepDc);
	}
	// ▼得到当前行，或某个指定行
	getCurLine(idx) {
		const { iCurLine, aLines } = this.getCurStep(true);
		if (typeof idx === 'number') {
			if (!aLines[idx]) console.log('目标行-1');
			return aLines[idx] || aLines[idx - 1];
		}
		return aLines[iCurLine];
	}
	// ▼传递给子级的方法
	commander(sFnName, aRest) {
		console.log('收到函数名，和参数', sFnName, aRest);
		const theFn = this[sFnName];
		theFn && theFn.call(this, ...aRest);
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

}

