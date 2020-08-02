import keyMap from './key-map.js';

export default class {
	getFn(keyStr) {
		const type01 = { //单键系列
			'`': () => this.toPlay(true), //播放
			'Tab': () => this.toPlay(), //播放
			'Prior': () => this.previousAndNext(-1),
			'Next': () => this.previousAndNext(1),
			'F1': () => this.cutHere('start'),
			'F2': () => this.cutHere('end'),
		};
		const type02 = { // ctrl 系列
			'ctrl + d': () => this.toDel(), //删除
			'ctrl + z': () => this.setHistory(-1), //撤销
			'ctrl + s': () => this.toSaveInDb(), //保存到浏览器
			'ctrl + j': () => this.putTogether('prior'), // 合并上一句
			'ctrl + k': () => this.putTogether('next'), // 合并下一句
			...{ //+shift
				'ctrl + Enter': () => this.toPlay(), //播放
				'ctrl + shift + Enter': () => this.toPlay(true), //播放
				'ctrl + shift + z': () => this.setHistory(1), //恢复
				'ctrl + shift + c': () => this.split(), //分割
				'ctrl + shift + s': () => this.toExport(), // 导出到本地
			},
		};
		const type03 = { // alt 系列
			'alt + j': () => this.previousAndNext(-1),
			'alt + k': () => this.previousAndNext(1),
			'alt + l': () => this.goLastLine(), // 跳到最后一句 l = last
			'alt + ,': () => this.zoomWave({ deltaY: 1 }), //波形横向缩放
			'alt + .': () => this.zoomWave({ deltaY: -1 }), //波形横向缩放
			'alt + u': () => this.fixRegion('start', -0.07), //起点向左
			'alt + i': () => this.fixRegion('start', 0.07), //起点向右
			'alt + n': () => this.fixRegion('end', -0.07), //终点向左
			'alt + m': () => this.fixRegion('end', 0.07), //终点向右
			'alt + ]': () => this.chooseMore(), //扩选
			'alt + number': number => this.toInset(number - 1), //取词
			...{ // +shift
				'alt + shift + ,': () => this.changeWaveHeigh(-1), //波形高低
				'alt + shift + .': () => this.changeWaveHeigh(1), //波形高低
				'alt + shift + j': () => this.toInsert(-1), // 向【左】插入一句
				'alt + shift + k': () => this.toInsert(1), // 向【右】插入一句
				'alt + shift + d': () => this.saveWord(), //保存单词到DB
				'alt + shift + c': () => this.toStop(), //停止播放
			},
		}
		const fnLib = { ...type01, ...type02, ...type03 };
		let fn = fnLib[keyStr];
		if (!fn) {
			const isMatch = keyStr.match(/alt \+ [asdf\d]/);
			if (!isMatch) return false; //没有相关方法
			const last = keyStr.slice(-1);
			const number = { a: 1, s: 2, d: 3, f: 4 }[last];
			return type03['alt + number'].bind(this, number || last);
		}
		return fn.bind(this);
	}
	// ▼按下按键事件
	keyDowned(ev) {
		const { ctrlKey, shiftKey, altKey, keyCode } = ev;
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
	previousAndNext(iDirection, isWantSave) {
		const { aSteps, iCurStep, buffer } = this.state;
		const { iCurLine, aLines } = aSteps[iCurStep];
		if (iCurLine === 0 && iDirection === -1) return; //不可退
		const iCurLineNew = iCurLine + iDirection;
		const newLine = (() => {
			if (aLines[iCurLineNew]) return false; //有数据，不用新增
			if ((buffer.duration - aLines[iCurLine].end) < 1) return null; //临近终点不新增
			return this.figureOut(aLines.last_.end); //返回下一行的数据
		})();
		if (newLine === null) return this.message.error(`已经到头了`);
		this.goLine(iCurLineNew, newLine);
		// ▲跳转
		// ▼处理保存相关事宜
		if (!(isWantSave && iCurStep > 0 && iCurLineNew % 2)) return; // 不满足保存条件 return
		const isNeedSave = (() => {
			if (newLine) return true; //新建行了，得保存！
			const { aLines: aOldlines } = aSteps[iCurStep - 1]; //提取上一步的行数据
			if (!aOldlines[iCurLine]) { //当前行在上一步历史中不存在，保存！（此判断好像不会判断通过，观察观察
				this.message.error(`当前行在上一步历史中不存在`);
				return true;
			}
			return aOldlines[iCurLine].text !== aLines[iCurLine].text; //当前行与上一行不一样，保存！
		})();
		isNeedSave && this.toSaveInDb();
	}
	// ▼提供【波形数组】用于断句
	getWaveArr(fEndSec, iPerSecPx) {
		const { aPeaks } = this.getPeaks(
			this.state.buffer, iPerSecPx, (iPerSecPx * fEndSec), iPerSecPx * 20, // 取当前位置往后x秒
		);
		const myArr = aPeaks.reduce((result, cur, idx, arr) => {
			if (idx % 2) return result; //只处理0、2、4。不处理：1、3、5
			const iOnePxHeight = Math.round((cur - arr[idx + 1]) * this.state.iHeight);
			return result.concat(iOnePxHeight);
		}, []);
		return myArr;
	}
	// ▼提供断句方法一个【候选区间的数组】
	getCandidateArr(aWaveArr, iPerSecPx, iWaveHeight) {
		const aSection = []; // 用于返回的数据
		for (let idx = 0; idx < aWaveArr.length; idx++) {
			const iCurHeight = aWaveArr[idx];
			if (iCurHeight < iWaveHeight) continue;
			const oLast = aSection.last_;
			if (oLast && (idx - oLast.end) / iPerSecPx < 0.35) { //上一区间存在 && 距离上一区间很近(0.35秒之内)。则视为一段话，累加长度
				const { start, end, fAveHeight } = oLast;
				const pxLong = idx - start + 1;
				oLast.end = idx;
				oLast.long = pxLong / iPerSecPx; //长度（秒）
				oLast.fAveHeight = Math.round(((end - start + 1) * fAveHeight + iCurHeight) / pxLong); //平均高度
				continue;
			}
			aSection.push({ // 视为新句子，新建
				start: idx, end: idx, long: 0, fAveHeight: iCurHeight,
			});
			if (!oLast) continue;
			oLast.iDistanceToNext = (idx - oLast.end) / iPerSecPx; //到下一步的距离
		}
		return aSection;
	}
	// ▼处理尾部
	fixTail(aWaveArr, iOldEnd, iPerSecPx, iAddition, iDistanceToNext){
		const iSupplement = (()=>{
			for (let idx = 0; idx < iPerSecPx; idx++) { //在1秒范围内进行判断
				const iOneStepPx = 10;
				const iSum = aWaveArr.slice(idx, idx + iOneStepPx).reduce((result, cur)=>{
					return result + cur;
				});
				if (iSum / iOneStepPx < 2) return idx;
			}
			return false;
		})();
		const iResult = (()=>{
			if (iSupplement && iSupplement < iPerSecPx * 0.6){
				// console.error('分析数据：', aWaveArr.slice(0, 100));
				console.error('此后无声：', iSupplement, '补上！');
				return iSupplement + iAddition * 0.7;
			}
			return iAddition; //默认补偿值
		})();
		const iMaxEnd = iOldEnd + (iDistanceToNext * iPerSecPx - iAddition * 0.5);
		return Math.min(iOldEnd + iResult, iMaxEnd); //即便补偿，不能越界
	}
	// ▼智能断句：1参是上一步的结尾的秒数， 2参是在取得的区间的理想的长度（秒数）
	figureOut(fEndSec, fLong = 3) {
		const [iPerSecPx, iWaveHeight, iAddition] = [100, 12, 20]; // 默认每秒宽度值（px），高度阈值，添加在两头的空隙，
		const aWaveArr = this.getWaveArr(fEndSec, iPerSecPx); //取得波形
		const aSection = this.getCandidateArr(aWaveArr, iPerSecPx, iWaveHeight).filter(cur => {
			const isCondition01 = cur.long > 0.3; // 只留下大于x秒的
			const isCondition02 = cur.long > 0.2 && cur.fAveHeight >= iWaveHeight * 2; //或者声音很大
			return isCondition01 || isCondition02;
		});
		const { start, end } = (() => {
			if (!aSection[0]) return {start: 0, end: aWaveArr.length};
			const [oFirst, oSecond] = aSection;
			const start = Math.max(0, oFirst.start - iAddition);
			let {end, iDistanceToNext} = (()=>{
				if (oFirst.long >= fLong || oFirst.iDistanceToNext > 1.5 || !oSecond) { //长度已达标 || 第二选择太远了 || 没有第二选择
					return oFirst;
				}
				return oSecond;
			})();
			end = this.fixTail(aWaveArr.slice(end), end, iPerSecPx, iAddition, iDistanceToNext);
			return {start, end};
		})();
		return this.fixTime({
			start: fEndSec + (start / iPerSecPx),
			end: fEndSec + (end / iPerSecPx),
		});
	}
	// ▼输入框文字改变
	valChanged(ev) {
		const { value: sText, selectionStart: idx } = ev.target;
		let sTyped = ''; // 单词开头（用于搜索的）
		const [sLeft, sRight] = [sText.slice(0, idx), sText.slice(idx)];
		const { aSteps, iCurStep } = this.state;
		const { iCurLine, aLines } = aSteps[iCurStep]; // 当前步骤
		if (sLeft.match(/.+[^a-zA-Z]$/)) { // 如果键入了【非】英文字母，【需要】生成新历史
			this.setCurLine({ ...aLines[iCurLine], text: sText });
			this.setState({ sTyped }); // 进入判断 sTyped 一定是空字符
		} else { // 英文字母结尾，【不要】生成新历史
			const needToCheck = /\b[a-z]{1,20}$/i.test(sLeft) && /^(\s*|\s+.+)$/.test(sRight);
			if (needToCheck) sTyped = sLeft.match(/\b[a-z]+$/gi).pop();
			aLines[iCurLine].text = sText;
			this.setState({ aSteps, sTyped });
		}
		this.getMatchedWords(sTyped);
	}
	async getMatchedWords(sTyped = '') {
		sTyped = sTyped.toLocaleLowerCase().trim();
		const { aWords = [], oWordsDB } = this.state;
		const aMatched = (() => {
			if (!sTyped) return aWords;
			const aFiltered = aWords.filter(cur => cur.toLocaleLowerCase().startsWith(sTyped));
			return aFiltered.slice(0, 9); //最多9个，再多也没法按数字键去选取
		})();
		if (oWordsDB && sTyped && aMatched.length < 9) {
			const theTB = oWordsDB[sTyped[0]].where('word').startsWith(sTyped);
			const res = await theTB.limit(9 - aMatched.length).toArray();
			aMatched.push(...res.map(({ word }) => word));
		}
		this.setState({ aMatched });
	}
	// ▼按下回车键
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
	async toSaveInDb() {
		const { fileName, oTarget, oSectionTB, oSct } = this.state;
		const { storyId, sctId } = oTarget;
		const { aLines } = this.getCurStep();
		if (storyId && sctId) { //有本地数据
			await oSectionTB.update(oSct.id, { aLines }); //增量更新
		} else if (fileName) {
			await window.lf.setItem(fileName, aLines);
		} else {
			return;
		}
		this.message.success('保存成功');
	}
	// ▼微调区域（1参可能是 start、end
	fixRegion(sKey, iDirection) {
		const { iCurLine, aLines } = this.getCurStep(true);
		const oOld = aLines[iCurLine];
		// const oOld = this.getCurLine();
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
	cutHere(sKey) {
		const oAudio = this.oAudio.current;
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
		this.fixTime(oTarget);
		aLines.splice(iCurLine, 1);
		oCurStepDc.iCurLine = isMergeNext ? iCurLine : iCurLine - 1;
		this.setCurStep(oCurStepDc);
	}
	// ▼一刀两段
	split() {
		const selectionStart = (
			this.oTextArea.current.selectionStart ||
			document.getElementById('myTextArea').selectionStart
		);
		const { currentTime } = this.oAudio.current;
		const { oCurStepDc, iCurLine } = this.getCurStep();
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
		const oNewLine = this.fixTime({
			start: isToLeft ? (oAim.end || 0) : end,
			end: isToLeft ? start : (oAim.start || end + 10),
		});
		if (oNewLine.start === oNewLine.end) return;
		oCurStepDc.aLines.splice(newIdx, 0, oNewLine);
		oCurStepDc.iCurLine += isToLeft ? 0 : 1;
		this.setCurStep(oCurStepDc);
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
		const myTextArea = document.getElementById('myTextArea');
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
	}
}

