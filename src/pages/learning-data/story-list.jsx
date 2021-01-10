import React from 'react';
import TheFn from './js/story-list-fn.js';
import * as cpnt from './style/learning-data.js';
import FileFn from './js/file-fn.js';

// ▼组件库
import {
	Modal, Form, Input, Button, Popconfirm, Menu,
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
							{oCurStory.aMedia_.map((oneMedia,idx) => {
								return <p key={idx}>
									{oneMedia.fileName}
									<Button size='small' type="link" onClick={()=>this.showModal(oCurStory)}>
										开始听写
									</Button>
									<Popconfirm placement="topRight" okText="确定" cancelText="取消"
										title="确定删除？"
										onConfirm={()=>this.delOneMedia(oCurStory, oneMedia)}
									>
										<Button size='small' type="link">删除</Button>
									</Popconfirm>
								</p>
							})}
							{oCurStory.aMedia_.length ? '' : '暂无已经上传的文件'}
							{this.showTheFileListReadyForUpload(
								oCurStory.needToUploadArr_, oCurStory,
							)}
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
	// ▼章节信息
	getTrackInfo(oSct){
		const {
			audioFile, aLines=[],
			buffer={}, srtFile={},
			isLoading=false,
		} = oSct;
		const size = audioFile ? (audioFile.size / 1024 / 1024).toFixed(2) : '0';
		const {duration=0} = buffer || {};
		const nowState = (()=>{
			if (duration) return <span><i className="fas fa-check-circle green"></i></span>;
			if (isLoading) return <span><i className="fas fa-spinner fa-spin yellow"></i></span>;
			return <span><i className="fas fa-exclamation-circle red"></i></span>;
		})();
		return <>
			<cpnt.InfoBar>
				体积：{size}MB&emsp;&emsp;
				时长：{buffer.sDuration_ || '未知'}&emsp;&emsp;
				初始化：{nowState}
			</cpnt.InfoBar>
			<cpnt.InfoWrap>
				<dt>字幕：</dt>
				<dd>
					{srtFile.name || '暂无'}
				</dd>
				<dt>总数：</dt>
				<dd>{aLines.length}句</dd>
			</cpnt.InfoWrap>
		</>
	}
	getMenu(oSct){
		return <Menu>
			<Menu.Item onClick={()=>this.getSectionBuffer(oSct)}>
				初始化
			</Menu.Item>
			<Menu.Item onClick={()=>this.importToSct(oSct)}>
				导入文件
			</Menu.Item>
			<Menu.Item onClick={()=>this.toExport(oSct)}>
				导出字幕
			</Menu.Item>
			<Menu.Item onClick={()=>this.toDelSection(oSct)}>
				删除
			</Menu.Item>
		</Menu>
	}
	showTheFileListReadyForUpload(aFiles, oStory){
		if (!aFiles.length) return <div>
			没有待上传的文件
		</div>
		const ul = <cpnt.filesWaitToUpload>
			{aFiles.map((cur, idx)=>{
				const {file, forOwnDB} = cur;
				return <li key={idx}>
					音频：{file.name}
					<br/>
					字幕：{forOwnDB.subtitleFile ? forOwnDB.subtitleFile.name : '无字幕文件'}
					<br/>
					<Button type="primary" size="small"
						onClick={()=>this.toUpload(cur, oStory)}
					>
						上传
					</Button>
				</li>
			})}
		</cpnt.filesWaitToUpload>
		return ul;
	}
	// ▼生命周期
	async componentDidMount(){
		await this.init();
	}
}