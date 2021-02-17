/*
 * @Author: 李星阳
 * @Date: 2021-02-15 21:00:05
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-02-17 09:21:53
 * @Description: 
 */

// import React, {useState} from "react";
import {getOneMedia, getSubtitle} from 'assets/js/learning-api.js';
import {trainingDB} from 'assets/js/common.js';
const {media: mediaTB} = trainingDB;

export class Fn01 {
	abc(){
		console.log('abc');
	}
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
		this.setState({aSubtitle});
	}
	keyDownFn(ev){
		console.log(ev);
		const {key} = ev;
		const oFn = ({
			'w': () => this.curCurLine(-1),
			's': () => this.curCurLine(1),
			'e': () => this.toPlay(),
		});
		if (!oFn[key]) return;
		oFn[key]();
		// console.log("当前行", curLine);
	}
	// ▼设定当前行
	curCurLine(iDirection){
		const {aSubtitle: {length}, curLine: curLineOld} = this.state;
		const curLine = (()=>{
			const iResult = curLineOld + iDirection;
			if (iResult < 0) return 0;
			if (iResult > length-1) return length-1;
			return iResult;
		})();
		this.setState({curLine});
	}
	
	toPlay(idx){
		clearInterval(this.state.timer);
		const {aSubtitle, curLine} = this.state;
		idx = idx || curLine;
		const {start, end} = aSubtitle[idx];
		const oCurrent =  this.oAudio.current;
		oCurrent.currentTime = start;
		oCurrent.play();
		const newTimer = setInterval(() => {
			const { currentTime: cTime } = oCurrent;
			if (cTime < end) return;
			oCurrent.pause();
			clearInterval(this.state.timer);
		}, 1000 / 70); //每秒执行次数70
		this.setState({curLine: idx, timer: newTimer});
	}
}
