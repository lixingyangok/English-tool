/*
 * @Author: 李星阳
 * @LastEditors: 李星阳
 * @Description: 
 */
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
		const audioFile = aFiles.find(({ type }) => {
			return ['audio/mpeg', 'video/mp4'].includes(type);
		});
		console.log(audioFile);
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
		const id = await this.state.oSectionTB.add(oSection);
		await this.getSctToStory(oStory.id);
		audioFile && this.getSectionBuffer({...oSection, id});
		message.success('保存完成');
	}
	// ▼【更新】章节
	async upDateSection(oSct, aFiles) {
		const [audioFile, srtFile] = aFiles;
		const aLines = srtFile ? await fileToTimeLines(srtFile) : oSct.aLines;
		if (audioFile) message.success('查询到媒体文件，正在保存');
		const oSection = {
			aLines,
			srtFile: srtFile || oSct.srtFile,
			audioFile: audioFile || oSct.audioFile,
		};
		await this.state.oSectionTB.update(oSct.id, oSection);
		await this.getSctToStory(oSct.parent);
		audioFile && this.getSectionBuffer(oSct);
		message.success('保存完成，正在解析波形数据');
	}
	// 给章节添加buffer
	// 参数：故事，章节所在索引，章节对象
	async getSectionBuffer(oSct){
		const getStories = (isLoading, buffer) => this.state.aStories.map(cur=>{
			if (cur.id === oSct.parent)  Object.assign(
				cur.aSections.find(item=>item.id === oSct.id),
				{isLoading, buffer},
			);
			return cur;
		});
		this.setState({aStories: getStories(true, {})});
		const buffer = await fileToBuffer(oSct.audioFile, true);
		this.setState({aStories: getStories(false, buffer)});
		this.state.oSectionTB.update(oSct.id, {buffer});
		message.success('波形数据解析完成');
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

