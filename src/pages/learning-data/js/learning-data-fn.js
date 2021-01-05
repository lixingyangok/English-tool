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
		res.forEach(cur=>{
			cur.aMedia_ = [];
			cur.needToUploadArr_ = [];
			this.getMediaForOneStory(cur);
		});
		this.setState({ aStory: res });
	}
	// ▼提交表单，提交一个故事
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
	// ▼删除一个故事
	async delOneStory(thisOne) {
		const res = await window.axios.delete('/story/' + thisOne.ID);
		if (!res) return;
		this.init();
	}
	// ▼打开窗口（新建/修改）
	async showModal(oFormData){
		this.setState({visible: true});
		await new Promise(fn => setTimeout(fn, 100));
		const oForm = this.oForm.current;
		if (!oForm) return;
		if (oFormData) oForm.setFieldsValue(oFormData);
		else oForm.resetFields();
	}
	
	// --------------------------------------------------------------------
	uploadMedia(oStory){
		console.log('oStory', oStory);
	}
	importToSct(oSct){
		console.log('oSct', oSct);
		const dom = document.getElementById(`sct-${oSct.id}`);
		dom.click();
	}
}


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
