/*
 * @Author: 李星阳
 * @LastEditors: 李星阳
 * @Description: 
 */

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
		};
		oStories.update(id, {...oStory, tracks});
		this.toUpdata();
	}
	async trackInit(oStory, idx){
		const {oStories} = this.state;
		const {id, tracks=[]} = oStory;
		const oTrack = tracks[idx];
		const {audioFile, srtFile} = oTrack;
		if (audioFile) {
			const buffer = await this.fileToBuffer(audioFile);
			const aChannelData = buffer.getChannelData(0);
			oTrack.buffer = {
				duration: buffer.duration,
				length: buffer.length,
				numberOfChannels: buffer.numberOfChannels,
				sampleRate: buffer.sampleRate,
				aChannelData,
				// getChannelData: ()=>aChannelData,
			}
		}
		if (srtFile) {
			console.log(srtFile);
		}
		// oStories.update(id, oStory);
		oStories.put(oStory);
		this.toUpdata();
	}
	// ▼从文件得到 buffer 数据
	fileToBuffer(oFile) {
		const reader = new FileReader();
		let resolveFn = xx => xx;
		const promise = new Promise(resolve => resolveFn = resolve);
		reader.onload = async evt => {
			const arrayBuffer = evt.currentTarget.result;
			let audioContext = new (window.AudioContext || window.webkitAudioContext)();
			const buffer = await audioContext.decodeAudioData(arrayBuffer);
			resolveFn(buffer);
			audioContext = null; // 如果不销毁audioContext对象的话，audio标签是无法播放的
		};
		reader.readAsArrayBuffer(oFile);
		return promise;
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
	// ▼以上是字幕部分 ===================================================
	// ▼文件转字符，然后保存
	async getSubtitleToSave(oFile, oAudioFile) {
		let aLines = [];
		if (oFile) {
			const sText = await this.fileToStrings(oFile);
			aLines = this.getTimeLine(sText); //字幕
		} else if (oAudioFile) {
			aLines = await window.lf.getItem(oAudioFile.name);
			aLines = aLines || [this.state.oFirstLine];
		}
		const aSteps = [{ iCurLine: 0, aLines }];
		this.setState({ aSteps });
	}
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
	// ▼字符转字幕数据，用于显示
	getTimeLine(text) {
		let strArr = text.split('\n');
		const aLine = [];
		strArr = strArr.filter((cur, idx) => {
			const isTime = /\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}/.test(cur);
			if (!isTime) return false;
			aLine.push(strArr[idx + 1]);
			return isTime;
		});
		return strArr.map((cur, idx) => {
			const [aa, bb] = cur.split(' --> ');
			const [start, end] = [this.getSeconds(aa), this.getSeconds(bb)];
			return {
				start_: aa,
				end_: bb,
				start,
				end,
				long: (end - start).toFixed(2) * 1,
				text: aLine[idx].trim(),
			};
		});
	}
	// ▼删除某条音轨
	toDelOneTrack(oStory, iTrackIdx){
		oStory.tracks.splice(iTrackIdx, 1);
		this.state.oStories.update(oStory.id, oStory);
		this.toUpdata();
	}
};

