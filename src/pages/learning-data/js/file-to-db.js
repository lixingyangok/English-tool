/*
 * @Author: 李星阳
 * @Date: 2021-01-11 20:24:25
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-01-12 19:49:17
 * @Description: 
 */

export default class {
	async dbInit(){
		const storyDB = window.storyDB = new window.Dexie("storyDB");
		storyDB.version(1).stores({stories: '++id, name, storyId'});
		storyDB.version(2).stores({medias: '++id, fileId, ownerStoryId'});
		const oStoryTB = storyDB.stories; // TB = table
		const mediasTB = storyDB.medias;
		// oStoryTB.add({name:'张三', note: new Date()*1});
		this.setState({oStoryTB, mediasTB});
	}
	async saveOneMedia(oStory, oneMedia){
		this.saveOneStory(oStory);
		const {mediasTB} = this.state;
		oneMedia.ownerStoryId = oStory.ID;
		const collection  = await mediasTB.where('fileId').equals(oneMedia.fileId);
		const oFirst = await collection.first();
		if (!oFirst) return mediasTB.add(oneMedia);
		mediasTB.put({
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
