/*
 * @Author: 李星阳
 * @Date: 2021-02-03 19:53:23
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-02-16 17:48:14
 * @Description: 
 */

import {downloadSrt, fixTime} from './pure-fn.js';
import {message} from 'antd';
const {axios} = window;

// ▼查询一个故事信息
export async function getStoryInfo(storyId){
	const res = await axios.get('/story/story-info', {
		params: {storyId},
	}); // 故事信息
	return res;
}

// ▼查询某个故事下的文件列表
export async function getMediaByStoryId(storyId){ 
	const {data} = await axios.get('/media/media-list', {
		params: {storyId},
	});
	if (!data) return;
	data.forEach(cur=>{
		// TODO 如果有第二个 \ 会报错：/\.[\^.]+$/ 
		const size01 = (cur.fileSize / 1024 / 1024).toFixed(2) + 'mb';
		const size02 = (cur.subtitleFileSize || 0) / 1024 / 1024;
		cur.fileSize_ = size01;
		cur.fisubtitleFileSize_ = `${(size02 > 1) ? size02.toFixed(2) : '<1'}kb`;
		cur.name_ = cur.fileName.replace(/\.[^.]+$/, '');
	});
	return data;
}

// ▼查询一个媒体文件信息
export async function getOneMedia(mediaId){
	const {data} = await axios.get('/media/one-media/', {
		params: {mediaId},
	});
	if (!data) return;
	data.name_ = data.fileName.replace(/\.[^.]+$/, '');
	return data;
}

// ▼修改故事的【词汇】
export async function setWrods(storyId, key, aWords){
	const res = await axios.put('/story/set-words', {
		storyId,
		key,
		words: aWords.join(','),
	});
	return res;
}

// ▼查询字幕
export async function getSubtitle(oMedia, downLoad=false){
	const {subtitleFileId, name_} = oMedia;
	const qiNiuUrl = `http://qn.hahaxuexi.com/${subtitleFileId}`;
	const {data} = await axios.get(qiNiuUrl,
		{params: {ts: new Date() * 1}},
	);
	if (!data) return;
	// ▼下载
	downLoad && downloadSrt(data, name_);
	data.forEach(cur=>fixTime(cur)); //补充长度信息
	return data;
}

// ▼查询七牛token
export async function getQiniuToken(keyToOverwrite=''){
	const sUrl = '/qiniu/gettoken';
	const {data, headers} = await axios.get(sUrl, {
		params: {keyToOverwrite},
	});
	if (!data || !data.token) {
		message.error('查询token未成功');
		return [];
	}
	const oTime = new Date(headers.date);
	return [data.token, oTime];
}

// ▼上传字幕到七牛（暂时停用）
// export async function uploadSubtitle(oParams){
// 	const sUrl = 'http://upload-z2.qiniup.com';
// 	const {token, aSubtitle=[]} = oParams;
// 	let oTime = {};
// 	oParams.token = await (async ()=>{
// 		if (token) return token;
// 		const [sResult, oTime_] = await getQiniuToken();
// 		oTime = oTime_;
// 		return sResult;
// 	})();
// 	if (!oParams.token) return;
// 	oParams.file = (()=>{
// 		aSubtitle.forEach(cur => delete cur.long);
// 		const myBlob = new Blob(
// 			[JSON.stringify(aSubtitle)],
// 			{type: 'application/json;charset=utf-8'},
// 		);
// 		return myBlob;
// 	})();
// 	delete oParams.aSubtitle;
// 	const {data} = await axios.post(sUrl, oParams);
// 	return [data, oParams.file, oTime];
// }
