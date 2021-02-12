/*
 * @Author: 李星阳
 * @Date: 2020-12-15 21:50:40
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-02-10 14:24:30
 * @Description: 
 */

import React from 'react';
import * as cpnt from './style/story-list.js';
import TheFn from './js/story-list-fn.js';

// ▼组件库
import {
	Modal, Form, Input, Button, Popconfirm, 
	message, Spin,
} from 'antd';

const MyClass = window.mix(
	React.Component, TheFn,
);

export default class extends MyClass{
	Modal = Modal;
	message = message;
	oForm = React.createRef(); //窗口中的表单
	state = {
		visible: false, //窗口显示
		oStoryTB: {}, // 本地故事列表TB
		mediaTB: {}, // 本地媒体列表TB
		aStory: [], // 故事列表
		loading: false,
		pageInfo: {
			current: 1,
			pageSize: 20,
		},
		total: 0,
	}
	render(){
		const {visible, aStory, loading, pageInfo, total} = this.state;
		const storyInfo = aStory.map((oCurStory, idx) => {
			const myLi = <cpnt.oneStory key={idx}>
				<h1 className="story-name">{oCurStory.storyName}</h1>
				<p className="story-info">
					<span>创建时间：{oCurStory.CreatedAt}</span>
					<span>媒体数量：{oCurStory.kids}</span>
				</p>
				<p className="story-info">备注信息：{oCurStory.note || '无备注'}</p>
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
		const resultHTML = <cpnt.Outter className='center-box'>
			<Spin spinning={loading}>
				<cpnt.BtnBar>
					<h1>资料列表</h1>
					<Button type="primary" onClick={()=>this.showModal()}>
						新增
					</Button>
				</cpnt.BtnBar>
				<cpnt.StoryUl>
					{storyInfo}
				</cpnt.StoryUl>
				<cpnt.Empty_ visible={aStory.length ? 0 : 1}
					image={cpnt.Empty_.PRESENTED_IMAGE_SIMPLE}
					description="暂无数据，请新增"
				/>
				<cpnt.myPagination total={total} showTotal={()=>`共${total}条 `}
					showSizeChanger
					pageSize={pageInfo.pageSize}
					current={pageInfo.current} 
					onChange={newPage=>this.chnagePage(newPage)}
					onShowSizeChange={(current, size)=>this.changeSize(current, size)}
				/>
				{dialog}
			</Spin>
		</cpnt.Outter>
		return resultHTML;
	}
	// ▲render
	// ▼生命周期
	async componentDidMount(){
		await this.init();
		this.dbInit();
	}
}