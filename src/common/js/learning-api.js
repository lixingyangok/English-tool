/*
 * @Author: 李星阳
 * @Date: 2021-02-03 19:53:23
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-02-04 20:57:23
 * @Description: 
 */

const {axios} = window;

// ▼查询一个故事信息
export async function getStoryInfo(storyId){
	const res = await axios.get('/story/story-info', {
		params: {storyId},
	}); // 故事信息
	return res;
}

// ▼修改故事的词汇
export async function setWrods(storyId, aWords){
	const res = await axios.put('/story/set-words', {
		storyId,
		words: aWords.join(','),
	});
	return res;
}

// ▼查询某个故事下的文件列表
export async function getMediaByStoryId(storyId){ 
	const {data} = await axios.get('/media/media-list', {
		params: {storyId},
	});
	return data;
}