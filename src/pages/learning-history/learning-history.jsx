import React from 'react';
import TheFn from './js/learning-history-fn.js';
import * as cpnt from './style/learning-history.js';
import FileFn from './js/file-fn.js';

// ▼组件库
import {
	Modal, Form, Input, Button, Typography, Popconfirm
} from 'antd';

const MyClass = window.mix(
	React.Component, TheFn, FileFn,
);

export default class extends MyClass{
	// constructor(props){
	// 	super(props);
	// }
	oForm = React.createRef();
	state = {
		visible: false, //窗口显示
		oStories: {},
		aStories: [],
	}
	render(){
		const {aStories, visible} = this.state;
		return <cpnt.Outter className='center-box'>
			{/* <cpnt.H1>历史记录</cpnt.H1> */}
			<cpnt.BtnBar>
				<em>历史记录</em>
				<Button type="primary" onClick={()=>this.showModal()}>
					新增
				</Button>
			</cpnt.BtnBar>
			<cpnt.Ul>
				{aStories.map((cur, idx)=>{
					return <cpnt.OneItem key={idx}>
						<Typography.Title className='my-title' level={4}>
							{cur.name}	
						</Typography.Title>
						<div className="info-bar" >
							<span>创建日期：{cur.createDate}</span>
							&emsp;&emsp;&emsp;
							<span>修改日期：{cur.modifyData}</span>
						</div>
						<div className="btn-wrap">
							<Button size='small' onClick={()=>this.showModal(cur)}>修改</Button>
							<Popconfirm placement="topRight" okText="删除" cancelText="取消"
								title="删除不可恢复，是否删除？" onConfirm={()=>this.toDel(cur.id)}
							>
								<Button size='small'>删除</Button>
							</Popconfirm>
							<label className="ant-btn ant-btn-sm">
								导入文件
								<input type="file" style={{display: 'none'}} multiple="multiple"
									onChange={ev=>this.toImport(ev, cur)}
								/>
							</label>
						</div>
						<div>
							<p>{cur.note || '暂无描述'}</p>
							<cpnt.TrackList>
								{cur.tracks.map((oTrack, idx)=>{
									return <li key={idx}>
										<h3>{oTrack.name}</h3>
										<cpnt.BtnWrapInTrack className="btns" >
											{/* <label className="ant-btn">
												替换文件
												<input file='type' style={{display: 'none'}} multiple="multiple"
													onChange={ev=>this.toImportToTrack(ev, cur, idx)}
												/>
											</label> */}
											<Button type="link">初始化</Button>
											<Popconfirm placement="topRight" okText="删除" cancelText="取消"
												title="删除不可恢复，是否删除？" onConfirm={()=>this.toDelOneTrack(cur, idx)}
											>
												<Button type="link">删除</Button>
											</Popconfirm>
										</cpnt.BtnWrapInTrack>
										<cpnt.InfoWrap>
											<dt>来源：</dt>
											<dd>{oTrack.path || '未知'}</dd>
											<dt>体积：</dt>
											<dd>{(oTrack.audioFile.size / 1024 / 1024).toFixed(2)}MB</dd>
											<dt>字幕：</dt>
											<dd>{(oTrack.srtFile || {}).name || '暂无'}</dd>
										</cpnt.InfoWrap>
									</li>
								})}
							</cpnt.TrackList>
						</div>
					</cpnt.OneItem>
				})}
			</cpnt.Ul>
			<Modal title="新增" okText="保存" cancelText="关闭"
				visible={visible}
				onOk={()=>this.oForm.current.submit()}
				onCancel={()=>this.setState({visible: false})}
			>
				<Form name="basic" initialValues={{}}
					{...{labelCol: {span: 4}, wrapperCol: {span: 19}}}
					ref={this.oForm} onFinish={obj=>this.onSave(obj)}
				>
					<Form.Item label="名称" name="name" rules={[{ required: true, message: 'Please input' }]} >
						<Input/>
					</Form.Item>
					<Form.Item label="备注" name="note">
						<Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }}/>
					</Form.Item>
					<Form.Item name="id" hidden={true}><Input/></Form.Item>
				</Form>
			</Modal>
		</cpnt.Outter>
	}
	componentDidMount(){
		this.startDb();
	}
	
}