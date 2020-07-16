import keyMap from './key-map.js';

export default class {
  getFn(keyStr){
    const type01 = { //单键系列
      '`': () => this.toPlay(true),
      'Tab': () => this.toPlay(),
      'Prior': () => this.previousAndNext(-1),
      'Next': () => this.previousAndNext(1),
      'F1': ()=>this.cutHere('start'),
      'F2': ()=>this.cutHere('end'),
    };
    const type02 = { // ctrl 系列
      'ctrl + d': () => this.toDel(), //删除
      'ctrl + s': () => this.toSave(), //保存到浏览器
      'ctrl + shift + s': () => this.toSave(), // ★导出到本地
      'ctrl + z': () => this.setHistory(-1), //撤销
      'ctrl + Enter': () => this.toPlay(true), //播放
      'ctrl + Delete': () => this.toDel(), //删除
      'ctrl + j': () => this.putTogether('prior'), // 合并上一句
      'ctrl + k': () => this.putTogether('next'), // 合并下一句
      'ctrl + shift + z': () => this.setHistory(1), //恢复
      'ctrl + shift + c': () => this.split(), //分割
    };
    const type03 = { // alt 系列
      'alt + j': () => this.previousAndNext(-1),
      'alt + k': () => this.previousAndNext(1),
      'alt + l': () => this.getLineAndGo(), // 跳到最后一句 l = last
      'alt + shift + j': () => this.toInsert(-1), // 向【左】插入一句
      'alt + shift + k': () => this.toInsert(1), // 向【右】插入一句
      'alt + shift + ,': () => this.changeWaveHeigh(-1), //波形高低
      'alt + shift + .': () => this.changeWaveHeigh(1), //波形高低
      'alt + ,': () => this.zoomWave({deltaY: 1}), //波形横向缩放
      'alt + .': () => this.zoomWave({deltaY: -1}), //波形横向缩放
      'alt + u': () => this.fixRegion('start', -0.07), //起点向左
      'alt + i': () => this.fixRegion('start', 0.07), //起点向右
      'alt + n': () => this.fixRegion('end', -0.07), //终点向左
      'alt + m': () => this.fixRegion('end', 0.07), //终点向右
      'alt + s': () => this.toStop(), //停止播放
      'alt + w': () => this.saveWord(), //停止播放
      'alt + number': number => this.toInset(number), //分割
    }
    const fnLib = {...type01, ...type02, ...type03};
    let fn = fnLib[keyStr];
    if (!fn) {
      const isMatch = keyStr.match(/alt \+ \d/g);
      if (isMatch && isMatch.length) {
        return type03['alt + number'].bind(this, keyStr.slice(-1)[0]);
      }
      return false;
    }
    return fn.bind(this);
  }
  // ▼按下按键事件
  keyDowned(ev){
    const {ctrlKey, shiftKey, altKey, keyCode} = ev;
    const ctrl = ctrlKey ? 'ctrl + ' : '';
    const alt = altKey ? 'alt + ' : '';
    const shift = shiftKey ? 'shift + ' : '';
    const keyName = [16, 17, 18].includes(keyCode) ? '' : keyMap[keyCode];
    const keyStr = ctrl + alt + shift + keyName;
    const theFn = this.getFn(keyStr);
    keyName && console.log('按下了：', keyCode, keyStr); 
    if (!theFn) return;
    theFn();
    ev.preventDefault();
    ev.stopPropagation();
  }
  // ▼切换当前句子（上一句，下一句）
  previousAndNext(iDirection, isNeedSave) {
    const {iCurLine, aLines} = this.getCurStep(true);
    if (iCurLine === 0 && iDirection === -1) return; //不可退
    const iCurLineNew = iCurLine + iDirection;
    let oNewItem = null;
    if (iCurLineNew > aLines.length - 1) { //超出，需要新增
      const {end} = aLines.last_;
      const newStart = end + this.figureOut(end);
      oNewItem = this.fixTime({
        start: newStart,
        end: newStart + 10,
      });
    };
    if (isNeedSave && iCurLineNew % 3 === 0) this.toSave();
    this.goLine(iCurLineNew, oNewItem);
  }
  // ▼能加断句
  figureOut(fEndSec){
    const {buffer, iPerSecPx, fPerSecPx, iHeight} = this.state;
    const iPeakStart = ~~(fPerSecPx * fEndSec);
    const {aPeaks} = this.getPeaks(
      buffer, iPerSecPx, iPeakStart, iPerSecPx * 15, //15秒
    );
    let myArr = [];
    for (let idx = 0; idx< aPeaks.length; idx+=2) {
      const val = (aPeaks[idx] - aPeaks[idx+1]) * iHeight;
      myArr.push(~~val);
    }
    console.log('波形', aPeaks);
    console.log('波形2', myArr);
    let begin = 0;
    let step = 15; //采样跨度
    let hight = 10; //高度阈值
    for (let idx = 0; idx < myArr.length; idx += step){
      const val = myArr.slice(idx, idx+step).reduce((result, cur)=>result+cur, 0) / step;
      const val02 = myArr.slice(idx+step, idx+step+step).reduce((result, cur)=>result+cur, 0) / step;
      if (idx === 0 && val > hight && val02 > hight) return 0;
      if (val < hight && val02 > hight) {
        begin = idx - step / 4;
        break;
      }
      // console.log(`步${idx}平均值`, ~~val, ~~val02);
    }
    // myArr = Int16Array.from(myArr.map(xx => Math.round(xx)));
    // console.log('起点', begin, begin / fPerSecPx);
    return begin / fPerSecPx; //返回起点
  }
  // ▼输入框文字改变
  valChanged(ev) {
    const newText = ev.target.value;
    if (newText.endsWith(' ')){ //如果输入了空格，那么生成一条新记录
      const oCurLine = this.getCurLine();
      const oCurLineDc = oCurLine.dc_;
      oCurLineDc.text = newText;
      this.setCurLine(oCurLineDc);
      return;
    }
    const {selectionStart: idx} = ev.target;
    const sLeft = newText.slice(0, idx) || '';
    const sRight = newText.slice(idx) || '';
    const needToCheck = (
      (/\s+[a-z]{1,5}$/i.test(sLeft) || /^[a-z]{1,5}$/i.test(sLeft)) &&
      (!sRight || /^\s+/.test(sRight))
    );
    let sTyped = '';
    if (needToCheck) sTyped = (' ' + sLeft).match(/\s[a-z]+/gi).pop().slice(1);
    const {aSteps, iCurStep} = this.state;
    const {iCurLine} = aSteps[iCurStep]; // 当前步骤
    aSteps[iCurStep].aLines[iCurLine].text = newText;
    this.setState({aSteps, sTyped});
  }
  // ▼按下回车键
  enterKeyDown(ev) {
    const {keyCode, altKey, ctrlKey, shiftKey} = ev;
    const willDo = keyCode === 13 && !altKey && !ctrlKey && !shiftKey;
    if (!willDo) return;
    this.previousAndNext(1, true);
    ev.preventDefault();
    return false;
  }
  // ▼删除某条
  toDel() {
    const {oCurStepDc, iCurLine} = this.getCurStep();
    if (oCurStepDc.aLines.length<=1) return;
    oCurStepDc.aLines.splice(iCurLine, 1);
    const iMax = oCurStepDc.aLines.length-1;
    if (oCurStepDc.iCurLine >= iMax) oCurStepDc.iCurLine = iMax;
    this.setCurStep(oCurStepDc);
    this.goToCurLine();
  }
  // ▼保存字幕到浏览器
  async toSave() {
    console.log('保存');
    const {fileName, oTarget, oSectionTB, oSct} = this.state;
    const {storyId, sctId} = oTarget;
    const {aLines} = this.getCurStep();
    if (storyId && sctId){ //有本地数据
      await oSectionTB.update(oSct.id, {aLines}); //增量更新
    } else if (fileName) {
      await window.lf.setItem(fileName, aLines);
    } else {
      return;
    }
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
    const selectionStart = (
      this.oTextArea.current.selectionStart ||
      document.getElementById('myTextArea').selectionStart
    );
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
    if (iCurStep < 0 || iCurStep > length - 1) {
      const actionName = {'-1': '上', '1': '下'}[iType];
      return this.message.error(`没有${actionName}一步数据，已经到头了`);
    }
    this.setState({iCurStep});
    this.goToCurLine();
  }
  // ▼插入一句。 参数说明：-1=向左，1=向右
  toInsert(iDirection){
    const isToLeft = iDirection === -1;
    const {iCurLine, aLines, oCurStepDc} = this.getCurStep(); //丰富信息版
    const {start, end} = aLines[iCurLine]; //当前行
    if (start === 0) return; //0开头，不可向前插入
    const oAim = aLines[iCurLine + iDirection] || {};
    const newIdx = isToLeft ? iCurLine : iCurLine + 1;
    const oNewLine = this.fixTime({
      start: isToLeft ? (oAim.end || 0) : end,
      end: isToLeft ? start : (oAim.start || end + 10),
    });
    if (oNewLine.start === oNewLine.end) return;
    oCurStepDc.aLines.splice(newIdx, 0, oNewLine);
    oCurStepDc.iCurLine += isToLeft ? 0 : 1;
    this.setCurStep(oCurStepDc);
  }
  // 停止
  toStop(){
    this.setState({playing: false});
  }
  getLineAndGo(){
		const {aLines, iCurLine} = this.getCurStep(true);
    let idx = aLines.findIndex(cur => cur.text.length <= 1);
    if (idx === -1 || idx === iCurLine) idx = aLines.length - 1;
    this.goLine(idx);
    document.querySelectorAll('textarea')[0].focus();
  }
  saveWord(){
    const {oStoryTB, oStory} = this.state;
    const sWord = window.getSelection().toString().trim(); 
    const aWords = oStory.aWords || [];
    aWords.includes(sWord) || aWords.push(sWord);
    oStoryTB.update(oStory.id, {aWords}); //增量更新
    this.message.success(`保存成功`);
    this.setState({aWords});
  }
  delWord(sWord){
    const {oStoryTB, oStory} = this.state;
    const aWords = (oStory.aWords || []).filter(cur=>cur!==sWord);
    oStoryTB.update(oStory.id, {aWords}); //增量更新
    this.setState({
      aWords: (this.state.aWords || []).filter(cur=>cur!==sWord),
    });
    this.message.success(`保存成功`);
  }
  toInset(idx){
    const {sTyped} = this.state;
    const arr = this.getWordsList(sTyped, true);
    console.log('第几个？', idx);
    console.log(sTyped, '---', arr);
    console.log('选择',arr[idx-1]);
  }
}

