/*
 * @Author: 李星阳
 * @LastEditors: 李星阳
 * @Description: 
 */ 

export default class{
	async startDb(){
		const myDb = window.myDb = new window.Dexie("myDb");
		myDb.version(1).stores({stories: '++id, name'});
		const oStories = myDb.stories;
		// 增
		// oStories.add({name:'张三', note: new Date()*1});
		// 删
		// oStories.delete(1); //删除id是1的数据
		// 改
		// oStories.put({id: 2, name: '新名字'}); //全量更新
		// oStories.update(oForm.id, newVal); //增量更新
		// 查
		let aStories = await oStories.toArray(); //所有表
		this.setState({oStories, aStories});
		// let aAfterAHalf = await oStories.where('id').above(aAllItems.length/2).toArray(); //id大于9
		// let aAim = await oStories.where('id').equals(99).toArray();
	}
	async toUpdata(){
		const aStories = await this.state.oStories.toArray(); //所有表
		this.setState({aStories});
	}
	toDel(id){
		this.state.oStories.delete(id);
		this.toUpdata();
	}
	// ▼提交表单
	onSave(oForm) {
		const {oStories} = this.state;
		const sTime = new Date().format("yyyy-MM-dd hh:mm:ss");
		oForm.modifyData = sTime;
		if (oForm.id) {
			oStories.update(oForm.id, oForm);
		}else{
			delete oForm.id;
			oForm.createDate = sTime;
			oForm.tracks = [];
			oStories.add(oForm);
		}
		this.toUpdata();
		this.setState({visible: false});
	}
	// ▼开窗口
	async showModal(oFormData){
		this.setState({visible: true});
		await new Promise(fn => setTimeout(fn, 100));
		let oForm = this.oForm.current;
		if (!oForm) return;
		if (oFormData) oForm.setFieldsValue(oFormData);
		else oForm.resetFields();
	};
	setMyDb(){
		// const {oStories, aStories} = this.state;
		// oStories.put({id: 2, name: '新名字'}); //note键会丢失
	}
	goTool(oStory, iTrackIdx){
		// console.log(oStory, iTrackIdx);
		const sPath = `/practicing?id=${oStory.id}&idx=${iTrackIdx}`;
		this.props.history.push(sPath);
	}
}


