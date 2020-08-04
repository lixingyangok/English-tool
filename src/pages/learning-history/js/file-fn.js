/*
 * @Author: 李星阳
 * @LastEditors: 李星阳
 * @Description: 
 */
import {fileToTimeLines, fileToBuffer, getFaleBuffer} from 'assets/js/pure-fn.js';

export default class {
	// ▼input导入文件到某个故事（通过第3个参数判断是新增还是修改
	toImport(ev, oStory, oSct) {
		const { target } = ev;
		if (!target.files.length) return;
		const aFiles = this.getCorrectFile(target.files);
		if (!aFiles.find(Boolean)) return this.message.error('没有合适的文件');
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
		const srtFile = aFiles.find(({ name }) => name.split('.').pop() === 'srt');
		console.log('媒体文件：', audioFile);
		return [audioFile, srtFile];
	}
	// ▼保存章节
	async saveSection(oStory, aFiles) {
		const [audioFile, srtFile] = aFiles;
		if (audioFile) this.message.success('检测到媒体文件，正在保存');
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
		this.message.success('媒体文件保存完成' + (audioFile ? '，正在解析波形数据' : '')); //放在最后
	}
	// ▼【更新】章节
	async upDateSection(oSct, aFiles) {
		const [audioFile, srtFile] = aFiles;
		const aLines = srtFile ? await fileToTimeLines(srtFile) : oSct.aLines;
		const {srtFile: srtFileOld, audioFile: audioFileOld} = oSct;
		if (audioFile) {
			this.message.success('检测到媒体文件，正在保存');
			this.setState({ //用于更新视图把旧文件清除掉
				aStories: this.state.aStories.map(cur=>{
					if(cur.id !== oSct.parent) return cur;
					const oTarget = cur.aSections.find(item => item.id === oSct.id);
					oTarget.audioFile = audioFile;
					oTarget.buffer = undefined;
					return cur;
				}),
			});
		}
		const oSection = {
			aLines,
			srtFile: srtFile || srtFileOld,
			audioFile: audioFile || audioFileOld,
		};
		await this.state.oSectionTB.update(oSct.id, oSection);
		await this.getSctToStory(oSct.parent);
		audioFile && this.getSectionBuffer(oSct);
		this.message.success('媒体文件保存完成' + (audioFile ? '，正在解析波形数据' : '')); //放在最后
	}
	// 给章节添加buffer
	async getSectionBuffer(oSct){
		if (!oSct.audioFile) return this.message.error('没有音频文件，无法初始化');
		const getStories = (isLoading, buffer) => this.state.aStories.map(cur=>{
			if (cur.id === oSct.parent)  Object.assign(
				cur.aSections.find(item=>item.id === oSct.id),
				{isLoading, buffer},
			);
			return cur;
		});
		this.setState({aStories: getStories(true, {})});
		let buffer = await fileToBuffer(oSct.audioFile);
		this.message.success('解析完成，正在保存波形数据');
		await new Promise(resolve=>setTimeout(resolve, 700));
		buffer = getFaleBuffer(buffer);
		this.setState({aStories: getStories(false, buffer)});
		await this.state.oSectionTB.update(oSct.id, {buffer});
		this.message.success('波形数据保存完成');
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

