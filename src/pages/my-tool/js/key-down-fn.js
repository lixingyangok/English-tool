import keyMap from './key-map.js';

export default class {
  getFn(keyStr){
    const fnLib = {
      // ▼单键系列
      '`': () => this.toPlay(true),
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
      'ctrl + z': () => this.setHistory(-1), //撤销
      'ctrl + shift + z': () => this.setHistory(1), //恢复
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
    keyName && console.log('按下了：', keyCode, keyStr);
    if (!theFn) return;
    theFn();
    ev.preventDefault();
    ev.stopPropagation();
  }
  // ▼切换当前句子（上一句，下一句）
  previousAndNext(iDirection) {
    const {iCurLine, aLines} = this.getCurStep();
    if (iCurLine==0 && iDirection==-1) return; //不可退
    const iCurLineNew = iCurLine + iDirection;
    let oNewItem = null;
    if (iCurLineNew > aLines.length - 1) { //超出，需要新增
      const {end} = aLines.last_;
      oNewItem = this.fixTime({
        start: end + 0.05,
        end: end + 10,
      });
    };
    this.goLine(iCurLineNew, oNewItem);
  }
  // ▼按下回车键
  enterKeyDown(ev) {
    const {keyCode, altKey, ctrlKey, shiftKey} = ev;
    const willDo = keyCode === 13 && !altKey && !ctrlKey && !shiftKey;
    if (!willDo) return;
    this.previousAndNext(1);
    ev.preventDefault();
    return false;
  }
  // ▼删除某条
  toDel() {
    const {oCurStepDc, iCurLine} = this.getCurStep();
    oCurStepDc.aLines.splice(iCurLine, 1);
    this.setCurStep(oCurStepDc);
  }
  // ▼保存字幕到浏览器
  async toSave() {
    const {aLines} = this.getCurStep();
    const {fileName} = this.state;
    if (!fileName) return;
    window.lf.setItem(fileName, aLines);
    this.message.success('保存成功');
  }
  // ▼微调区域（1参可能是 start、end
  fixRegion(sKey, iDirection) {
    const {iCurLine, aLines} = this.getCurStep();
    const oOld = this.getCurLine();
    const previous = aLines[iCurLine - 1];
    const next = aLines[iCurLine + 1];
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
    const {oCurStepDc, iCurLine} = this.getCurStep();
    const {aLines} = oCurStepDc;
    const isMergeNext = sType === 'next';
    const oTarget = ({
      prior: aLines[iCurLine - 1], //合并上一条
      next: aLines[iCurLine + 1], //合并下一条
    }[sType]);
    if (!oTarget) return; //没有邻居不再执行
    const oCur = aLines[iCurLine];
    oTarget.start = Math.min(oTarget.start, oCur.start);
    oTarget.end = Math.max(oTarget.end, oCur.end);
    oTarget.text = (()=>{
      const aResult = [oTarget.text, oCur.text];
      if (isMergeNext) aResult.reverse();
      return aResult.join(' ').replace(/\s{2,}/g, ' ');
    })();
    this.fixTime(oTarget);
    aLines.splice(iCurLine, 1);
    oCurStepDc.iCurLine = isMergeNext ? iCurLine : iCurLine-1;
    this.setCurStep(oCurStepDc);
  }
  // ▼一刀两段
  split(){
    const {selectionStart} = this.oTextArea.current;
    const {currentTime} = this.oAudio.current;
    const {oCurStepDc, iCurLine} = this.getCurStep();
    const oCurLine = this.getCurLine();
    const aNewItems = [
      this.fixTime({
        ...oCurLine,
        end: currentTime,
        text: oCurLine.text.slice(0, selectionStart).trim(),
      }),
      this.fixTime({
        ...oCurLine,
        start: currentTime + 0.01,
        text: oCurLine.text.slice(selectionStart).trim(),
      }),
    ];
    oCurStepDc.aLines.splice(iCurLine, 1, ...aNewItems);
    this.setCurStep(oCurStepDc);
  }
  // ▼撤销-恢复
  setHistory(iType){
    const {aSteps:{length}} = this.state;
    let iCurStep = this.state.iCurStep + iType;
    if (iCurStep < 0 || iCurStep > length - 1) return;
    console.log('新位置：', iCurStep);
    this.setState({iCurStep});
  }
}

