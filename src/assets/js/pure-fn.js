/*
 * @Author: 李星阳
 * @LastEditors: 李星阳
 * @Description: 
 */ 

import { message } from 'antd';

// ▼字符转字幕数据，用于显示
export async function fileToTimeLines(oFile) {
	if (!oFile) return [];
	const text = await fileToStrings(oFile);
	const aLine = [];
	let strArr = text.split('\n');
	strArr = text.split('\n').filter((cur, idx) => {
		const isTime = /\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}/.test(cur);
		if (!isTime) return false;
		aLine.push(strArr[idx + 1]);
		return isTime;
	});
	return strArr.map((cur, idx) => {
		const [aa, bb] = cur.split(' --> ');
		const [start, end] = [getSeconds(aa), getSeconds(bb)];
		const text = aLine[idx].trim();
		return fixTime({start, end, text});
	});
}

export async function fileToBuffer(oFile, isWantFakeBuffer=false){
	if (!oFile) return {};
	let resolveFn = xx => xx;
	const promise = new Promise(resolve => resolveFn = resolve);
	const onload = async evt => {
		const arrayBuffer = evt.currentTarget.result;
		let audioContext = new (window.AudioContext || window.webkitAudioContext)();
		let buffer = await audioContext.decodeAudioData(arrayBuffer).catch(err=>{
			console.log('读取波形 buffer 出错\n', err);
		});
		audioContext = null; // 如果不销毁audioContext对象的话，audio标签是无法播放的
		if (isWantFakeBuffer) buffer = getFaleBuffer(buffer);
		resolveFn(buffer);
	};
	Object.assign(new FileReader(), {
		onload,
	}).readAsArrayBuffer(oFile);
	return promise;
}

// ▼浮点秒，转为时间轴的时间
function secToStr(fSecond){
	const iHour = Math.floor(fSecond / 3600) + ''; //时
	const iMinut = Math.floor((fSecond - iHour * 3600) / 60) + ''; //分
	const fSec = fSecond - (iHour*3600 + iMinut*60) + ''; //秒
	const [sec01, sec02='000'] = fSec.split('.');
	const sTime = `${iHour.padStart(2, 0)}:${iMinut.padStart(2, 0)}:${sec01.padStart(2, 0)}`;
	const sTail = `,${sec02.slice(0, 3).padEnd(3, 0)}`;
	return sTime + sTail;
}

// ▼时间轴的时间转秒
export function getSeconds(text) {
	const [hour, minute, second, tail] = text.match(/\d+/g);
	const number = (hour * 60 * 60) + (minute * 60) + `${second}.${tail}` * 1;
	return number.toFixed(2) * 1; // 保留2位小数足矣
};

// ▼修整某一行
export function fixTime(oTarget){
	const {start, end, text} = oTarget;
	oTarget.long = (end - start).toFixed(2) * 1;
	oTarget.text = text || '';
	return oTarget;
}

// ▼【文件】转字符
export function fileToStrings(oFile) {
	let resolveFn = xx => xx;
	const oPromise = new Promise(resolve => resolveFn = resolve);
	Object.assign(new FileReader(), {
		onload: event => resolveFn(event.target.result), // event.target.result就是文件文本内容,
	}).readAsText(oFile);
	return oPromise;
}

export function getFaleBuffer(buffer){
	const buffer_ = { //原始数据
		duration: buffer.duration,
		length: buffer.length, // === buffer.getChannelData(0).length
		sampleRate: buffer.sampleRate,
		numberOfChannels: buffer.numberOfChannels,
	}
	return { //补充数据
		...buffer_,
		aChannelData_: [],
		sDuration_: secToStr(buffer.duration).split(',')[0],
		oChannelDataBlob_: (()=>{
			console.time('转：Blob');
			const aChannelData = Int8Array.from( // int8的取值范围 -128 到 127
				buffer.getChannelData(0).map(xx => xx * (xx > 0 ? 127 : 128)),
			);
			const result = new Blob([aChannelData], {type: 'text/plain'});
			console.timeEnd('转：Blob');
			return result;
		})(),
	};
}

export async function getChannelDataFromBlob(oBlob){
	const arrayBuffer = await oBlob.arrayBuffer();
	const aInt8Array = new Int8Array(arrayBuffer);
	return aInt8Array;
}

// ▼将收到的数组转换为【文本文件】并下载
// 将来下载文本时会用到
export function downloadString(aStr, fileName='文本文件', suffix='txt'){
	const blob = new Blob([aStr]);
	Object.assign(document.createElement('a'), {
		download: `${fileName}.${suffix}`,
		href: URL.createObjectURL(blob),
	}).click();
}

// ▼有后台功能之后的新方法---------------------------

// ▼将收到的数组转换为【字幕文件】并下载
export function downloadSrt(aLines, fileName='字幕文件'){
	const aStr = aLines.map(({start, end, text}, idx) => {
		const [t01, t02] = [secToStr(start), secToStr(end)];
		return `${idx + 1}\n${t01} --> ${t02}\n${text}\n`;
	}).join('\n');
	downloadString(aStr, fileName, 'srt');
}

// ▼可能是上传字幕用的
export async function fileToBlobForUpload(oFile){
	const res = await fileToTimeLines(oFile);
	const oBlob = new Blob(
		[JSON.stringify(res || [])],
		{type: 'application/json;charset=utf-8'}, //
	);
	return oBlob;
}

// ▼得到时间信息
export function getTimeInfo(oTime, sType, oAim){
	if (sType !=='f' && sType!=='s') return {};
	const [key1, key2] = ({
		f: ['fileModifyStr', 'fileModifyTs'],
		s: ['subtitleFileModifyStr', 'subtitleFileModifyTs'],
	}[sType]);
	const oResult = {
		[key1]: oTime.toString(),
		[key2]: oTime.getTime(),
	};
	if (oAim) Object.assign(oAim, oResult)
	return oResult;
}

// ▼查询七牛token
export async function getQiniuToken(keyToOverwrite=''){
	const sUrl = '/qiniu/gettoken';
	const {data, headers} = await window.axios.get(sUrl, {
		params: {keyToOverwrite},
	});
	if (!data || !data.token) {
		message.error('查询token未成功');
		return false;
	}
	const oTime = new Date(headers.date);
	return [data.token, oTime];
}

export function getFakeBuffer(buffer){
	const buffer_ = { // ★原始数据
		duration: buffer.duration,
		length: buffer.length, // === buffer.getChannelData(0).length
		sampleRate: buffer.sampleRate,
		numberOfChannels: buffer.numberOfChannels,
	}
	return { // ★补充数据
		...buffer_,
		aChannelData_: Int8Array.from( // int8的取值范围 -128 到 127
			buffer.getChannelData(0).map(xx => xx * (xx > 0 ? 127 : 128)),
		),
		sDuration_: secToStr(buffer.duration).split(',')[0],
		oChannelDataBlob_: null,
	};
}

// ▼下载字幕
export async function getSubtitle(oMedia, downLoad=false){
	console.log("下载", oMedia);
	const {subtitleFileId, fileName} = oMedia;
	const qiNiuUrl = `http://qn.hahaxuexi.com/${subtitleFileId}`;
	const {data} = await window.axios.get(qiNiuUrl,
		{params: {ts: new Date() * 1}},
	);
	if (!data) return;
	downLoad && downloadSrt(data, fileName);
	return data;
}

