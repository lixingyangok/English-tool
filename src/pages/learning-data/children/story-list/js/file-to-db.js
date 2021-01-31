/*
 * @Author: 李星阳
 * @Date: 2021-01-11 20:24:25
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-01-31 18:50:47
 * @Description: 
 */

export default class {
	async dbInit(){
		const trainingDB = new window.Dexie("trainingDB");
		trainingDB.version(1).stores({story: '++id, ID, name, storyId'});
		trainingDB.version(2).stores({media: '++id, ID, fileId, ownerStoryId'});
		const oStoryTB = trainingDB.story;
		const mediaTB = trainingDB.media;
		this.setState({oStoryTB, mediaTB});
	}
}
