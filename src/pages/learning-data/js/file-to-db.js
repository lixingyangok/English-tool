/*
 * @Author: 李星阳
 * @Date: 2021-01-11 20:24:25
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-01-14 20:22:12
 * @Description: 
 */

export default class {
	async dbInit(){
		const trainingDB = new window.Dexie("trainingDB");
		trainingDB.version(1).stores({story: '++id, ID, name, storyId'});
		trainingDB.version(2).stores({media: '++id, ID, fileId, ownerStoryId'});
		const oStoryTB = trainingDB.story; // TB = table
		const mediaTB = trainingDB.media;
		// oStoryTB.add({name:'张三', note: new Date()*1});
		this.setState({oStoryTB, mediaTB});
	}
	async saveOneMedia(oStory, oneMedia){
		this.saveOneStory(oStory);
		const {mediaTB} = this.state;
		oneMedia.ownerStoryId = oStory.ID;
		const collection  = await mediaTB.where('fileId').equals(oneMedia.fileId);
		const oFirst = await collection.first();
		if (!oFirst) return mediaTB.add(oneMedia);
		mediaTB.put({
			...oFirst, ...oneMedia,
		});
	}
	async saveOneStory(oStory){
		oStory.storyId = oStory.ID;
		const {oStoryTB} = this.state;
		const collection  = await oStoryTB.where('storyId').equals(oStory.ID);
		const oFirst = await collection.first();
		if (!oFirst) return oStoryTB.add(oStory);
		oStoryTB.put({...oFirst, ...oStory});
	}
}
