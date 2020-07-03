import {message} from 'antd';

export default class {
  message = message;
  // ▼输入框文字改变
  valChanged(ev) {
    const oCurLine = this.getCurLine().dc_;
    oCurLine.text = ev.target.value;
    this.setCurLine(oCurLine);
  }
  // ▼跳至某行
  async goLine(idx, oNewLine) {
    const oWaveWrap = this.oWaveWrap.current;
    const {scrollLeft, offsetWidth} = oWaveWrap;
    const {fPerSecPx} = this.state;
    const {start, end, long} = this.getCurLine(idx);
    if (
      (start * fPerSecPx < scrollLeft) || //【起点】超出可视区
      (end * fPerSecPx > scrollLeft + offsetWidth) //【终点】超出可视区
    ) {
      const leftVal = (()=>{
        const startPx = fPerSecPx * start;
        const restPx = offsetWidth - long * fPerSecPx;
        if (restPx<=0) return startPx - 20;
        return startPx - restPx / 2;
      })();
      oWaveWrap.scrollTo(leftVal, 0);
    }
    // ▲波形定位，▼下方句子定位
    const oSententList = this.oSententList.current;
    const fHeight = (() => {
      const oneLineHeight = (oSententList.children[0] || {}).offsetHeight || 0;
      return oneLineHeight * (idx - 2);
    })();
    oSententList.scrollTo(0, fHeight);
    // 
    const {oCurStepDc} = this.getCurStep();
    oCurStepDc.iCurLine = idx;
    if (oNewLine) oCurStepDc.aLines.push(oNewLine);
    this.setCurStep(oCurStepDc);
  }
  // ▼清空画布
  cleanCanvas(){
    const oCanvas = this.oCanvas.current;
    const width = oCanvas.parentElement.offsetWidth;
    const Context = oCanvas.getContext('2d');
    oCanvas.width = width;
    Context.clearRect(0, 0, width, oCanvas.height);
  }
  // ▼绘制（//修改波形高度的时候不需要参数
  toDraw(aPeaks_) {
    this.cleanCanvas();
    const {iHeight} = this.state; //波形高
    const aPeaks = aPeaks_ || this.state.aPeaks;
    const oCanvas = this.oCanvas.current;
    const Context = oCanvas.getContext('2d');
    const halfHeight = oCanvas.height / 2;
    let idx = -1;
    const fCanvasWidth = aPeaks.length / 2;
    Context.fillStyle = '#55c655';
    while (idx < fCanvasWidth) {
      idx++;
      const cur1 = aPeaks[idx * 2] * iHeight;
      const cur2 = aPeaks[idx * 2 + 1] * iHeight;
      Context.fillRect(
        idx, (halfHeight - cur1), 1, Math.ceil(cur1 - cur2),
      );
    }
    Context.fillStyle = '#4ddc4d';
    Context.fillRect(0, halfHeight, oCanvas.width, 1);
    this.setState({drawing: false});
    return oCanvas;
  }
  // ▼播放
  async toPlay(isFromHalf) {
    clearInterval(this.state.playTimer); //把之前播放的关闭再说
    const {fPerSecPx} = this.state;
    const {start, long} = this.getCurLine();
    const Audio = this.oAudio.current;
    const {style} = this.oPointer.current;
    const fStartTime = start + (isFromHalf ? long / 2 : 0);
    style.left = `${fStartTime * fPerSecPx}px`;
    Audio.currentTime = fStartTime;
    Audio.play();
    const iSecFrequency = 100; //每秒执行次数
    const playTimer = setInterval(() => {
      const {fPerSecPx} = this.state;
      const {long, end} = this.getCurLine();
      const fOneStepLong = long * fPerSecPx / (long * iSecFrequency);
      const newLeft = parseFloat(style.left) + fOneStepLong;
      const fEndPx = end * fPerSecPx;
      if (newLeft > fEndPx || Audio.currentTime > end) {
        Audio.pause();
        style.left = `${fEndPx}px`;
        this.setState({playing: false});
        return clearInterval(this.state.playTimer);
      }
      style.left = `${newLeft}px`;
    }, 1000 / iSecFrequency);
    this.setState({playTimer, playing: true});
  }
  // ▼得到点击处的秒数，收受一个事件对象
  getPointSec({clientX}){
    const {fPerSecPx} = this.state;
    const {offsetLeft, scrollLeft} = this.oWaveWrap.current;
    const iLeftPx = clientX - offsetLeft + scrollLeft; //鼠标左侧的px值
    const iNowSec = iLeftPx / fPerSecPx; //当前指向时间（秒）
    return iNowSec;
  }
  // ▼设定时间。1参是类型，2参是秒数
  setTime(sKey, fVal){
    const oCurLine = this.getCurLine().dc_;
    const {start, end} = oCurLine;
    if (sKey === 'start' && fVal > end) { //起点在终点右侧
      oCurLine.start = end;
      oCurLine.end = fVal;
    } else if (sKey==='end' && fVal < start){ // 终点在起点左侧
      oCurLine.start = fVal;
      oCurLine.end = start;
    } else {
      oCurLine[sKey] = fVal;
    }
    this.fixTime(oCurLine);
    this.setCurLine(oCurLine);
  }
  // ▼修整某一行
  fixTime(oTarget){
    const {start, end, text} = oTarget;
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
  secToStr(fSecond){
    let iHour = Math.floor(fSecond / 3600) + ''; //时
    let iMinut = Math.floor((fSecond - iHour * 3600) / 60) + ''; //分
    let fSec = fSecond - (iHour*3600 + iMinut*60) + ''; //秒
    let [sec01, sec02='000'] = fSec.split('.');
    const sTime = `${iHour.padStart(2, 0)}:${iMinut.padStart(2, 0)}:${sec01.padStart(2, 0)},${sec02.slice(0, 3).padEnd(3,0)}`;
    return sTime;
  }
  // ▼得到当前步骤
  getCurStep(isJustCurStep = false){
    const oCurStep = this.state.aSteps[this.state.iCurStep];
    if (isJustCurStep) return oCurStep; //简化版
    const {iCurLine, aLines, dc_} = oCurStep;
    return {oCurStep, iCurLine, aLines, oCurStepDc: dc_}; //丰富信息版
  }
  // ▼更新当前步骤的数据
  setCurStep(oNewStep){
    const aSteps = this.state.aSteps.dc_;
    let iCurStep = this.state.iCurStep + 1;
    aSteps.splice(iCurStep, Infinity, oNewStep);
    if (aSteps.length > 100) {
      aSteps.shift(); iCurStep--;
    }
    this.setState({aSteps, iCurStep});
  }
  // ▼设定当前行
  setCurLine(oLine){
    const {oCurStepDc, iCurLine} = this.getCurStep();
    oCurStepDc.aLines[iCurLine] = oLine;
    this.setCurStep(oCurStepDc);
  }
  // ▼得到当前行，或某个指定行
  getCurLine(idx){
    const {iCurLine, aLines} = this.getCurStep();
    if (typeof idx === 'number') {
      if (!aLines[idx]) console.log('目标行-1');
      return aLines[idx] || aLines[idx -1];
    }
    return aLines[iCurLine];
  }
}

