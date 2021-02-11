/*
 * @Author: 李星阳
 * @LastEditors: 李星阳
 * @Description: 
 */
import {downloadString, fileToStrings} from 'assets/js/pure-fn.js';

export default class {
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
};


/*
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
			start,
			end,
			long: (end - start).toFixed(2) * 1,
			text: aLine[idx].trim(),
		};
	});
}
*/
