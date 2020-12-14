/*
 * @Author: 李星阳
 * @LastEditors: 李星阳
 * @Description: 
 */ 

import React from 'react';
import {Button} from 'antd';

export default class{
	// ▼初始化，即查询【故事数据】
	async init(){
		const res = await window.axios.get('/story');
		if (!res) return;
		// console.log('res', res);
		this.setState({ aStory: res });
		// const myDb = window.myDb = new window.Dexie("myDb");
		// myDb.version(1).stores({stories: '++id, name'});
		// myDb.version(2).stores({sections: '++id, idx, parent'});
		// const oStoryTB = myDb.stories; // TB = table
		// const oSectionTB = myDb.sections;
		// const aStories = await oStoryTB.toArray(); //查询所有故事
		// this.setState({oStoryTB, oSectionTB, aStories});
	}
	// ▼提交表单
	async onSave(oForm) {
		Object.entries(oForm).forEach(([key, val]) => {
			if (val === undefined) oForm[key] = '';
		});
		// console.log('表单', oForm);
		if (!oForm.storyName) return;
		const method = oForm.ID ? 'put' : 'post';
		const res = await window.axios[method]('/story', oForm);
		if (!res) return;
		this.setState({visible: false});
		this.init();
	}
	
	// ▼删除一条
	async delOneStory(thisOne) {
		const res = await window.axios.delete('/story/' + thisOne.ID);
		if (!res) return;
		this.init();
	}

	// ▼开窗口（新建/修改）
	async showModal(oFormData){
		this.setState({visible: true});
		await new Promise(fn => setTimeout(fn, 100));
		const oForm = this.oForm.current;
		if (!oForm) return;
		if (oFormData) oForm.setFieldsValue(oFormData);
		else oForm.resetFields();
	}
	
	// --------------------------------------------------------------------

	// ▼更新故事下的【章节数据】
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
	async toDel(id, isCompletelyDelete){
		const {oSectionTB, oStoryTB} = this.state;
		await oSectionTB.where('parent').equals(id).delete();
		if (isCompletelyDelete) {
			await oStoryTB.delete(id);
		}
		await this.init();
		this.getSctToStory();
	}
	


	// ▼去听写
	goTool(oStory, oSct){
		if (!oStory || !oSct) return this.message.info('数据不完整');
		if (!oSct.audioFile) return this.message.info('没有音频文件，请导入');
		if (oSct.isLoading) return this.message.info('请等待初始化完成');
		const sPath = `/practicing?storyId=${oStory.id}&sctId=${oSct.id}`;
		this.props.history.push(sPath);
	}
	importToSct(oSct){
		console.log('oSct', oSct);
		const dom = document.getElementById(`sct-${oSct.id}`);
		dom.click();
	}
}

// 数据操作方法示例
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


// CreatedAt: "2020-12-13T19:07:19.367+08:00"
// DeletedAt: {Time: "0001-01-01T00:00:00Z", Valid: false}
// ID: 6
// Note: "1111"
// Owner: ""
// StoryName: "测试"
// UpdatedAt: "2020-12-13T19:07:19.367+08:00"

export const columns = [{
	title: '名称',
	dataIndex: 'storyName',
}, {
	title: '创建时间',
	dataIndex: 'CreatedAt',
}, {
	title: '备注',
	dataIndex: 'note',
},{
	title: '操作',
	render: (thisOne) => {
		function showIt(){
			console.log('打印', thisOne);
			console.log('this', this);
		};
		return <Button size="small" onClick={showIt} >
			删除
		</Button>
	},
}];
