/*
 * @Author: 李星阳
 * @LastEditors: 李星阳
 * @Description: 
 */ 

// import React from 'react';
// import {Button} from 'antd';
const {axios} = window;

class asyncFn {
	// ▼初始化，即查询【故事数据】
	async init(isFromZero=false){
		// const {pageInfo} = (
		// 	isFromZero ? this.oOriginal.dc_ : this.state
		// );
		const {pageInfo, iType} = this.state;
		const {data: res} = await axios.get('/story', {
			params: {
				...pageInfo,
				type: iType, 
			},
		});
		if (!res || !res.rows) return;
		this.setState({
			aStory: res.rows,
			total: res.total,
			needToGet: false,
		});
	}
	// ▼提交表单，提交一个故事
	async onSave(oForm) {
		Object.entries(oForm).forEach(([key, val]) => {
			if (val === undefined) oForm[key] = '';
		});
		// oForm.words = '1,2,3';
		console.log('表单', oForm);
		if (!oForm.storyName) return;
		const method = oForm.ID ? 'put' : 'post';
		const {data: res} = await axios[method]('/story', oForm);
		if (!res) return;
		this.setState({visible: false});
		this.init();
	}
	// ▼删除一个故事
	async delOneStory(thisOne) {
		const {ID, kids} = thisOne;
		if (kids > 0) {
			return this.message.error('请先删除故事下的章节');
		}
		const {data} = await axios.delete('/story/' + ID);
		if (!data) return;
		this.init();
		const {oStoryTB} = this.state;
		const oCollection = oStoryTB.where('ID').equals(ID);
		oCollection.count().then(res=>{
			res && oCollection.delete();
		});
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
	// ▼设定状态
	async setType(oStory){
		const {data: res} = await axios.put('/story/set-type', {
			storyId: oStory.ID,
			type: oStory.type === 0 ? 1 : 0,
		});
		if (!res) return;
		this.init();
	}
}


class simpleFn {
	chnagePage(current){
		const pageInfo = ({
			...this.state.pageInfo, current,
		});
		this.setState({pageInfo}, this.init);
	}
	// changeSize(current, pageSize){
	// 	const pageInfo = ({current, pageSize});
	// 	this.setState({pageInfo}, this.init);
	// }
	// ▼跳到详情
	goInfoPage02(oStory){
		let sUrl = `/learning-page/${oStory.ID}`;
		// console.log('sUrl：', sUrl);
		// window.open(sUrl, '_blank');
		this.props.history.push(sUrl); // bj路由跳转
	}
	// 
	oRouteChanged(props){
		// let {type} = props.match.params || {};
		// type = type * 1 || -1;
		// const isSame = type === this.iType;
		// if (isSame) return;
		// this.iType = type;
		// // console.log('新-type：', type);
		// this.init(true);
	}
}

export default window.mix(
	asyncFn,
	simpleFn,
);