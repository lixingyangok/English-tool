/*
 * @Author: 李星阳
 * @LastEditors: 李星阳
 * @Description: 
 */

import {fileToTimeLines, fileToBuffer} from 'assets/js/pure-fn.js';

export default class {
	// ▼拖入文件
	pushFiles(ev) {
		ev.preventDefault();
		ev.stopPropagation();
		console.clear();
		console.log(ev);
		console.log(ev.path); //落点
		console.log(ev.dataTransfer);
		console.log(ev.dataTransfer.files);
		if (ev.type !== 'drop') return;
		// const aFiles = this.getCorrectFile(ev.dataTransfer.files);
		// this.saveFileToDB(oStory, aFiles)
	}
	// ▼input导入文件到某个故事
	toImport(ev, oStory, idx) {
		const { target } = ev;
		if (!target.files.length) return;
		const aFiles = this.getCorrectFile(target.files);
		this.saveFileToDB(oStory, aFiles, idx);
		target.value = '';
	}
	// ▼过滤出正确的文件
	getCorrectFile(oFiles) {
		const aFiles = [...oFiles];
		const audioFile = aFiles.find(({ type }) => type === 'audio/mpeg');
		const srtFile = aFiles.find(({ name }) => name.split('.').pop() === 'srt');
		return [audioFile, srtFile];
	}
	// ▼保存
	saveFileToDB(oStory, aFiles, idx) {
		const [audioFile, srtFile] = aFiles;
		if (!audioFile && !srtFile) return;
		const {oStories} = this.state;
		const {id, tracks=[]} = oStory;
		const hasIdx = typeof idx === 'number';
		const oTarget = hasIdx ? tracks[idx] : {};
		const iAim = hasIdx ? idx : tracks.length;
		tracks[iAim] = {
			audioFile: audioFile || oTarget.audioFile || null,
			srtFile: srtFile || oTarget.srtFile || null,
			aLines: null,
			buffer: null,
		};
		oStories.update(id, {...oStory, tracks});
		this.toUpdata();
	}
	async trackInit(oStory, idx){
		console.log('初始化');
		const {oStories} = this.state;
		const {tracks=[]} = oStory;
		const oTrack = tracks[idx];
		const {audioFile, srtFile, buffer, aLines} = oTrack;
		if (audioFile && !buffer) {
			let obj = await fileToBuffer(audioFile);;
			console.log(obj)
			oTrack.buffer = obj;
		}
		if (srtFile && !aLines) {
			oTrack.aLine = await fileToTimeLines(srtFile);
		}
		// oStories.update(id, oStory);
		console.log('当前故事：',oStory);
		oStories.put(oStory);
		this.toUpdata();
	}
	// ▼以上是字幕部分 ===================================================
	// ▼文件转字符
	fileToStrings(oFile) {
		let resolveFn = xx => xx;
		const oPromise = new Promise(resolve => resolveFn = resolve);
		const reader = Object.assign(new FileReader(), {
			onload: event => resolveFn(event.target.result), // event.target.result就是文件文本内容,
		});
		reader.readAsText(oFile);
		return oPromise;
	}
	// ▼删除某条音轨
	toDelOneTrack(oStory, iTrackIdx){
		oStory.tracks.splice(iTrackIdx, 1);
		this.state.oStories.update(oStory.id, oStory);
		this.toUpdata();
	}
	// ▼导出文件
	toExport() {
		const { aLines } = this.getCurStep();
		const aStr = aLines.map(({ start_, end_, text }, idx) => {
			return `${idx + 1}\n${start_} --> ${end_}\n${text}\n`;
		}).join('\n');
		const blob = new Blob([aStr]);
		Object.assign(document.createElement('a'), {
			download: `字幕文件-${new Date() * 1}.srt`,
			href: URL.createObjectURL(blob),
		}).click();
	}

};

