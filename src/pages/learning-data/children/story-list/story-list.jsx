/*
 * @Author: 李星阳
 * @Date: 2020-12-15 21:50:40
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-02-21 16:52:10
 * @Description: 
 */

import React from 'react';
import * as cpnt from './style/story-list.js';
import TheFn from './js/story-list-fn.js';
import {aStoryType} from 'assets/js/data.js';

// ▼组件库
import {
	Modal, Form, Input, Button, Popconfirm, 
	message, Spin, Tag, Dropdown, Menu,
} from 'antd';

const MyClass = window.mix(
	React.Component, TheFn,
);
const oOriginal = {
	pageInfo: { current: 1, pageSize: 20 },
	aStory: [], // 故事列表
	total: 0,
};

export default class extends MyClass{
	Modal = Modal;
	message = message;
	oForm = React.createRef(); //窗口中的表单
	state = {
		...oOriginal.dc_,
		loading: false,
		visible: false, //窗口显示
		iType: null,
		needToGet: true,
	}
	constructor(props){
		super(props);
		let {type} = props.match.params || {};
		this.state.iType = type * 1 || -1;
	}
	getStoryList(){
		const {aStory} = this.state;
		const storyInfo = aStory.map((oCurStory, idx) => {
			const {info_} = oCurStory;
			const myLi = <cpnt.oneStory key={idx}>
				<h1 className="story-name">{oCurStory.storyName}</h1>
				<p className="story-info">
					<span>创建时间：{oCurStory.time_}</span>
					<span>媒体数量：{oCurStory.kids}</span>
				</p>
				<p className="story-info state">
					<span>
						当前类型：
						<Tag color={info_.color} > {info_.name} </Tag>
					</span>
					<Dropdown overlay={
						<Menu onClick={key=>this.setType(oCurStory, key)} >
							{aStoryType.map(cur=>{
								return <Menu.Item key={cur.val}>
									{cur.name}
								</Menu.Item>
							})}
						</Menu>
					}>
						<Button type="text" size="small">变更状态</Button>
					</Dropdown>
				</p>
				<p className="story-info last">
					备注信息：{oCurStory.note || '无备注'}
				</p>
				<Button size='small' type="primary" onClick={()=>this.goInfoPage02(oCurStory)}>
					查看详情
				</Button>
				<Button size='small' type="link" onClick={()=>this.showModal(oCurStory)}>
					修改信息
				</Button>
				
				<Popconfirm placement="topRight" okText="确定" cancelText="取消"
					title="确定删除？" onConfirm={()=>this.delOneStory(oCurStory)}
				>
					<Button size='small' type="link">删除</Button>
				</Popconfirm>
			</cpnt.oneStory>
			return myLi;
		});
		const HTML = <cpnt.StoryUl>
			{storyInfo}
		</cpnt.StoryUl>
		return HTML;
	}
	getModal(){
		const {visible} = this.state;
		const dialog = <Modal title="资源信息" okText="保存" cancelText="关闭"
			visible={visible}
			onOk={()=>this.oForm.current.submit()}
			onCancel={()=>this.setState({visible: false})}
		>
			<Form name="basic" initialValues={{}}
				{...{labelCol: {span: 4}, wrapperCol: {span: 19}}}
				ref={this.oForm} onFinish={obj=>this.onSave(obj)}
			>
				<Form.Item label="名称" name="storyName" rules={[{ required: true, message: 'Please input' }]} >
					<Input/>
				</Form.Item>
				<Form.Item label="备注" name="note">
					<Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }}/>
				</Form.Item>
				<Form.Item name="ID" hidden={true}>
					<Input/>
				</Form.Item>
				<Form.Item name="words" hidden={true}>
					<Input/>
				</Form.Item>
			</Form>
		</Modal>
		return dialog;
	}
	render(){
		const {aStory, loading, pageInfo, total, needToGet} = this.state;
		if (needToGet) this.init();
		const resultHTML = <cpnt.Outter className='center-box'>
			<Spin spinning={loading}>
				<cpnt.BtnBar>
					<h1>资料列表</h1>
					<Button type="primary" onClick={()=>this.showModal()}>
						新增
					</Button>
				</cpnt.BtnBar>
				{this.getStoryList()}
				<cpnt.Empty_ visible={aStory.length ? 0 : 1}
					image={cpnt.Empty_.PRESENTED_IMAGE_SIMPLE}
					description="暂无数据，请新增"
				/>
				<cpnt.myPagination total={total} showTotal={()=>`共${total}条 `}
					pageSize={pageInfo.pageSize}
					current={pageInfo.current} 
					onChange={newPage=>this.chnagePage(newPage)}
				/>
					{/* showSizeChanger */}
					{/* onShowSizeChange={(current, size)=>this.changeSize(current, size)} */}
				{this.getModal()}
			</Spin> 
		</cpnt.Outter>
		return resultHTML;
	}
	// ▲render
	// ▼生命周期
	// shouldComponentUpdate(nextProps, prevState){
	//     console.log('B-shouldComponentUpdate（更新调用');
	//     if (0) console.log(nextProps, prevState);
	// 	return true;
	// }
	static getDerivedStateFromProps(nextProps, prevState){
		const {iType} = prevState;
		let {type: iNewType} = nextProps.match.params || {};
		iNewType = iNewType * 1 || -1;
		if (iNewType !== iType){
			return {...oOriginal.dc_, needToGet: true, iType: iNewType};
		}
		return null;
	}
	// 
	async componentDidMount(){
		// this.init();
	}
}