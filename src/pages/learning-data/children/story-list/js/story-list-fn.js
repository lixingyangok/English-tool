/*
 * @Author: 李星阳
 * @LastEditors: 李星阳
 * @Description: 
 */ 

// import React from 'react';
// import {Button} from 'antd';
const {axios} = window;

export default class{
	// ▼初始化，即查询【故事数据】
	async init(){
		// console.log('this.state.pageInfo', this.state.pageInfo);
		const {data: res} = await axios.get('/story', {
			params: {
				...this.state.pageInfo,
			},
		});
		if (!res) return;
		res.rows.forEach(cur=>{
			cur.aMedia_ = [];
			this.getMediaForOneStory(cur);
		});
		this.setState({
			aStory: res.rows,
			total: res.total,
		});
	}
	async dbInit(){
		const trainingDB = new window.Dexie("trainingDB");
		trainingDB.version(1).stores({story: '++id, ID, name, storyId'});
		trainingDB.version(2).stores({media: '++id, ID, fileId, ownerStoryId'});
		const oStoryTB = trainingDB.story;
		const mediaTB = trainingDB.media;
		this.setState({oStoryTB, mediaTB});
	}
	chnagePage(current){
		const pageInfo = ({
			...this.state.pageInfo, current,
		});
		this.setState({pageInfo}, this.init);
	}
	// ▼提交表单，提交一个故事
	async onSave(oForm) {
		Object.entries(oForm).forEach(([key, val]) => {
			if (val === undefined) oForm[key] = '';
		});
		// console.log('表单', oForm);
		if (!oForm.storyName) return;
		const method = oForm.ID ? 'put' : 'post';
		const {data: res} = await axios[method]('/story', oForm);
		if (!res) return;
		this.setState({visible: false});
		this.init();
	}
	// ▼删除一个故事
	async delOneStory(thisOne) {
		const {aMedia_, ID} = thisOne;
		if (aMedia_.length) {
			return this.message.error('请先删除故事下的章节');
		}
		const {data} = await axios.delete('/story/' + ID);
		if (!data) return;
		this.init();
		const {oStoryTB} = this.state;
		oStoryTB.where('ID').equals(ID).delete();
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
	// ▼跳到听写
	goToolPage(oStory, oMedia){
		// console.log('故事oStory', oStory);
		// console.log('文件oMedia', oMedia);
		const sPath = `/learning-data/practicing`;
		const query = `?storyId=${oStory.ID}&mediaId=${oMedia.ID}`;
		this.props.history.push(sPath + query);
	}
	// ▼旧的方法 --------------------------------------------------------------------
	uploadMedia(oStory){
		console.log('oStory', oStory);
	}
	importToSct(oSct){
		console.log('oSct', oSct);
		const dom = document.getElementById(`sct-${oSct.id}`);
		dom.click();
	}
	
}

