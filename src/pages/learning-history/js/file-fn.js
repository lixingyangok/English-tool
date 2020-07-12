/*
 * @Author: 李星阳
 * @LastEditors: 李星阳
 * @Description: 
 */

//  Sct = section = 章节

import {message} from 'antd';
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
		this.getSctToStory(oStory.id);
		message.success('保存完成');
	}
	// ▼【更新】章节
	async upDateSection(oSct, aFiles) {
		const [audioFile, srtFile] = aFiles;
		const aLines = srtFile ? await fileToTimeLines(srtFile) : oSct.aLines;
		const oSection = {
			aLines,
			srtFile: srtFile || oSct.srtFile,
			audioFile: audioFile || oSct.audioFile,
		};
		this.state.oSectionTB.update(oSct.id, oSection);
		this.getSctToStory();
		message.success('保存完成');
	}
	// 给章节添加buffer
	// 参数：故事，章节所在索引，章节对象
	async getSectionBuffer(oStory, idx, oSct){
		this.setState({
			aStories: this.state.aStories.map(cur=>{
				if (cur.id === oStory.id) Object.assign(
					cur.aSections[idx], {isLoading: true, buffer: {}},
				);
				return cur;
			}),
		});
		const buffer = await fileToBuffer(oSct.audioFile, true);
		this.setState({
			aStories: this.state.aStories.map(cur=>{
				if (cur.id === oStory.id) Object.assign(
					cur.aSections[idx], {isLoading: false, buffer},
				);
				return cur;
			}),
		});
		this.state.oSectionTB.update(oSct.id, {...oSct, buffer});
	}
	// ▼删除某章节
	toDelSection(oSct){
		this.state.oSectionTB.delete(oSct.id);
		this.getSctToStory();
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

