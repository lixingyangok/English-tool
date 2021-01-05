import React from 'react';
import TheFn from './js/learning-data-fn.js';
import * as cpnt from './style/learning-data.js';
import FileFn from './js/file-fn.js';
import ListFn from './js/list-fn.js';

// ▼组件库
import {
	Modal, Form, Input, Button, Typography, Popconfirm, Menu, Dropdown,
	message, Table, Spin,
} from 'antd';

const MyClass = window.mix(
	React.Component, TheFn, FileFn, ListFn,
);

export default class extends MyClass{
	Modal = Modal;
	message = message;
	oForm = React.createRef(); //窗口中的表单
	state = {
		visible: false, //窗口显示
		aStories: [],
		oStoryTB: {},
		oSectionTB: {},
		// -----------------------------------------
		aStory: [], // 故事列表
		loading: false,
		needToUploadArr: [], // 待上传列表
	}
	render(){
		const {aStories, visible, aStory, loading} = this.state;
		aStory.forEach((cur, idx)=>cur.key=idx);
		return <cpnt.Outter className='center-box'>
			<Spin spinning={loading}>
				<cpnt.BtnBar>
					<h1>资料列表</h1>
					<Button type="primary" onClick={()=>this.showModal()}>
						新增
					</Button>
				</cpnt.BtnBar>
				<Table dataSource={aStory} >
					<Table.Column title="名称" dataIndex="storyName" key="storyName" width={160}/>
					<Table.Column title="信息" key="CreatedAt" width={295}
						render={thisOne=>(<>
							<p>创建于：{thisOne.CreatedAt}</p>
							<p>备注：{thisOne.note}</p>
						</>)}
					/>
					<Table.Column title="文件" key="key"
						render={thisOne => <>
							{thisOne.aMedia_.map((oneMedia,idx) => {
								return <p key={idx}>
									{oneMedia.fileName}
									<Button size='small' type="link" onClick={()=>this.showModal(thisOne)}>
										开始听写
									</Button>
									<Popconfirm placement="topRight" okText="确定" cancelText="取消"
										title="确定删除？"
										onConfirm={()=>this.delOneMedia(thisOne, oneMedia)}
									>
										<Button size='small' type="link">删除</Button>
									</Popconfirm>
								</p>
							})}
							{thisOne.aMedia_.length ? '' : '暂无文件'}
							{thisOne.needToUploadArr_.length ? '\n==========' : ''}
							{thisOne.needToUploadArr_.map((oneItem,idx) => {
								return <p key={idx}>
									{oneItem.file.name}
								</p>
							})}
						</>}
					/>
					<Table.Column title="操作" key="ID" width={170}
						render={thisOne => (
							<>
								<label className="ant-btn ant-btn-link ant-btn-sm">
									导入文件
									<input type="file" multiple="multiple" style={{display: 'none'}}
										onChange={ev => this.toCheckFile(ev, thisOne)}
									/>
								</label>
								<br/>
								<Button size='small' type="link" onClick={()=>this.showModal(thisOne)}>
									修改信息
								</Button>
								<br/>
								<Popconfirm placement="topRight" okText="确定" cancelText="取消"
									title="确定删除？" onConfirm={()=>this.delOneStory(thisOne)}
								>
									<Button size='small' type="link">删除</Button>
								</Popconfirm>
							</>
						)}
					/>
				</Table>
				{/* 分界 */}
				<cpnt.Empty_ visible={aStory.length ? 0 : 1}
					image={cpnt.Empty_.PRESENTED_IMAGE_SIMPLE}
					description="暂无数据，请新增"
				/>
				<cpnt.Ul visible={aStories.length}>
					{aStories.map((cur, idx)=>{
						return <cpnt.OneItem key={idx}>
							<Typography.Title className='my-title' level={4}>
								{cur.name}
							</Typography.Title>
							<div className="info-bar" >
								<span>创建日期：{cur.createDate}</span>
								&emsp;&emsp;&emsp;
								<span>修改日期：{cur.modifyData}</span>
								&emsp;&emsp;&emsp;
								<span>备注：{cur.note || '暂无'}</span>
							</div>
							<div className="btn-wrap">
								<label className="ant-btn ant-btn-sm">
									导入文件
									<input type="file" style={{display: 'none'}} multiple="multiple"
										onChange={ev=>this.toImport(ev, cur)}
									/>
								</label>
								<Button size='small' onClick={()=>this.showModal(cur)}>修改</Button>
								<Popconfirm placement="topRight" okText="清空" cancelText="取消"
									title="清空不可恢复，是否清空？" onConfirm={()=>this.toDel(cur.id)}
								>
									<Button size='small'>清空</Button>
								</Popconfirm>
								<Popconfirm placement="topRight" okText="删除" cancelText="取消"
									title="删除不可恢复，是否删除？" onConfirm={()=>this.toDel(cur.id, true)}
								>
									<Button size='small'>删除</Button>
								</Popconfirm>
							</div>
							{this.getSectionList(cur)}
						</cpnt.OneItem>
					})}
				</cpnt.Ul>
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
	// ▼章节列表
	getSectionList(oStory){
		const {aSections=[]} = oStory;
		if (!aSections.length){
			return <cpnt.Empty_ visible={1} description="暂无数据，请导入文件"
				image={cpnt.Empty_.PRESENTED_IMAGE_SIMPLE}
			/>
		}
		return <cpnt.SectionList>
			{aSections.map((oSct, idx)=>{
				return <li key={idx}>
					<h3 title={(oSct.audioFile || {}).name}>
						{(oSct.audioFile || {}).name || '无音频'}
					</h3>
					<cpnt.BtnWrapInTrack className="btns">
						<Button type="link" onClick={()=>this.goTool(oStory, oSct)} >
							听写
						</Button>
						<Dropdown overlay={this.getMenu(oSct)} placement="bottomLeft" arrow>
							<Button type="link">
								操作&nbsp;<i className="fa fa-angle-down"/>
							</Button>
						</Dropdown>
						<input type="file" multiple="multiple" style={{display: 'none'}}
							onChange={ev=>this.toImport(ev, oStory, oSct)}
							id={`sct-${oSct.id}`}
						/>
					</cpnt.BtnWrapInTrack>
					{this.getTrackInfo(oSct)}
				</li>
			})}
		</cpnt.SectionList>
	}
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
	// ▼生命周期
	async componentDidMount(){
		await this.init();
	}
}