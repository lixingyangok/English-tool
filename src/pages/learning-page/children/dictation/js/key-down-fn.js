/*
 * @Author: 李星阳
 * @Date: 2021-02-19 16:35:07
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-05-25 20:07:32
 * @Description: 
 */

import {keyMap} from 'assets/js/key-map.js';
import {fixTime } from 'assets/js/pure-fn.js';
import {trainingDB, wordsDB} from 'assets/js/common.js';
import {getQiniuToken} from 'assets/js/learning-api.js';
import {aAlphabet} from 'assets/js/common.js';

const {media: mediaTB} = trainingDB;
const oAlphabet = aAlphabet.reduce((oResult, cur)=>{
	oResult[cur] = true;
	return oResult;
}, {});

class keyDownFn {
	getFnArr(getAll){
		const withNothing = [
			{key: '`' , name: '播放后半句', fn: this.toPlay.bind(this, true)},
			{key: 'Tab', name: '播放当前句', fn: this.toPlay.bind(this)},
			{key: 'Prior', name: '上一句', fn: this.previousAndNext.bind(this, -1)},
			{key: 'Next', name: '下一句', fn: this.previousAndNext.bind(this, 1)},
			{key: 'F1', name: '设定起点', fn: this.cutHere.bind(this, 'start')},
			{key: 'F2', name: '设定起点', fn: this.cutHere.bind(this, 'end')},
			{key: 'F3', name: '删除当前句', fn: this.giveUpThisOne.bind(this)},
			{key: 'F4', name: '查询选中单词', fn: this.searchWord.bind(this, true)},
			{key: 'Escape', name: '取消播放', fn: this.toStop.bind(this)}, // 停止播放
		];
		const withCtrl = [
			{key: 'ctrl + d', name: '删除一行',  fn: this.toDel.bind(this)},
			{key: 'ctrl + z', name: '撤销',  fn: this.setHistory.bind(this, -1)},
			{key: 'ctrl + s', name: '保存到云（字幕）',  fn: this.uploadToCloudBefore.bind(this)}, 
			{key: 'ctrl + j', name: '合并上一句',  fn: this.putTogether.bind(this, 'prior')}, 
			{key: 'ctrl + k', name: '合并下一句',  fn: this.putTogether.bind(this, 'next')}, 
			{key: 'ctrl + Enter', name: '播放',  fn: this.toPlay.bind(this)},
			{key: 'ctrl + shift + Enter', name: '播放',  fn: this.toPlay.bind(this, true)},
			{key: 'ctrl + shift + z', name: '恢复',  fn: this.setHistory.bind(this, 1)},
			{key: 'ctrl + shift + c', name: '分割',  fn: this.split.bind(this)},
			{key: 'ctrl + shift + s', name: '保存到本地',  fn: this.toSaveInDb.bind(this)}, 
		];
		const withAlt = [
			// 修改选区
			{key: 'alt + ]', name: '扩选', fn: this.chooseMore.bind(this)}, 
			{key: 'alt + u', name: '起点向左', fn: this.fixRegion.bind(this, 'start', -0.07)}, 
			{key: 'alt + i', name: '起点向右', fn: this.fixRegion.bind(this, 'start', 0.07)}, 
			{key: 'alt + n', name: '终点向左', fn: this.fixRegion.bind(this, 'end', -0.07)}, 
			{key: 'alt + m', name: '终点向右', fn: this.fixRegion.bind(this, 'end', 0.07)}, 
			// 选词
			{key: 'alt + a', name: '', fn: this.toInset.bind(this, 0)},
			{key: 'alt + s', name: '', fn: this.toInset.bind(this, 1)},
			{key: 'alt + d', name: '', fn: this.toInset.bind(this, 2)},
			{key: 'alt + f', name: '', fn: this.toInset.bind(this, 3)},
			// 未分类
			{key: 'alt + j', name: '', fn: this.previousAndNext.bind(this, -1)},
			{key: 'alt + k', name: '', fn: this.previousAndNext.bind(this, 1)},
			{key: 'alt + l', name: '跳到最后一句', fn: this.goLastLine.bind(this)},
			{key: 'alt + ,', name: '波形横向缩放', fn: this.zoomWave.bind(this, {deltaY: 1})},
			{key: 'alt + .', name: '波形横向缩放', fn: this.zoomWave.bind(this, {deltaY: -1})},
			// alt + shift
			{key: 'alt + shift + ,', name: '波形高低', fn: this.changeWaveHeigh.bind(this, -1)},
			{key: 'alt + shift + .', name: '波形高低', fn: this.changeWaveHeigh.bind(this, 1)},
			{key: 'alt + shift + j', name: '向【左】插入一句', fn: this.toInsert.bind(this, -1) },
			{key: 'alt + shift + k', name: '向【右】插入一句', fn: this.toInsert.bind(this, 1) },
			{key: 'alt + shift + d', name: '保存单词到云', fn: this.saveWord.bind(this)},
			{key: 'alt + shift + c', name: '查字典', fn: this.searchWord.bind(this)},
		];
		if (getAll) return [...withNothing, ...withCtrl, ...withAlt];
		return [withNothing, withCtrl, withAlt];
	}
	// ▼按下按键事件（全局）
	keyDowned(ev) {
		const ctrl = ev.ctrlKey ? 'ctrl + ' : '';
		const alt = ev.altKey ? 'alt + ' : '';
		const shift = ev.shiftKey ? 'shift + ' : '';
		const keyName = keyMap[ev.keyCode] || '';
		const keyStr = ctrl + alt + shift + keyName;
		if (oAlphabet[keyStr]) return;
		const theFn = this.oFnLib[keyStr];
		if (!theFn) return;
		console.log('触发方法：', keyStr);
		theFn();
		ev.preventDefault();
		ev.stopPropagation();
	}
	// ▼ 输入框文字改变
	valChanged(ev) {
		clearTimeout(this.typeingTimer);
		const sText = ev.target.value; // 当前文字
		if (/\n/.test(sText)) return this.previousAndNext(1, true);
		const idx = ev.target.selectionStart;
		const sLeft = sText.slice(0, idx);
		let sTyped = ''; // 单词开头（用于搜索的）
		if (sLeft.endsWith(' ')) { // 进入判断 sTyped 一定是空字符
			// 如果键入了【非】英文字母，【需要】生成新历史
			this.saveHistory({
				aLineArr: this.state.aLineArr,
				iCurLineIdx: this.state.iCurLineIdx,
				sCurLineTxt: sText,
			});
		} else {
			// 英文字母结尾，【不要】生成新历史
			const sRight = sText.slice(idx);
			const needToCheck = /\b[a-z]{1,20}$/i.test(sLeft) && /^(\s*|\s+.+)$/.test(sRight);
			if (needToCheck) sTyped = sLeft.match(/\b[a-z]+$/gi).pop();
		}
		this.setState({
			sTyped, sCurLineTxt: sText,
		});
		this.getMatchedWords(sTyped);
	}
	// ▼搜索匹配的单词
	getMatchedWords(sTyped = '') {
		console.time('本地查找★★');
		sTyped = sTyped.toLocaleLowerCase().trim();
		const iMax = 8;
		const aMatched = (() => {
			const {aWords, aNames} = this.state;
			const allWords = aWords.concat(aNames);
			if (!sTyped) return allWords;
			const aFiltered = [];
			// ▼遍历耗时 ≈ 0.0x 毫秒
			for (let idx = allWords.length; idx--;){
				if (allWords[idx].toLocaleLowerCase().startsWith(sTyped)){
					aFiltered.push(allWords[idx]);
					if (aFiltered.length===iMax) break; // 最多x个，再多也没法按数字键去选取
				}
			}
			return aFiltered;
		})();
		this.setState({aMatched});
		const isNeedReplenish = sTyped && aMatched.length < iMax;
		if (isNeedReplenish){
			this.typeingTimer = setTimeout(()=>{
				this.checkDict(sTyped, aMatched, iMax);
			}, 280);
		}
		console.timeEnd('本地查找★★');
	}
	// ▼ 查字典 耗时 > 100ms
	async checkDict(sTyped, aMatched, iMax){
		console.time('查字典');
		const theTB = wordsDB[sTyped[0]].where('word').startsWith(sTyped);
		const res = await theTB.limit(iMax - aMatched.length).toArray();
		res.forEach(({word})=>{
			const hasIn = aMatched.find(one=>{
				return one.toLocaleLowerCase() === word.toLocaleLowerCase();
			});
			hasIn || aMatched.push(word);
		});
		console.timeEnd('查字典');
		this.setState({aMatched});
	}
}


// ▲处理按键
// ▼其它


class part02 {
	// ▼切换当前句子（上一句，下一句）
	previousAndNext(iDirection, isWantSave) {
		const { buffer, aLineArr, iCurLineIdx } = this.state; // iCurStep
		if (iCurLineIdx === 0 && iDirection === -1) return; //不可退
		const iCurLineNew = iCurLineIdx + iDirection;
		const newLine = (() => {
			if (aLineArr[iCurLineNew]) return false; //有数据，不新增
			if ((buffer.duration - aLineArr[iCurLineIdx].end) < 0.1) return null; //临近终点，不新增
			return this.figureOut(aLineArr.last_.end); // 要新增一行，返回下行数据
		})();
		if (newLine === null) return this.message.error(`已经到头了`);
		this.goLine(iCurLineNew, newLine);
		// ▲跳转
		// ▼处理保存相关事宜
		// TODO 保存相关判断最好放在 【goLine】中统一处理
		// console.log('需要计算：', !!isWantSave);
		// if (!(isWantSave && iCurStep > 0 && iCurLineNew % 2)) return; // 不满足保存条件 return
		// const isNeedSave = (() => {
		// 	if (newLine) return true; // 新建行了，得保存！
		// 	const aOldlines = this.aHistory[iCurStep - 1].aLineArr; // 提取上一步的行数据
		// 	if (!aOldlines[iCurLineIdx]) debugger;
		// 	const bResult = aOldlines[iCurLineIdx].text !== aLineArr[iCurLineIdx].text;
		// 	console.log('bResult', bResult);
		// 	return bResult; // 当前行与上一行不一样，保存！
		// })();
		// isNeedSave && this.toSaveInDb();
	}
	// ▼删除某行
	toDel() {
		let { iCurLineIdx } = this.state;
		const aLineArr = this.state.aLineArr.dc_;
		if (aLineArr.length <= 1) return;
		aLineArr.splice(iCurLineIdx, 1);
		const iMax = aLineArr.length - 1;
		if (iCurLineIdx >= iMax) iCurLineIdx = iMax;
		const oNewState = {aLineArr, iCurLineIdx};
		this.saveHistory(oNewState);
		this.setState({
			...oNewState,
			sCurLineTxt: aLineArr[iCurLineIdx].text,
		});
		this.goLine(iCurLineIdx, false, true);
	}
	// ▼保存字幕到浏览器
	async toSaveInDb(bForUpload) {
		if (bForUpload){
			const {aLineArr, iCurLineIdx, sCurLineTxt=''} = this.state;
			const isDifferent = aLineArr[iCurLineIdx].text !== sCurLineTxt;
			if (isDifferent){
				aLineArr[iCurLineIdx].text = sCurLineTxt.trim();
				this.setState({aLineArr});
			}
		}
		const {
			oMediaInfo: {id},
			aLineArr: subtitleFile_,
		} = this.state;
		const [,oTime] = await getQiniuToken();
		const changeTs_ = oTime.getTime();
		if (!id) return this.message.error('保存未成功');
		mediaTB.update(id, {subtitleFile_, changeTs_});
		this.setState({changeTs: changeTs_});
		if (!bForUpload){
			this.message.success('保存成功');
		}
	}
	// ▼微调区域（1参可能是 start、end。2参是调整步幅
	fixRegion(sKey, iDirection) {
		const {aLineArr, iCurLineIdx} = this.state;
		const oOld = aLineArr[iCurLineIdx];
		const previous = aLineArr[iCurLineIdx - 1];
		const next = aLineArr[iCurLineIdx + 1];
		let fNewVal = oOld[sKey] + iDirection;
		if (fNewVal < 0) fNewVal = 0;
		if (previous && fNewVal < previous.end) {
			fNewVal = previous.end;
		}
		if (next && fNewVal > next.start) {
			fNewVal = next.start;
		}
		this.setTime(sKey, fNewVal);
	}
	// ▼重新定位起点，终点
	cutHere(sKey) {
		const oAudio = this.oAudio.current;
		if (!oAudio) return;
		this.setTime(sKey, oAudio.currentTime);
	}
	// ▼合并
	putTogether(sType) {
		let {iCurLineIdx, sCurLineTxt} = this.state;
		const aLineArr = this.state.aLineArr.dc_;
		aLineArr[iCurLineIdx].text = sCurLineTxt;
		this.saveHistory({aLineArr: aLineArr.dc_, iCurLineIdx});
		const isMergeNext = sType === 'next';
		const oTarget = ({
			prior: aLineArr[iCurLineIdx - 1], //合并上一条
			next: aLineArr[iCurLineIdx + 1], //合并下一条
		}[sType]);
		if (!oTarget) return; //没有邻居不再执行
		const oCur = aLineArr[iCurLineIdx];
		oTarget.start = Math.min(oTarget.start, oCur.start);
		oTarget.end = Math.max(oTarget.end, oCur.end);
		oTarget.text = (() => {
			const aResult = [oTarget.text, oCur.text];
			if (isMergeNext) aResult.reverse();
			return aResult.join(' ').replace(/\s{2,}/g, ' ');
		})();
		fixTime(oTarget);
		aLineArr.splice(iCurLineIdx, 1);
		if (!isMergeNext) iCurLineIdx--;
		const obj = {aLineArr, iCurLineIdx};
		this.saveHistory(obj);
		this.setState({...obj, sCurLineTxt: aLineArr[iCurLineIdx].text});
	}
	// ▼一刀两段
	split() {
		this.goLine();
		const { selectionStart } = this.oTextArea.current;
		const { currentTime } = this.oAudio.current;
		const { iCurLineIdx, sCurLineTxt } = this.state;
		const aLineArr = this.state.aLineArr.dc_;
		const oCurLine = aLineArr[iCurLineIdx];
		const aNewItems = [
			fixTime({
				...oCurLine,
				end: currentTime,
				text: sCurLineTxt.slice(0, selectionStart).trim(),
			}),
			fixTime({
				...oCurLine,
				start: currentTime + 0.01,
				text: sCurLineTxt.slice(selectionStart).trim(),
			}),
		];
		aLineArr.splice(iCurLineIdx, 1, ...aNewItems);
		this.saveHistory({ aLineArr, iCurLineIdx });
		this.setState({aLineArr, sCurLineTxt: aNewItems[0].text});
	}
	// ▼撤销-恢复
	setHistory(iType) {
		const { length } = this.aHistory;
		let iCurStep = this.state.iCurStep + iType;
		console.log('前往：', iCurStep);
		if (iCurStep < 0 || iCurStep > length - 1) {
			const actionName = { '-1': '上', '1': '下' }[iType];
			return this.message.error(`没有${actionName}一步数据，已经到头了`);
		}
		const oHistory = this.aHistory[iCurStep];
		const {aLineArr, iCurLineIdx} = oHistory;
		this.setState({ 
			iCurStep,
			aLineArr,
			iCurLineIdx,
			sCurLineTxt: oHistory.sCurLineTxt || aLineArr[iCurLineIdx].text,
		});
		this.goLine(iCurLineIdx, false, true);
	}
	// ▼插入一句。 参数说明：-1=向左，1=向右
	toInsert(iDirection) {
		const isToLeft = iDirection === -1;
		let {iCurLineIdx} = this.state;
		let aLineArr = this.state.aLineArr.dc_;
		const { start, end } = aLineArr[iCurLineIdx]; //当前行
		if (start === 0) return; //0开头，不可向前插入
		const oAim = aLineArr[iCurLineIdx + iDirection] || {};
		const newIdx = isToLeft ? iCurLineIdx : iCurLineIdx + 1;
		const oNewLine = fixTime({
			start: isToLeft ? (oAim.end || 0) : end,
			end: (
				isToLeft
				? start 
				: Math.min(oAim.start || end + 10, this.state.buffer.duration + 0.5)
			),
		});
		if (oNewLine.start === oNewLine.end) return;
		aLineArr.splice(newIdx, 0, oNewLine);
		iCurLineIdx += isToLeft ? 0 : 1;
		const oNewState = {aLineArr, iCurLineIdx};
		this.saveHistory(oNewState);
		this.setState(oNewState);
	}
	// ▼抛弃当前行，或处理第一行
	giveUpThisOne(start = this.getCurLine().end){
		const oNextLine = this.figureOut(start); //返回下一行的数据
		this.setCurLine(oNextLine);
	}
	// 停止播放
	toStop() {
		this.setState({ playing: false });
	}
	// ▼到最后一行
	goLastLine() {
		const { aLineArr, iCurLineIdx } = this.state;
		let idx = aLineArr.findIndex(cur => cur.text.length <= 1);
		if (idx === -1 || idx === iCurLineIdx) idx = aLineArr.length - 1;
		this.goLine(idx);
		document.querySelectorAll('textarea')[0].focus();
	}
	// ▼插入选中的单词
	toInset(idx) {
		console.log('插入----', idx);
		let { sTyped, aMatched, sCurLineTxt } = this.state;
		const theWord = (aMatched[idx] || '').slice(sTyped.length);
		if (!theWord) return;
		const myTextArea = this.oTextArea.current;
		const cursorIdx = myTextArea.selectionStart;
		const [left, right] = [
			sCurLineTxt.slice(0, cursorIdx),
			sCurLineTxt.slice(cursorIdx),
		];
		const newLeft = left + theWord;
		sCurLineTxt = (newLeft + right).trim();
		this.setState({ sCurLineTxt });
		myTextArea.selectionStart = myTextArea.selectionEnd = newLeft.length;
	}
	// ▼扩选
	chooseMore() {
		const oCurLine = this.getCurLine();
		const newEnd = this.figureOut(oCurLine.end, 0.35).end;
		this.setTime('end', newEnd);
		this.goToCurLine();
	}
}

export default window.mix(
	keyDownFn, part02,
);