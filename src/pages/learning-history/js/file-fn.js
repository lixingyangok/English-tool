/*
 * @Author: 李星阳
 * @LastEditors: 李星阳
 * @Description: 
 */

import {message} from 'antd';
import {fileToTimeLines, /* fileToBuffer */} from 'assets/js/pure-fn.js';

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
	}
	// ▼input导入文件到某个故事
	// 通过第3个参数判断是新增还是修改
	toImport(ev, oStory, oSct) {
		const { target } = ev;
		if (!target.files.length) return;
		const aFiles = this.getCorrectFile(target.files);
		if (!aFiles.length) return;
		if (oSct) {
			this.upDateSection(oSct, aFiles);
		}else{
			this.saveSection(oStory, aFiles);
		}
		target.value = '';
	}
	// ▼过滤出正确的文件
	getCorrectFile(oFiles) {
		const aFiles = [...oFiles];
		const audioFile = aFiles.find(({ type }) => type === 'audio/mpeg');
		const srtFile = aFiles.find(({ name }) => name.split('.').pop() === 'srt');
		return [audioFile, srtFile];
	}
	// ▼保存章节
	async saveSection(oStory, aFiles) {
		const [audioFile, srtFile] = aFiles;
		const oSection = {
			idx: 0,
			aLines: await fileToTimeLines(srtFile),
			parent: oStory.id,
			srtFile: srtFile || undefined,
			audioFile: audioFile || undefined,
			buffer: undefined,
		};
		this.state.oSectionTB.add(oSection);
		this.init02();
		message.success('保存完成');
	}
	// ▼【更新】章节
	async upDateSection(oSct, aFiles) {
		const [audioFile, srtFile] = aFiles;
		const oSection = {
			aLines: oSct.aLines || await fileToTimeLines(srtFile),
			srtFile: srtFile || oSct.srtFile,
			audioFile: audioFile || oSct.audioFile,
		};
		this.state.oSectionTB.update(oSct.id, oSection);
		this.init02();
		message.success('保存完成');
	}
	
	async trackInit(oStory, idx){
		console.log('初始化', oStory, idx); //停用
		// const {oStoryTB} = this.state;
		// const oTrack = oStory.tracks[idx];
		// const {srtFile, /* buffer, aLines, audioFile */} = oTrack;
		// // if (audioFile) {
		// // 	let obj = await fileToBuffer(audioFile);
		// // 	console.log('拿到了：bufferOBJ', obj)
		// // 	oTrack.buffer = obj;
		// // }
		// if (srtFile) {
		// 	oTrack.aLines = await fileToTimeLines(srtFile);
		// }
		// oStoryTB.update(oStory.id, {tracks: oStory.tracks});
		// this.toUpdata();
		// console.log('成功保存了：', oStory);
	}
	// ▼删除某章节
	toDelSection(oSct){
		this.state.oSectionTB.delete(oSct.id);
		this.init02();
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

