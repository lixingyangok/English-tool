/*
 * @Author: 李星阳
 * @LastEditors: 李星阳
 * @Description: 
 */
import {downloadString, fileToStrings} from 'assets/js/pure-fn.js';


export default class {
	// ▼拖入文件
	pushFiles(ev) {
		ev.preventDefault();
		ev.stopPropagation();
		console.clear();
		console.log(ev);
		console.log(ev.dataTransfer);
		console.log(ev.dataTransfer.files);
		if (ev.type !== 'drop') return;
		this.getCorrectFile(ev.dataTransfer.files);
	}
	// ▼input导入文件
	toImport(ev) {
		const {target} = ev;
		if (!target.files.length) return;
		this.getCorrectFile(target.files);
		console.log(target.value);
		target.value = '';
	}
	// ▼过滤出正确的文件
	async getCorrectFile(oFiles){
		const aFiles = [...oFiles];
		const audioFile = aFiles.find(cur => {
			const aArr = ["audio/mpeg"];
			return aArr.includes(cur.type);
		});
		audioFile && this.getFileToDraw(audioFile);
		// ▲音频，▼字幕
		const srtFile = aFiles.find(cur => cur.name.split('.').pop() === 'srt');
		this.getSubtitleToSave(srtFile, audioFile);
	}
	// ▼绘制波形
	async getFileToDraw(audioFile){
		console.log('文件', audioFile);
		this.cleanCanvas();
		this.setState({loading: true});
		const fileName = audioFile.name;
		const fileSrc = URL.createObjectURL(audioFile);
		const buffer = await this.fileToBuffer(audioFile);
		this.setState({loading: false});
		const oBackData = this.getPeaks( 
			buffer, this.state.iPerSecPx, 0,
			this.oWaveWrap.current.offsetWidth,
		);
		this.toDraw(oBackData.aPeaks);
		this.setState({fileName, fileSrc, buffer, ...oBackData});
	}
	// buffer.sampleRate  // 采样率：浮点数，单位为 sample/s
	// buffer.length  // 采样帧率：整形
	// buffer.duration  // 时长(秒)：双精度型
	// buffer.numberOfChannels  // 通道数：整形
	// ▼计算波峰波谷（纯函数）
	getPeaks(buffer, iPerSecPx, left=0, iCanvasWidth=500) {
		console.time('getPeaks 耗时');
		const aChannel = buffer.aChannelData_ || buffer.getChannelData(0);
		const sampleSize = ~~(buffer.sampleRate / iPerSecPx); // 每一份的点数 = 每秒采样率 / 每秒像素
		const aPeaks = [];
		let idx = ~~left;
		const last = idx + iCanvasWidth;
		while (idx <= last) {
			let start = idx * sampleSize;
			const end = start + sampleSize;
			let min = 0;
			let max = 0;
			while (start < end) {
				const value = aChannel[start];
				if (value > max) max = value;
				else if (value < min) min = value;
				start++;
			}
			aPeaks.push(max, min);
			idx++;
		}
		const fPerSecPx = buffer.length / sampleSize / buffer.duration;
		console.timeEnd('getPeaks 耗时');
		return {aPeaks, fPerSecPx};
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
	async toExport() {
		const {aLines} = this.getCurStep();
		const aStr = aLines.map(({start_, end_, text}, idx) => {
			return `${idx + 1}\n${start_} --> ${end_}\n${text}\n`;
		});
		const {oTarget:{sctId}, oSectionTB} = this.state;
		const res = await oSectionTB.get(sctId*1);
		downloadString(aStr.join('\n'), res.audioFile.name, 'srt');
	}
	// ▼导入词汇
	async beforeUpload(file){
		let {oTarget:{storyId}, oStoryTB} = this.state;
		storyId*=1;
		const res = await fileToStrings(file);
		const aWords = res.split(/\s+/).filter(Boolean).sort();
		const {aWords: aWordsOld} = await oStoryTB.get(storyId);
		const onOk = () => {
			oStoryTB.update(storyId, {aWords});
			this.setState({aWords});
		}
		const onCancel = () => {
			aWords.push(...aWordsOld);
			oStoryTB.update(storyId, {aWords: [...new Set(aWords)].sort()});
			this.setState({aWords});
		};
		this.confirm({
			title: '请选择导入形式', 
			content: `正在导入 ${aWords.length} 个单词，追加到当前词库还是覆盖？`,
			okText: '覆盖', cancelText: '追加',
			onOk, onCancel,
		});
		return Promise.reject();
	}
	// ▼ 导出词汇
	async exportWods(){
		const {oTarget:{storyId}, oStoryTB} = this.state;
		const {name, aWords} = await oStoryTB.get(storyId*1);
		downloadString(aWords.join('\n'), `${name}-词汇文件`, 'txt');
	}
	// ▼以上是字幕部分 ===================================================
	// ▼文件转字符，然后保存
	async getSubtitleToSave(oFile, oAudioFile){
		let aLines = [];
		if (oFile){
			const sText = await fileToStrings(oFile);
			aLines = this.getTimeLine(sText); //字幕
		}else if(oAudioFile){
			aLines = await window.lf.getItem(oAudioFile.name);
			aLines = aLines || [this.state.oFirstLine];
		}
		const aSteps = [{iCurLine: 0, aLines}];
		this.setState({aSteps});
	}
	// ▼字符转字幕数据，用于显示，疑似废弃
	getTimeLine(text) {
		let strArr = text.split('\n');
		const aLine = [];
		strArr = strArr.filter((cur, idx) => {
			const isTime = /\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}/.test(cur);
			if (!isTime) return false;
			aLine.push(strArr[idx+1]);
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
};

