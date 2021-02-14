/*
 * @Author: 李星阳
 * @Date: 2021-02-14 15:52:51
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-02-14 17:56:12
 * @Description: 
 */

export const trainingDB = (()=>{
	console.log('返回trainingDB:\n', new Date().toLocaleString());
	const oResult = new window.Dexie("trainingDB");
	oResult.version(1).stores({story: '++id, ID, name, storyId'});
	oResult.version(2).stores({media: '++id, ID, fileId, ownerStoryIdoResult'});
	return oResult;
})();

