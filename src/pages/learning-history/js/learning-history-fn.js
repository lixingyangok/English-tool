/*
 * @Author: 李星阳
 * @LastEditors: 李星阳
 * @Description: 
 */ 
import {message} from 'antd';

export default class{
	message= message;
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
	// ▼查询故事下的章节
	async getSctToStory(iStoryId){
		const {aStories, oSectionTB} = this.state;
	 	const arr = aStories.map(async (cur)=>{ //遍历每个故事
			if (typeof iStoryId === 'number' && cur.id !== iStoryId) return; //不是我的目标，不操作
			cur.aSections = []; //清空，以重新插入
			const aSections = oSectionTB.where('parent').equals(cur.id); //查询故事包含的章节
			await aSections.each(oSct => cur.aSections.push(oSct));
		});
		await Promise.all(arr);
		this.setState({aStories});
	}
	async toUpdata(){
		const aStories = await this.state.oStoryTB.toArray(); //所有表
		this.setState({aStories});
	}
	async toDel(id){
		const {oSectionTB, oStoryTB} = this.state;
		await oSectionTB.where('parent').equals(id).delete();
		await oStoryTB.delete(id);
		await this.init();
		this.getSctToStory();
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
			oForm.aWords = [];
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
	goTool(oStory, oSct){
		if (oSct.isLoading) return this.message.info('请等待初始化完成');
		// ▼没字幕也能跳转，从头开始听写
		// if (!oSct.aLines.length) return this.message.info('请导入字幕文件'); 
		const sPath = `/practicing?storyId=${oStory.id}&sctId=${oSct.id}`;
		this.props.history.push(sPath);
	}
}


