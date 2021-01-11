import React from 'react';
import TheFn from './js/story-list-fn.js';
import * as cpnt from './style/learning-data.js';
import FileFn from './js/file-fn.js';

// ▼组件库
import {
	Modal, Form, Input, Button, Popconfirm, Space,
	message, Spin,
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
		// aStories: [],
		oStoryTB: {},
		oSectionTB: {},
		// -----------------------------------------
		aStory: [], // 故事列表
		loading: false,
		needToUploadArr: [], // 待上传列表
	}
	render(){
		const {visible, aStory, loading} = this.state;
		aStory.forEach((cur, idx)=>cur.key=idx);
		return <cpnt.Outter className='center-box'>
			<Spin spinning={loading}>
				<cpnt.BtnBar>
					<h1>资料列表</h1>
					<Button type="primary" onClick={()=>this.showModal()}>
						新增
					</Button>
				</cpnt.BtnBar>
				<cpnt.StoryUl>
					{aStory.map((oCurStory,idx)=>{
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
				{/* 分界 */}
				<cpnt.Empty_ visible={aStory.length ? 0 : 1}
					image={cpnt.Empty_.PRESENTED_IMAGE_SIMPLE}
					description="暂无数据，请新增"
				/>
				{/* ▼弹出窗口 */}
				<Modal title="资源信息" okText="保存" cancelText="关闭"
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
			</Spin>
		</cpnt.Outter>
	}
	// ▲render
	// -------------分界-----------------
	// ▼陈列【已经上传】的文件
	showFilesOfOneStory(oStory){
		const aFiles = oStory.aMedia_;
		if (!aFiles.length) return '暂无文件';
		const myLiArr = aFiles.map((curFile, idx)=>{
			return <li key={idx}>
				音频：{curFile.fileName}<br/>
				字幕：{curFile.subtitleFileName || '元'}<br/>
				<Space className="media-btn-wrap" >
					<Button type="primary" size="small">
						听写
					</Button>
					<Button size="small">
						下载
					</Button>
					<Popconfirm placement="topRight" okText="确定" cancelText="取消"
						title="确定删除？"
						onConfirm={()=>this.delOneMedia(oStory, curFile)}
					>
						<Button size="small">删除</Button>
					</Popconfirm>
				</Space>
			</li>
		});
		const ul = <cpnt.fileList>{myLiArr}</cpnt.fileList>
		return ul;
	}
	// ▼陈列【待上传】的文件
	showTheFileListReadyForUpload(oStory){
		const aFiles = oStory.needToUploadArr_;
		if (!aFiles.length) return null;
		const myLiArr = aFiles.map((cur, idx)=>{
			const {file, subtitleFile} = cur;
			return <li key={idx}>
				音频：{file.name}<br/>
				字幕：{subtitleFile ? subtitleFile.fileName : '-'}<br/>
				<Button type="primary" size="small"
					onClick={()=>this.toUpload(oStory, cur, idx)}
				>
					上传
				</Button>
				&nbsp;
				<Button type="primary" size="small"
					onClick={()=>this.deleteOneCandidate(oStory, idx)}
				>
					删除
				</Button>
			</li>
		});
		const ul = <cpnt.filesWaitToUpload>
			{myLiArr}
		</cpnt.filesWaitToUpload>
		return ul;
	}
	// ▼生命周期
	async componentDidMount(){
		await this.init();
	}
}