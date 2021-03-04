/*
 * @Author: 李星阳
 * @Date: 2021-02-19 16:35:07
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-03-03 21:14:38
 * @Description: 
 */

import {keyMap} from './key-map.js';
import {fixTime } from 'assets/js/pure-fn.js';
import {trainingDB, wordsDB} from 'assets/js/common.js';
import {getQiniuToken} from 'assets/js/learning-api.js';
import {aAlphabet} from 'assets/js/common.js';

const {media: mediaTB} = trainingDB;
const oAlphabet = aAlphabet.reduce((oResult, cur)=>{
	oResult[cur] = true;
	return oResult;
}, {});

export default class {
	getFn(keyStr) {
		const fnLib = {
			// 单键系列 ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
			'`': () => this.toPlay(true), //播放后半句
			'Tab': () => this.toPlay(), //播放
			'Prior': () => this.previousAndNext(-1),
			'Next': () => this.previousAndNext(1),
			'F1': () => this.cutHere('start'),
			'F2': () => this.cutHere('end'),
			'F3': () => this.giveUpThisOne(),
			'F4': () => this.searchWord(), //保存单词到云
			// ctrl 系列 ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
			'ctrl + d': () => this.toDel(), //删除一行
			'ctrl + z': () => this.setHistory(-1), //撤销
			'ctrl + s': () => this.uploadToCloudBefore(), // 保存到云（字幕）
			'ctrl + j': () => this.putTogether('prior'), // 合并上一句
			'ctrl + k': () => this.putTogether('next'), // 合并下一句
			// ctrl + shift
			'ctrl + Enter': () => this.toPlay(), //播放
			'ctrl + shift + Enter': () => this.toPlay(true), //播放
			'ctrl + shift + z': () => this.setHistory(1), //恢复
			'ctrl + shift + c': () => this.split(), //分割
			'ctrl + shift + s': () => this.toSaveInDb(), // 保存到本地
			// alt 系列  ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
			// 修改选区
			'alt + ]': () => this.chooseMore(), //扩选
			'alt + u': () => this.fixRegion('start', -0.07), //起点向左
			'alt + i': () => this.fixRegion('start', 0.07), //起点向右
			'alt + n': () => this.fixRegion('end', -0.07), //终点向左
			'alt + m': () => this.fixRegion('end', 0.07), //终点向右
			// 选词
			'alt + a': () => this.toInset(0),
			'alt + s': () => this.toInset(1),
			'alt + d': () => this.toInset(2),
			'alt + f': () => this.toInset(3),
			// 未分类
			'alt + j': () => this.previousAndNext(-1),
			'alt + k': () => this.previousAndNext(1),
			'alt + l': () => this.goLastLine(), // 跳到最后一句 l = last
			'alt + ,': () => this.zoomWave({deltaY: 1}), //波形横向缩放
			'alt + .': () => this.zoomWave({deltaY: -1}), //波形横向缩放
			// alt + shift
			'alt + shift + ,': () => this.changeWaveHeigh(-1), //波形高低
			'alt + shift + .': () => this.changeWaveHeigh(1), //波形高低
			'alt + shift + j': () => this.toInsert(-1), // 向【左】插入一句
			'alt + shift + k': () => this.toInsert(1), // 向【右】插入一句
			'alt + shift + d': () => this.saveWord(), //保存单词到云
			'alt + shift + c': () => this.toStop(), //停止播放
		};
		const fn = fnLib[keyStr];
		if (fn) return fn.bind(this);
	}
	// ▼按下按键事件（全局）
	keyDowned(ev) {
		const ctrl = ev.ctrlKey ? 'ctrl + ' : '';
		const alt = ev.altKey ? 'alt + ' : '';
		const shift = ev.shiftKey ? 'shift + ' : '';
		const keyName = keyMap[ev.keyCode] || '';
		const keyStr = ctrl + alt + shift + keyName;
		if (oAlphabet[keyStr]) return; // 单字母不处理
		const theFn = this.getFn(keyStr);
		if (!theFn) return;
		// keyName && console.log('按下了：', ev.keyCode, keyStr);
		theFn();
		ev.preventDefault();
		ev.stopPropagation();
	}
	// ▼切换当前句子（上一句，下一句）
	previousAndNext(iDirection, isWantSave) {
		const { aSteps, iCurStep, buffer, aLineArr, iCurLineIdx } = this.state;
		// const { iCurLine, aLines } = aSteps[iCurStep];
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
		if (!(isWantSave && iCurStep > 0 && iCurLineNew % 2)) return; // 不满足保存条件 return
		const isNeedSave = (() => {
			if (newLine) return true; //新建行了，得保存！
			const { aLineArr: aOldlines } = aSteps[iCurStep - 1]; //提取上一步的行数据
			if (!aOldlines[iCurLineIdx]) { //当前行在上一步历史中不存在，保存！（此判断好像不会判断通过，观察观察
				this.message.error(`当前行在上一步历史中不存在`);
				return true;
			}
			return aOldlines[iCurLineIdx].text !== aLineArr[iCurLineIdx].text; //当前行与上一行不一样，保存！
		})();
		isNeedSave && this.toSaveInDb();
	}

	// ▼ 输入框文字改变
	valChanged(ev) {
		clearTimeout(this.typeingTimer);
		console.time('输入了');
		const sText = ev.target.value; // 当前文字
		const idx = ev.target.selectionStart;
		const sLeft = sText.slice(0, idx);
		let sTyped = ''; // 单词开头（用于搜索的）
		const aLineArr = this.state.aLineArr;
		aLineArr[this.state.iCurLineIdx].text = sText;
		if (/.+[^a-zA-Z]$/.test(sLeft)) {
			// 进入判断 sTyped 一定是空字符
			// 如果键入了【非】英文字母，【需要】生成新历史
			// this.setCurLine(aLines[iCurLine].dc_);
		} else {
			// 英文字母结尾，【不要】生成新历史
			const sRight = sText.slice(idx);
			const needToCheck = /\b[a-z]{1,20}$/i.test(sLeft) && /^(\s*|\s+.+)$/.test(sRight);
			if (needToCheck) sTyped = sLeft.match(/\b[a-z]+$/gi).pop();
		}
		this.setState({sTyped, aLineArr});
		console.timeEnd('输入了');
		this.typeingTimer = setTimeout(()=>{
			this.getMatchedWords(sTyped);
			console.log('开始提示词汇 ★★★');
		}, 500);
	}
	async getMatchedWords(sTyped = '') {
		sTyped = sTyped.toLocaleLowerCase().trim();
		const iMax = 7;
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
		if (sTyped && aMatched.length < iMax) {
			const theTB = wordsDB[sTyped[0]].where('word').startsWith(sTyped);
			const res = await theTB.limit(iMax - aMatched.length).toArray();
			// ▲此处检索耗时 > 100ms
			res.forEach(({word})=>{
				const hasIn = aMatched.find(one=>{
					return one.toLocaleLowerCase() === word.toLocaleLowerCase();
				});
				hasIn || aMatched.push(word);
			});
		}
		this.setState({aMatched});
	}
	// ▼ 在输入框按下回车键
	enterKeyDown(ev) {
		const { keyCode, altKey, ctrlKey, shiftKey } = ev;
		const willDo = keyCode === 13 && !altKey && !ctrlKey && !shiftKey;
		if (!willDo) return;
		this.previousAndNext(1, true);
		ev.preventDefault();
		return false;
	}
	// ▼删除某条
	toDel() {
		const { oCurStepDc, iCurLine } = this.getCurStep();
		if (oCurStepDc.aLines.length <= 1) return;
		oCurStepDc.aLines.splice(iCurLine, 1);
		const iMax = oCurStepDc.aLines.length - 1;
		if (oCurStepDc.iCurLine >= iMax) oCurStepDc.iCurLine = iMax;
		this.setCurStep(oCurStepDc);
		this.goToCurLine();
	}
	// ▼保存字幕到浏览器
	async toSaveInDb(dataId) {
		const { oMediaInfo: {id=dataId} } = this.state;
		const { aLines: subtitleFile_ } = this.getCurStep();
		const [,oTime] = await getQiniuToken();
		const changeTs_ = oTime.getTime();
		if (id) { //有本地数据, //增量更新
			mediaTB.update(id, {subtitleFile_, changeTs_});
			this.setState({changeTs: changeTs_});
			return this.message.success('保存成功');
		}
		this.message.error('保存未成功');
	}
	// ▼微调区域（1参可能是 start、end。2参是调整步幅
	fixRegion(sKey, iDirection) {
		const { iCurLine, aLines } = this.getCurStep(true);
		const oOld = aLines[iCurLine];
		const previous = aLines[iCurLine - 1];
		const next = aLines[iCurLine + 1];
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
		const { oCurStepDc, iCurLine } = this.getCurStep();
		const { aLines } = oCurStepDc;
		const isMergeNext = sType === 'next';
		const oTarget = ({
			prior: aLines[iCurLine - 1], //合并上一条
			next: aLines[iCurLine + 1], //合并下一条
		}[sType]);
		if (!oTarget) return; //没有邻居不再执行
		const oCur = aLines[iCurLine];
		oTarget.start = Math.min(oTarget.start, oCur.start);
		oTarget.end = Math.max(oTarget.end, oCur.end);
		oTarget.text = (() => {
			const aResult = [oTarget.text, oCur.text];
			if (isMergeNext) aResult.reverse();
			return aResult.join(' ').replace(/\s{2,}/g, ' ');
		})();
		fixTime(oTarget);
		aLines.splice(iCurLine, 1);
		oCurStepDc.iCurLine = isMergeNext ? iCurLine : iCurLine - 1;
		this.setCurStep(oCurStepDc);
	}
	// ▼一刀两段
	split() {
		const {selectionStart} = this.oTextArea.current;
		const { currentTime } = this.oAudio.current;
		const { oCurStepDc, iCurLine } = this.getCurStep();
		const oCurLine = this.getCurLine();
		const aNewItems = [
			fixTime({
				...oCurLine,
				end: currentTime,
				text: oCurLine.text.slice(0, selectionStart).trim(),
			}),
			fixTime({
				...oCurLine,
				start: currentTime + 0.01,
				text: oCurLine.text.slice(selectionStart).trim(),
			}),
		];
		oCurStepDc.aLines.splice(iCurLine, 1, ...aNewItems);
		this.setCurStep(oCurStepDc);
	}
	// ▼撤销-恢复
	setHistory(iType) {
		const { aSteps: { length } } = this.state;
		let iCurStep = this.state.iCurStep + iType;
		if (iCurStep < 0 || iCurStep > length - 1) {
			const actionName = { '-1': '上', '1': '下' }[iType];
			return this.message.error(`没有${actionName}一步数据，已经到头了`);
		}
		this.setState({ iCurStep });
		this.goToCurLine();
	}
	// ▼插入一句。 参数说明：-1=向左，1=向右
	toInsert(iDirection) {
		const isToLeft = iDirection === -1;
		const { iCurLine, aLines, oCurStepDc } = this.getCurStep(); //丰富信息版
		const { start, end } = aLines[iCurLine]; //当前行
		if (start === 0) return; //0开头，不可向前插入
		const oAim = aLines[iCurLine + iDirection] || {};
		const newIdx = isToLeft ? iCurLine : iCurLine + 1;
		const oNewLine = fixTime({
			start: isToLeft ? (oAim.end || 0) : end,
			end: (
				isToLeft ? start 
				: Math.min(oAim.start || end + 10, this.state.buffer.duration + 0.5)
			),
		});
		if (oNewLine.start === oNewLine.end) return;
		oCurStepDc.aLines.splice(newIdx, 0, oNewLine);
		oCurStepDc.iCurLine += isToLeft ? 0 : 1;
		this.setCurStep(oCurStepDc);
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
		const { aLines, iCurLine } = this.getCurStep(true);
		let idx = aLines.findIndex(cur => cur.text.length <= 1);
		if (idx === -1 || idx === iCurLine) idx = aLines.length - 1;
		this.goLine(idx);
		document.querySelectorAll('textarea')[0].focus();
	}
	// ▼插入选中的单词
	toInset(idx) {
		console.log('插入----', idx);
		const { sTyped, aMatched } = this.state;
		const theWord = (aMatched[idx] || '').slice(sTyped.length);
		if (!theWord) return;
		const myTextArea = this.oTextArea.current;
		const cursorIdx = myTextArea.selectionStart;
		const { dc_: oCurLine, text } = this.getCurLine();
		const [left, right] = [text.slice(0, cursorIdx), text.slice(cursorIdx)]
		const newLeft = left + theWord;
		oCurLine.text = (newLeft + right).trim();
		this.setCurLine(oCurLine);
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
