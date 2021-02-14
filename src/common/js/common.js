/*
 * @Author: 李星阳
 * @Date: 2021-02-14 15:52:51
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-02-14 20:09:29
 * @Description: 
 */

// ▼得到字母表 a,b,c.....
export const aAlphabet = [...Array(26).keys()].map(cur=>{
	return String.fromCharCode(97 + cur);
});

export const trainingDB = (()=>{
	console.log('trainingDB ★★:\n', new Date().toLocaleString());
	const oResult = new window.Dexie("trainingDB");
	oResult.version(1).stores({story: '++id, ID, name, storyId'});
	oResult.version(2).stores({media: '++id, ID, fileId, ownerStoryIdoResult'});
	return oResult;
})();

export const wordsDB = (()=>{
	console.log('trainingDB ▲▲:\n', new Date().toLocaleString());
	const oResult = new window.Dexie("wordsDB");
	aAlphabet.forEach((cur, idx)=>{
		oResult.version(idx+1).stores({[cur]: '++id, word'});
	});
	return oResult;
})();