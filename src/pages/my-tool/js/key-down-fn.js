import keyMap from './key-map.js';

export default class {
  getFn(keyStr){
    const fnLib = {
      // ▼单键系列
      '`': () => this.toPlay(null, true),
      'Tab': () => this.toPlay(),
      'Prior': () => this.previousAndNext(-1),
      'Next': () => this.previousAndNext(1),
      'F1': ()=>this.cutHere('start'),
      'F2': ()=>this.cutHere('end'),
      // ctrl 系列
      'ctrl + Enter': () => this.toPlay(), //播放
      'ctrl + Delete': () => this.toDel(), //删除
      'ctrl + d': () => this.toDel(), //删除
      'ctrl + Up': () => this.putTogether('prior'), // 合并上一句
      'ctrl + Down': () => this.putTogether('next'), // 合并下一句
      'ctrl + z': () => this.getHistory(-1), //撤销
      'ctrl + shift + z': () => this.getHistory(1), //恢复
      'ctrl + shift + c': () => this.split(), //分割
      // alt 系列
      'alt + j': () => this.previousAndNext(-1),
      'alt + k': () => this.previousAndNext(1),
      'alt + ,': () => this.changeWaveHeigh(-1),
      'alt + .': () => this.changeWaveHeigh(1),
      'alt + u': () => this.fixRegion('start', -0.1),
      'alt + i': () => this.fixRegion('start', 0.1),
    }
    const fn = fnLib[keyStr];
    if (!fn) return false;
    return fn.bind(this);
  }
  // ▼按下按键事件
  keyDowned(ev){
    const {ctrlKey, shiftKey, altKey, keyCode} = ev;
    const ctrl = ctrlKey ? 'ctrl + ' : '';
    const shift = shiftKey ? 'shift + ' : '';
    const alt = altKey ? 'alt + ' : '';
    const keyName = [16, 17, 18].includes(keyCode) ? '' : keyMap[keyCode];
    const keyStr = ctrl + shift + alt + keyName;
    const theFn = this.getFn(keyStr);
    console.log('按下了：', keyCode, keyStr);
    if (!theFn) return;
    theFn();
    ev.preventDefault();
    ev.stopPropagation();
  }
  // ▼切换当前句子（上一句，下一句）
  previousAndNext(iDirection) {
    const { aTimeLine, iCurLine } = this.state;
    let iCurLineNew = iCurLine + iDirection;
    if (iCurLineNew < 0) iCurLineNew = 0;
    if (iCurLineNew > aTimeLine.length - 1) {
      const oLast = aTimeLine.slice(-1)[0];
      const oNewItem = this.fixTime({
        start: oLast.end + 0.05,
        end: oLast.end + 10.05,
      });
      this.setState({
        aTimeLine: [...aTimeLine, oNewItem],
      });
    };
    this.setState({iCurLine: iCurLineNew});
    this.goLine(iCurLineNew);
  }
  // ▼按下回车键
  enterKeyDown(ev) {
    const { keyCode, altKey, ctrlKey, shiftKey } = ev;
    if (keyCode === 13 && !altKey && !ctrlKey && !shiftKey) {
      ev.preventDefault();
      this.previousAndNext(1);
      return false;
    }
  }
  // ▼删除某条
  toDel() {
    const {aTimeLine, iCurLine} = this.state;
    this.setState({
      aTimeLine: aTimeLine.filter((cur, idx) => idx !== iCurLine),
    });
  }
  // ▼保存字幕到浏览器
  async toSave() {
    const {aTimeLine, fileName} = this.state;
    if (!fileName) return;
    window.lf.setItem(fileName, aTimeLine);
    this.message.success('保存成功');
  }
  // ▼微调区域
  fixRegion(sKey, iDirection) {
    const { aTimeLine, iCurLine } = this.state;
    const oOld = aTimeLine[iCurLine];
    const previous = aTimeLine[iCurLine - 1];
    const next = aTimeLine[iCurLine + 1];
    let fNewVal = oOld[sKey] + iDirection;
    if (fNewVal < 0) fNewVal = 0;
    if (previous && fNewVal < previous.end) {
      fNewVal = previous.end + 0.05;
    }
    if (next && fNewVal > next.start) {
      fNewVal = next.start - 0.05;
    }
    this.setTime(sKey, fNewVal);
  }
  // ▼重新定位起点，终点
  cutHere(sKey){
    const oAudio = this.oAudio.current;
    console.log(sKey, oAudio.currentTime);
    this.setTime(sKey, oAudio.currentTime);
  }
  // ▼合并
  putTogether(sType){
    let {aTimeLine, iCurLine} = this.state;
    const oTarget = ({
      prior: aTimeLine[iCurLine - 1],
      next: aTimeLine[iCurLine + 1],
    }[sType]);
    if (!oTarget) return;
    const oCur = aTimeLine[iCurLine];
    oTarget.start = Math.min(oTarget.start, oCur.start);
    oTarget.end = Math.max(oTarget.end, oCur.end);
    oTarget.text = (()=>{ 
      let sResult = oTarget.text + ' ' + oCur.text;
      if (sType === 'next') sResult = oCur.text + ' ' + oTarget.text;
      return sResult.replace(/\s+/g, ' ');
    })();
    this.fixTime(oTarget);
    aTimeLine.splice(iCurLine, 1);
    if (sType === 'prior') iCurLine--;
    this.setState({aTimeLine, iCurLine});
  }
  // ▼撤销-恢复
  getHistory(iType){
    const {aHistory, aHistory:{length: len}} = this.state;
    console.log('历史方向', iType);
    console.log(JSON.parse(
      JSON.stringify(aHistory)
    ));
    if (!len) return;
    const oLast = (()=>{
      if (len>1) {
        aHistory.pop();
        return aHistory.slice(-1)[0];
      }
      return aHistory.pop();
    })();
    // console.log('历史', oLast.aTimeLine[0]);
    // console.log('历史', oLast.aTimeLine[0].start);
    this.setState({...oLast, aHistory});
  }
  // ▼一刀两段
  split(){
    const {selectionStart} = this.oTextArea.current;
    const {currentTime} = this.oAudio.current;
    const {iCurLine, aTimeLine} = this.state;
    const oCur = {...aTimeLine[iCurLine]};
    aTimeLine.splice(iCurLine, 1, this.fixTime({
      ...oCur,
      end: currentTime,
      text: oCur.text.slice(0, selectionStart).trim(),
    }), this.fixTime({
      ...oCur,
      start: currentTime + 0.01,
      text: oCur.text.slice(selectionStart).trim(),
    }));
    const aHistory = this.saveHistory(aTimeLine, iCurLine);
    this.setState({aTimeLine, aHistory});
  }
}

