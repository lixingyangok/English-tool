/*
 * @Author: 李星阳
 * @Date: 2021-02-15 21:00:05
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-02-28 21:14:57
 * @Description: 
 */

import React from "react";
import {getOneMedia, getSubtitle} from 'assets/js/learning-api.js';
import {trainingDB} from 'assets/js/common.js';
import {setWrods} from 'assets/js/learning-api.js';
import {message} from 'antd';

const {media: mediaTB} = trainingDB;


class Fn01 {
	async init(mediaId){
		// this.setState({mediaId});
		const [oMedia, mediaInTB={}] = await Promise.all([
			getOneMedia(mediaId),
			mediaTB.where('ID').equals(mediaId*1).first(),
		]);
		if (!oMedia) return;
		if (!oMedia.subtitleFileId) { // 没有字幕信息，返回
			return this.setState({oMedia});
		}
		this.setSubtitle(oMedia);
		const fileSrc = (()=>{
			if (!mediaInTB.mediaFile_) return null;
			return URL.createObjectURL(mediaInTB.mediaFile_);
		})();
		this.setState({oMedia, fileSrc});
	}
	initStoryInfo(){
		const oStory = this.context.oStoryInfo;
		const {words, names} = oStory;
		const aWords = words ? words.split(',') : [];
		const aNames = names ? names.split(',') : [];
		const oWords = aWords.reduce((oResult, cur)=>({
			...oResult, [cur.toLowerCase()]: true,
		}), {});
		const oNames = aNames.reduce((oResult, cur)=>({
			...oResult, [cur.toLowerCase()]: true,
		}), {});
		// if (0) console.log('init', oWords, oNames);
		setTimeout(()=>{
			this.setState({oStory, aWords, aNames, oWords, oNames});
		}, 1 * 1000);
	}
	async setSubtitle(oMedia){
		oMedia = oMedia || this.state.oMedia;
		const aSubtitle = await getSubtitle(oMedia);
		if (!aSubtitle) return;
		// aSubtitle.forEach(cur=>{
		// 	cur.text = cur.text+' ★ '+cur.text;
		// });
		this.setState({aSubtitle});
	}
	keyDownFn(ev){
		const {key} = ev;
		console.log(`按下-${key}-`);
		const oFn = ({
			'w': () => this.setCurLine(-1),
			's': () => this.setCurLine(1),
			'e': () => this.toPlay(),
			'd': () => this.toRead(),
			'a': () => this.goBack(),
			' ': () => this.toRead(),
			'F4': () => this.toSearch(),
		});
		if (!oFn[key]) return;
		oFn[key]();
		ev.preventDefault();
		ev.stopPropagation();
		return;
	}
	keyUpFn(ev){
		const {key} = ev;
		if (!['d', ' '].includes(key)) return;
		console.log('松手了');
		clearInterval(this.state.timer);
		this.setState({isKeyPressing: false});
	}
	goBack(){
		const fPlayRate =  Math.max(0, this.state.fPlayRate - 15);
		this.setState({fPlayRate});
	}
	toRead(iPlaying){
		const {state} = this;
		let {aSubtitle, curLine, iStartTs, fPlayRate, isKeyPressing} = state;
		iPlaying = typeof iPlaying === 'number' ? iPlaying : curLine;
		const {long, iTimes=0} = aSubtitle[iPlaying];
		const iNowTs = new Date() * 1;
		if (iPlaying === state.iPlaying){
			const stepLong = !isKeyPressing ? 0 : iNowTs - iStartTs;
			if (fPlayRate >= 100 && !isKeyPressing){
				this.setState({fPlayRate: 0});
			}else{
				fPlayRate += stepLong / 1000 / long * 100; 
				if (fPlayRate >= 100) {
					fPlayRate = 100;
					aSubtitle[iPlaying].iTimes = iTimes + 1; // 阅读次数？
				}
				this.setState({fPlayRate, aSubtitle});
			}
		}else {
			this.setState({fPlayRate: 0, iPlaying});
		}
		this.setState({isKeyPressing: true, iStartTs: iNowTs});
	}
	// ▼播放
	toPlay(iPlaying){
		const {state} = this;
		clearInterval(state.timer);
		const {aSubtitle, curLine} = state;
		iPlaying = typeof iPlaying === 'number' ? iPlaying : curLine;
		// console.log('播放：', iPlaying);
		const {start, end, long} = aSubtitle[iPlaying];
		const oCurrent =  this.oAudio.current;
		const iTimes = 20; // 每秒执行次数
		const oneStep = 100 / (long * iTimes);
		oCurrent.currentTime = start;
		oCurrent.play();
		const timer = setInterval(() => {
			this.setState({
				fPlayRate: this.state.fPlayRate + oneStep,
			});
			const { currentTime: cTime } = oCurrent;
			if (cTime < end) return;
			clearInterval(state.timer);
			oCurrent.pause();
		}, 1000 / iTimes);
		this.setState({timer, iPlaying, fPlayRate: 0});
	}

	// ▼公共方法▼要提取
	toSearch(){
		const sSearching = window.getSelection().toString().trim();
		if (!sSearching) return;
		// this.saveWord(sSearching);
		this.setState({sSearching: ''}, ()=>{
			this.setState({sSearching});
		});
	}
	
	// ▼设定当前行
	setCurLine(iDirection){
		const {aSubtitle: {length}, curLine: curLineOld} = this.state;
		const curLine = (()=>{
			const iResult = curLineOld + iDirection;
			if (iResult < 0) return 0;
			if (iResult > length-1) return length-1;
			return iResult;
		})();
		this.setState({curLine});
	}
}

class aboutWords {
	toSplit(str){
		const iStart = str.search(/[a-z0-9]/i);
		if (iStart === -1) return [str, '', ''];
		const iEnd = str.slice(iStart).match(/.*[a-z0-9]/i)[0].length + iStart;
		return [
			str.slice(0, iStart), str.slice(iStart, iEnd), str.slice(iEnd),
		];
	}
	strToDom({txt, sClass=''}, idx){
		const [head, body, tail] = this.toSplit(txt);
		// if (iBright === idx) sClass += ' hover';
		return <span key={idx}>
			{head}
			{/* <Popover trigger="hover" placement="topLeft" 
				onVisibleChange={this.handleVisibleChange.bind(this)}
				visible={iBright === idx} content={<Button>按钮1</Button>}
			>
				<span className={sClass}>{body}</span>
			</Popover> */}
			<span className={'word ' + sClass}>{body}</span>
			{tail}
		</span>
	}
	// ▼渲染句子样式
	markWords(sText=''){
		const {oWords=[], oNames=[]} = this.state;
		const aText = sText.match(/\S+\s*/g) || [];
		const iLength = aText.length;
		const aWordsList = [];
		const regExp01 = /\S\w*/;
		const regExp02 = /\w.*/; // 用于 back01 & back02
		const regExpForOneWord = /[\w-]+/;
		for (let idx = 0; idx < iLength; idx++) {
			const cur = aText[idx];
			const len = aWordsList.length;
			const sBack02Txt = (aWordsList[len - 2] || {}).txt || '';
			const sBack01Txt = (aWordsList[len - 1] || {}).txt || '';
			let [sClass, isGoBackTwo] = (()=>{
				if (idx===0) return [''];
				const sCurFixed = cur.match(regExp01)[0];
				const sBack02Fixed = (sBack02Txt.match(regExp02) || [''])[0];
				if (sBack02Fixed){
					const longText = (sBack02Fixed + sBack01Txt + sCurFixed).toLowerCase();
					if (oWords[longText]) return ['new-word', true];
					if (oNames[longText]) return ['name', true];
				}
				const sBack01Fixed = (sBack01Txt.match(regExp02) || [''])[0];
				const sNewOne = (sBack01Fixed + sCurFixed).toLowerCase();
				if (oWords[sNewOne]) return ['new-word'];
				if (oNames[sNewOne]) return ['name'];
				return [''];
			})();
			if (sClass) {
				sClass += ' word-group';
				if (isGoBackTwo){
					const txt = sBack02Txt + sBack01Txt + cur;
					aWordsList.splice(len - 2, 2, {txt, sClass});
				}else{
					aWordsList[len-1] = {txt: sBack01Txt + cur, sClass};
				}
				continue;
			}
			let sCurFixed = (cur.match(regExpForOneWord) || [''])[0];
			sCurFixed = sCurFixed.toLowerCase();
			sClass = oWords[sCurFixed] && 'new-word';
			sClass = sClass || (oNames[sCurFixed] ? 'name' : '');
			aWordsList.push({txt: cur, sClass});
		}
		const {'0': txt} = sText.match(/^\s+/) || [''];
		if (txt) aWordsList.unshift({txt});
		const aResult = aWordsList.map((oCur, idx)=>{
			return this.strToDom(oCur, idx);
		});
		return aResult;
	}
	clickWord(ev){
		const oTarget = ev.target; 
		const sClass = oTarget.className;
		const txt = oTarget.innerText.trim();
		if (!sClass.includes('word') || !txt) return;
		this.saveWord(txt);
	}
	// ▼公共方法▼要提取
	async saveWord(sSearching='') {
		const {oStory, aWords, aNames, oWords, oNames,} = this.state;
		const sWord = sSearching || window.getSelection().toString().trim();
		const canSave = this.checkWord(sWord, !sSearching);
		const tooMuchSpace = (sWord.match(/\s/g) || []).length >= 2;
		if (!canSave || tooMuchSpace) return;
		// ▲通过考验，▼保存
		const isCapitalize = /[A-Z]/.test(sWord[0]);
		const sKey = isCapitalize ? 'names' : 'words'; // 如大写字母开头视为专有名词
		const arrToSubmit = isCapitalize ? aNames : aWords;
		const oAim = isCapitalize ? oNames : oWords;
		arrToSubmit.push(sWord);
		oAim[sWord.toLowerCase()] = true;
		this.setState({ aWords, aNames, oWords, oNames });
		message.success(`保存成功`);
		await setWrods(oStory.ID, sKey, arrToSubmit);
		this.context.updateStoryInfo();
	}
	checkWord(sWord, showTip){
		const {aWords, aNames} = this.state;
		const aAll = aWords.concat(aNames);
		const {error} = message;
		if (aAll.find(cur => cur.toLowerCase() === sWord.toLowerCase())) {
			showTip && error(`已经保存不可重复添加`);
			return;
		}
		if (sWord.length < 2 || sWord.length > 30) {
			showTip && error(`单词长度超出范围：2-30字母`);
			return;
		}
		if (sWord.includes(',')) {
			showTip && error('不能包含英文逗号');
			return;
		}
		return true;
	}
}

export default window.mix(
	Fn01, aboutWords,
)