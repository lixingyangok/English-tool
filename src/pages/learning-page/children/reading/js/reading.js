/*
 * @Author: 李星阳
 * @Date: 2021-02-15 21:00:05
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-02-18 12:34:50
 * @Description: 
 */

// import React, {useState} from "react";
import {getOneMedia, getSubtitle} from 'assets/js/learning-api.js';
import {trainingDB} from 'assets/js/common.js';
import {setWrods} from 'assets/js/learning-api.js';

const {media: mediaTB} = trainingDB;


export class Fn01 {
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
		// console.log(ev);
		const {key} = ev;
		const oFn = ({
			'w': () => this.setCurLine(-1),
			's': () => this.setCurLine(1),
			'e': () => this.toPlay(),
			'd': () => this.toRead(),
			'F4': () => this.toSearch(),
		});
		if (!oFn[key]) return;
		oFn[key]();
		// console.log("当前行", curLine);
	}
	keyUpFn(ev){
		const {key} = ev;
		if (key!=='d') return;
		console.log('松手');
		clearInterval(this.state.timer);
		this.setState({isStop: true});
	}
	toRead(iPlaying){
		const {state} = this;
		let {aSubtitle, curLine, isStop, iStartTs, fPlayRate} = state;
		iPlaying = typeof iPlaying === 'number' ? iPlaying : curLine;
		const {long, iTimes=0} = aSubtitle[iPlaying];
		const iNowTs = new Date() * 1;
		if (iPlaying === state.iPlaying){
			const stepLong = isStop ? 0 : iNowTs - iStartTs;
			if (fPlayRate===100 && isStop){
				this.setState({fPlayRate: 0});
			}else{
				fPlayRate += stepLong / 1000 / long * 100; 
				if (fPlayRate>=100) {
					fPlayRate = 100;
					aSubtitle[iPlaying].iTimes = iTimes + 1;
				}
				this.setState({fPlayRate, aSubtitle});
			}
		}else {
			this.setState({fPlayRate: 0, iPlaying});
		}
		this.setState({isStop: false, iStartTs: iNowTs});
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
		this.setState({timer, iPlaying, fPlayRate: 0, isStop: false});
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
	// ▼公共方法▼要提取
	async saveWord(sSearching='') {
		const {oStory, aWords, aNames} = this.state;
		const sWord = sSearching || window.getSelection().toString().trim();
		const canSave = this.checkWord(sWord, !sSearching);
		const tooMuchSpace = (sWord.match(/\s/g) || []).length >= 2;
		if (!canSave || tooMuchSpace) return;
		// ▲通过考验，▼保存
		const isCapitalize = /[A-Z]/.test(sWord[0]);
		const sKey = isCapitalize ? 'names' : 'words'; // 如大写字母开头视为专有名词
		const arrToSubmit = isCapitalize ? aNames : aWords;
		arrToSubmit.push(sWord);
		this.setState({aWords, aNames});
		this.message.success(`保存成功`);
		await setWrods(oStory.ID, sKey, arrToSubmit);
		this.context.updateStoryInfo();
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
