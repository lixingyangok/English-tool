/*
 * @Author: 李星阳
 * @Date: 2021-01-31 19:13:46
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-01-31 20:26:36
 * @Description: 
 */
const {axios} = window;

export default class {
	// ▼格式化 search
	getSearchOjb(oLocation){
		const sSearch = oLocation.search;
		if (!sSearch) return {};
		const oResult = sSearch.slice(1).split('&').reduce((result, cur)=>{
			const [key, val] = cur.split('=');
			return {...result, [key]: val};
		}, {});
		return oResult;
	}
	// ▼初始化的方法（查询故事信息并保存）
	async init(storyId){
		const {oStoryTB} = this.state;
		const [{data: oStory}, oStoryFromTB] = await Promise.all([
			axios.get('/story/' + storyId), // 故事信息
			oStoryTB.where('ID').equals(storyId*1).first(), //故事信息【本地】
		]);
		if (!oStory) return; // 查不到故事故事，返回
		console.log('故事信息', oStory);
		this.setState({oStory});
		if (oStoryFromTB) { // 更新本地故事数据
			oStoryTB.put({...oStory, id: oStoryFromTB.id}); //全量更新
		}else{
			oStoryTB.add(oStory);
		}
	}

	// ▼跳到听写
	goToolPage(oMedia){
		const {oStory} = this.state;
		const sPath = `/learning-data/practicing`;
		const query = `?storyId=${oStory.ID}&mediaId=${oMedia.ID}`;
		this.props.history.push(sPath + query);
	}
}
