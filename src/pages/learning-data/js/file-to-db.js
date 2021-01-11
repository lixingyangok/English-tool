/*
 * @Author: 李星阳
 * @Date: 2021-01-11 20:24:25
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-01-11 20:54:57
 * @Description: 
 */

export default class {
	async dbInit(){
		const storyDB = window.storyDB = new window.Dexie("storyDB");
		storyDB.version(1).stores({stories: '++id, name'});
		storyDB.version(2).stores({medias: '++id, owner'});
		const oStoryTB = storyDB.stories; // TB = table
		const mediasTB = storyDB.medias;
		// oStoryTB.add({name:'张三', note: new Date()*1});
		this.setState({oStoryTB, mediasTB});
	}
	saveOneMedia(oStory, oneMedia, mediaFile){
		console.log('收到媒体信息', oneMedia);
		const {mediasTB} = this.state;
		mediasTB.add({
			...oneMedia,
			mediaFile,
		});
	}
}
