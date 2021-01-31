/*
 * @Author: 李星阳
 * @Date: 2020-12-15 21:50:40
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-01-31 18:53:50
 * @Description: 
 */

import React from 'react';
import * as cpnt from './style/learning-data.js';
import TheFn from './js/story-list-fn.js';
import FileFn from './js/file-fn.js';

// ▼组件库
import {
	Modal, Form, Input, Button, Popconfirm, Space,
	message, Spin, Pagination,
} from 'antd';

const MyClass = window.mix(
	React.Component, TheFn, FileFn,
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
		oQueuer: {}, // 排队上传的媒体
		loading: false,
		pageInfo: {
			current: 1,
			pageSize: 10,
		},
		total: 0,
	}
	render(){
		const {visible, aStory, loading, pageInfo, total} = this.state;
		const oneStory = <cpnt.StoryUl>
			{aStory.map((oCurStory, idx) => {
				const myLi = <cpnt.oneStory key={idx}>
					<h1 className="story-name">{oCurStory.storyName}</h1>
					<div className="btn-wrap">
						<label className="ant-btn ant-btn-link ant-btn-sm">
							导入文件
							<input type="file" multiple="multiple" style={{display: 'none'}}
								onChange={ev => this.toCheckFile(ev, oCurStory)}
							/>
						</label>
						<Button size='small' type="link" onClick={()=>this.showModal(oCurStory)}>
							修改信息
						</Button>
						<Button size='small' type="link" onClick={()=>this.showModal(oCurStory)}>
							详情
						</Button>
						<Popconfirm placement="topRight" okText="确定" cancelText="取消"
							title="确定删除？" onConfirm={()=>this.delOneStory(oCurStory)}
						>
							<Button size='small' type="link">删除</Button>
						</Popconfirm>
					</div>
					<p className="story-info" >
						<span>创建于：{oCurStory.CreatedAt}</span>
						<span>备注：{oCurStory.note}</span>
					</p>
					{this.showFilesOfOneStory(oCurStory)}
					{this.showTheFileListReadyForUpload(oCurStory)}
				</cpnt.oneStory>
				return myLi;
			})}
		</cpnt.StoryUl>
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
				{oneStory}
				<cpnt.Empty_ visible={aStory.length ? 0 : 1}
					image={cpnt.Empty_.PRESENTED_IMAGE_SIMPLE}
					description="暂无数据，请新增"
				/>
				<Pagination total={total}
					pageSize={pageInfo.pageSize}
					current={pageInfo.current} 
					onChange={newPage=>this.chnagePage(newPage)}
				/>
				{dialog}
			</Spin>
		</cpnt.Outter>
		return resultHTML;
	}
	// ▲render
	// -------------分界-----------------
	// ▼陈列【已经上传】的文件
	showFilesOfOneStory(oStory){
		const aMedia_ = oStory.aMedia_;
		if (!aMedia_.length) return '暂无文件';
		const myLiArr = aMedia_.map((oMedia, idx)=>{
			const oneLi= <li key={idx}>
				<h3 className="title ellipsis" >
					{oMedia.fileName}
				</h3>
				字幕：{oMedia.subtitleFileName || '元'}<br/>
				<Space className="media-btn-wrap" >
					<Button type="primary" size="small" onClick={()=>this.goToolPage(oStory, oMedia)}>
						听写
					</Button>
					<label className="ant-btn ant-btn-sm">
						替换音/视频
						<input type="file" accept="audio/*, video/*"
							style={{display: 'none'}}
							onChange={ev => this.checkForUpload(ev, oStory, oMedia, 0)}
						/>
					</label>
					<label className="ant-btn ant-btn-sm">
						替换字幕
						<input type="file" style={{display: 'none'}}
							onChange={ev => this.checkForUpload(ev, oStory, oMedia, 1)}
						/>
					</label>
					<Popconfirm placement="topRight" okText="确定" cancelText="取消"
						title="确定删除？"
						onConfirm={()=>this.delOneMedia(oStory, oMedia)}
					>
						<Button size="small">删除</Button>
					</Popconfirm>
				</Space>
			</li>;
			return oneLi;
		});
		const ul = <cpnt.fileList>{myLiArr}</cpnt.fileList>
		return ul;
	}
	// ▼陈列【待上传】的文件
	showTheFileListReadyForUpload(oStory){
		const aFiles = this.state.oQueuer[oStory.ID] || [];
		if (!aFiles.length) return null;
		function getSubtitleInfo(oneMedia){
			if (oneMedia.loadingStr) return <span>
				正在加载字幕 <i className="fas fa-spinner fa-spin yellow"></i>
			</span>;
			if (oneMedia.oSubtitleFile) return <span>
				{oneMedia.oSubtitleFile.name}
			</span>;
			return <span>无字幕</span>;
		}
		const myLiArr = aFiles.map((cur, idx)=>{
			const {file} = cur;
			const oLi = <li key={idx}>
				音频：{file.name}<br/>
				字幕：{getSubtitleInfo(cur)}<br/>
				<Button type="primary" size="small"
					onClick={()=>this.toUpload(oStory, cur, idx)}
				>
					上传
				</Button>
				&nbsp;
				<Button type="primary" size="small"
					onClick={()=>this.deleteOneCandidate(oStory.ID, idx)}
				>
					删除
				</Button>
			</li>;
			return oLi;
		});
		const ul = <cpnt.filesWaitToUpload>
			{myLiArr}
		</cpnt.filesWaitToUpload>
		return ul;
	}
	// ▼生命周期
	async componentDidMount(){
		await this.init();
		this.dbInit();
	}
}