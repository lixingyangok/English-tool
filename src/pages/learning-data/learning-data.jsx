import React, {Suspense} from 'react';
import { Route, Redirect, Switch } from 'react-router-dom';
import Loading from 'common/components/loading/loading.jsx';

// import TheFn from './js/learning-data-fn.js';
// import * as cpnt from './style/learning-data.js';
// import FileFn from './js/file-fn.js';
import {learningData} from 'common/components/navigation/navigation.jsx';

// // ▼组件库
// import {
// 	Modal, Form, Input, Button, Typography, Popconfirm, Menu, Dropdown,
// 	message, Table, Space,
// } from 'antd';

// 这是路由页★★★★★★★★★★★★★★
export default function (){
	const getPath = url => `/learning-data${url}`;
	return <Suspense fallback={Loading}>
		<Switch>
			<Redirect exact from="/learning-data" to="/learning-data/list" />
			{learningData.map((cur,idx)=>{
				return <Route key={idx} path={getPath(cur.path)} 
					component={cur.component}
				/>
			})}
		</Switch>
	</Suspense>
}

// const MyClass = window.mix(
// 	React.Component, TheFn, FileFn,
// );

// class Abc extends MyClass{
// 	Modal = Modal;
// 	message = message;
// 	oForm = React.createRef(); //窗口中的表单
// 	state = {
// 		visible: false, //窗口显示
// 		aStories: [],
// 		oStoryTB: {},
// 		oSectionTB: {},
// 		// -----------------------------------------
// 		aStory: [],
// 	}
// 	constructor(props){
// 		super(props)
// 		console.log('props', props);
// 	}
// 	render(){
// 		const {aStories, visible, aStory} = this.state;
// 		aStory.forEach((cur, idx)=>cur.key=idx);
// 		return <cpnt.Outter className='center-box'>
// 			<cpnt.BtnBar>
// 				<em>历史记录</em>
// 				<Button type="primary" onClick={()=>this.showModal()}>
// 					新增
// 				</Button>
// 			</cpnt.BtnBar>
// 			{/* columns={columns}  */}
// 			<Table dataSource={aStory} >
// 				<Table.Column title="名称" dataIndex="storyName" key="storyName" />
// 				<Table.Column title="创建时间" dataIndex="CreatedAt" key="CreatedAt" />
// 				<Table.Column title="备注" dataIndex="note" key="note" />
// 				<Table.Column title="操作" key="ID"
// 					render={thisOne => (
// 						<Space>
// 							<Button size='small' onClick={()=>this.showModal(thisOne)}>修改</Button>
// 							<Popconfirm placement="topRight" okText="确定" cancelText="取消"
// 								title="确定删除？" onConfirm={()=>this.delOneStory(thisOne)}
// 							>
// 								<Button size='small'>删除</Button>
// 							</Popconfirm>
// 						</Space>
// 					)}
// 				/>
// 			</Table>
// 			{/* 分界 */}
// 			<cpnt.Empty_ visible={aStory.length ? 0 : 1}
// 				image={cpnt.Empty_.PRESENTED_IMAGE_SIMPLE}
// 				description="暂无数据，请新增"
// 			/>
// 			<cpnt.Ul visible={aStories.length}>
// 				{aStories.map((cur, idx)=>{
// 					return <cpnt.OneItem key={idx}>
// 						<Typography.Title className='my-title' level={4}>
// 							{cur.name}
// 						</Typography.Title>
// 						<div className="info-bar" >
// 							<span>创建日期：{cur.createDate}</span>
// 							&emsp;&emsp;&emsp;
// 							<span>修改日期：{cur.modifyData}</span>
// 							&emsp;&emsp;&emsp;
// 							<span>备注：{cur.note || '暂无'}</span>
// 						</div>
// 						<div className="btn-wrap">
// 							<label className="ant-btn ant-btn-sm">
// 								导入文件
// 								<input type="file" style={{display: 'none'}} multiple="multiple"
// 									onChange={ev=>this.toImport(ev, cur)}
// 								/>
// 							</label>
// 							<Button size='small' onClick={()=>this.showModal(cur)}>修改</Button>
// 							<Popconfirm placement="topRight" okText="清空" cancelText="取消"
// 								title="清空不可恢复，是否清空？" onConfirm={()=>this.toDel(cur.id)}
// 							>
// 								<Button size='small'>清空</Button>
// 							</Popconfirm>
// 							<Popconfirm placement="topRight" okText="删除" cancelText="取消"
// 								title="删除不可恢复，是否删除？" onConfirm={()=>this.toDel(cur.id, true)}
// 							>
// 								<Button size='small'>删除</Button>
// 							</Popconfirm>
// 						</div>
// 						{this.getSectionList(cur)}
// 					</cpnt.OneItem>
// 				})}
// 			</cpnt.Ul>
// 			{/* ▼弹出窗口 */}
// 			<Modal title="资源信息" okText="保存" cancelText="关闭"
// 				visible={visible}
// 				onOk={()=>this.oForm.current.submit()}
// 				onCancel={()=>this.setState({visible: false})}
// 			>
// 				<Form name="basic" initialValues={{}}
// 					{...{labelCol: {span: 4}, wrapperCol: {span: 19}}}
// 					ref={this.oForm} onFinish={obj=>this.onSave(obj)}
// 				>
// 					<Form.Item label="名称" name="storyName" rules={[{ required: true, message: 'Please input' }]} >
// 						<Input/>
// 					</Form.Item>
// 					<Form.Item label="备注" name="note">
// 						<Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }}/>
// 					</Form.Item>
// 					<Form.Item name="ID" hidden={true}>
// 						<Input/>
// 					</Form.Item>
// 				</Form>
// 			</Modal>
// 		</cpnt.Outter>
// 	}
// 	// ▲render
// 	// -------------分界-----------------
// 	// ▼章节列表
// 	getSectionList(oStory){
// 		const {aSections=[]} = oStory;
// 		if (!aSections.length){
// 			return <cpnt.Empty_ visible={1} description="暂无数据，请导入文件"
// 				image={cpnt.Empty_.PRESENTED_IMAGE_SIMPLE}
// 			/>
// 		}
// 		return <cpnt.SectionList>
// 			{aSections.map((oSct, idx)=>{
// 				return <li key={idx}>
// 					<h3 title={(oSct.audioFile || {}).name}>
// 						{(oSct.audioFile || {}).name || '无音频'}
// 					</h3>
// 					<cpnt.BtnWrapInTrack className="btns">
// 						<Button type="link" onClick={()=>this.goTool(oStory, oSct)} >
// 							听写
// 						</Button>
// 						<Dropdown overlay={this.getMenu(oSct)} placement="bottomLeft" arrow>
// 							<Button type="link">
// 								操作&nbsp;<i className="fa fa-angle-down"/>
// 							</Button>
// 						</Dropdown>
// 						<input type="file" multiple="multiple" style={{display: 'none'}}
// 							onChange={ev=>this.toImport(ev, oStory, oSct)}
// 							id={`sct-${oSct.id}`}
// 						/>
// 					</cpnt.BtnWrapInTrack>
// 					{this.getTrackInfo(oSct)}
// 				</li>
// 			})}
// 		</cpnt.SectionList>
// 	}
// 	// ▼章节信息
// 	getTrackInfo(oSct){
// 		const {
// 			audioFile, aLines=[],
// 			buffer={}, srtFile={},
// 			isLoading=false,
// 		} = oSct;
// 		const size = audioFile ? (audioFile.size / 1024 / 1024).toFixed(2) : '0';
// 		const {duration=0} = buffer || {};
// 		const nowState = (()=>{
// 			if (duration) return <span><i className="fas fa-check-circle green"></i></span>;
// 			if (isLoading) return <span><i className="fas fa-spinner fa-spin yellow"></i></span>;
// 			return <span><i className="fas fa-exclamation-circle red"></i></span>;
// 		})();
// 		return <>
// 			<cpnt.InfoBar>
// 				体积：{size}MB&emsp;&emsp;
// 				时长：{buffer.sDuration_ || '未知'}&emsp;&emsp;
// 				初始化：{nowState}
// 			</cpnt.InfoBar>
// 			<cpnt.InfoWrap>
// 				<dt>字幕：</dt>
// 				<dd>
// 					{srtFile.name || '暂无'}
// 				</dd>
// 				<dt>总数：</dt>
// 				<dd>{aLines.length}句</dd>
// 			</cpnt.InfoWrap>
// 		</>
// 	}
// 	getMenu(oSct){
// 		return <Menu>
// 			<Menu.Item onClick={()=>this.getSectionBuffer(oSct)}>
// 				初始化
// 			</Menu.Item>
// 			<Menu.Item onClick={()=>this.importToSct(oSct)}>
// 				导入文件
// 			</Menu.Item>
// 			<Menu.Item onClick={()=>this.toExport(oSct)}>
// 				导出字幕
// 			</Menu.Item>
// 			<Menu.Item onClick={()=>this.toDelSection(oSct)}>
// 				删除
// 			</Menu.Item>
// 		</Menu>
// 	}
// 	// ▼生命周期
// 	async componentDidMount(){
// 		await this.init();
// 		this.getSctToStory();
// 	}
// }