/*
 * @Author: 李星阳
 * @LastEditors: 李星阳
 * @Description: 
 */ 

export default class{
	async init(){
		const myDb = window.myDb = new window.Dexie("myDb");
		myDb.version(1).stores({stories: '++id, name'});
		myDb.version(2).stores({sections: '++id, idx, parent'});
		const oStoryTB = myDb.stories; // tb = table
		const oSectionTB = myDb.sections;
		const aStories = await oStoryTB.toArray(); //所有故事
		this.setState({oSectionTB, oStoryTB, aStories});
		// 增
		// oStoryTB.add({name:'张三', note: new Date()*1});
		// 删
		// oStoryTB.delete(1); //删除id是1的数据
		// 改
		// oStoryTB.put({id: 2, name: '新名字'}); //全量更新
		// oStoryTB.update(oForm.id, newVal); //增量更新
		// 查
		// let aAfterAHalf = await oStoryTB.where('id').above(aAllItems.length/2).toArray(); //id大于9
		// let aAim = await oStoryTB.where('id').equals(99).toArray();
	}
	async init02(){
		const {aStories, oSectionTB} = this.state;
	 	const arr = aStories.map(async cur=>{
			let aSections = await oSectionTB.where('parent').equals(cur.id).toArray();
			if (!aSections) return;
			cur.aSections = aSections;
		});
		await Promise.all(arr);
		this.setState({aStories});
	}
	async toUpdata(){
		const aStories = await this.state.oStoryTB.toArray(); //所有表
		this.setState({aStories});
	}
	toDel(id){
		this.state.oStoryTB.delete(id);
		this.toUpdata();
	}
	// ▼提交表单
	onSave(oForm) {
		const {oStoryTB} = this.state;
		const sTime = new Date().format("yyyy-MM-dd hh:mm:ss");
		oForm.modifyData = sTime;
		if (oForm.id) {
			oStoryTB.update(oForm.id, oForm);
		}else{
			delete oForm.id;
			oForm.createDate = sTime;
			oForm.tracks = [];
			oStoryTB.add(oForm);
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
		
	}
	goTool(oStory, iTrackIdx){
		// console.log(oStory, iTrackIdx);
		const sPath = `/practicing?id=${oStory.id}&idx=${iTrackIdx}`;
		this.props.history.push(sPath);
	}
}


