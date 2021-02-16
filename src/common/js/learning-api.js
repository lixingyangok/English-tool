/*
 * @Author: 李星阳
 * @Date: 2021-02-03 19:53:23
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-02-16 11:44:39
 * @Description: 
 */

import {downloadSrt} from 'assets/js/pure-fn.js';
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
		const size02 = ((cur.subtitleFileSize || 0) / 1024 / 1024).toFixed(2) + 'kb';
		cur.fileSize_ = size01;
		cur.fisubtitleFileSize_ = size02;
		cur.name_ = cur.fileName.replace(/\.[^.]+$/, '');
	});
	return data;
}

// ▼查询一个媒体文件信息
export async function getOneMedia(mediaId){
	const {data} = await axios.get('/media/one-media/', {
		params: {mediaId},
	});
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

// ▼下载字幕
export async function getSubtitle(oMedia, downLoad=false){
	// console.log("下载", oMedia);
	const {subtitleFileId, name_} = oMedia;
	const qiNiuUrl = `http://qn.hahaxuexi.com/${subtitleFileId}`;
	const {data} = await axios.get(qiNiuUrl,
		{params: {ts: new Date() * 1}},
	);
	if (!data) return;
	downLoad && downloadSrt(data, name_);
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
		return false;
	}
	const oTime = new Date(headers.date);
	return [data.token, oTime];
}