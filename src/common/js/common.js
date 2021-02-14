/*
 * @Author: 李星阳
 * @Date: 2021-02-14 15:52:51
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-02-14 20:11:23
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
	console.log('wordsDB ▲▲:\n', new Date().toLocaleString());
	const oResult = new window.Dexie("wordsDB");
	aAlphabet.forEach((cur, idx)=>{
		oResult.version(idx+1).stores({[cur]: '++id, word'});
	});
	return oResult;
})();

export function mix(...mixins) {
	class Mix {
		constructor() {
			for (let mixin of mixins) {
				copyProperties(this, new mixin()); // 拷贝实例属性
			}
		}
	}
	for (let mixin of mixins) {
		copyProperties(Mix, mixin); // 拷贝静态属性
		copyProperties(Mix.prototype, mixin.prototype); // 拷贝原型属性
	}
	return Mix;
}

function copyProperties(target, source) {
	for (let key of Reflect.ownKeys(source)) {
		if (key !== 'constructor' && key !== 'prototype' && key !== 'name' ) {
			let desc = Object.getOwnPropertyDescriptor(source, key);
			Object.defineProperty(target, key, desc);
		}
	}
}