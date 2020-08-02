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
	oForm = React.createRef();
	state = {
		visible: false, //窗口显示
		aStories: [],
		oStoryTB: {},
		oSectionTB: {},
	}
	render(){
		const {aStories, visible} = this.state;
		return <cpnt.Outter className='center-box'>
			<cpnt.BtnBar>
				<em>历史记录</em>
				<Button type="primary" onClick={()=>this.showModal()}>
					新增
				</Button>
			</cpnt.BtnBar>
			<cpnt.Empty_ visible={aStories.length ? 0 : 1}
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
							<Popconfirm placement="topRight" okText="删除" cancelText="取消"
								title="删除不可恢复，是否删除？" onConfirm={()=>this.toDel(cur.id)}
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
	// ▲render
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
						<Button type="link" onClick={()=>this.getSectionBuffer(oSct)}>
							初始化
						</Button>
						<label className="ant-btn ant-btn-link">
							<span>导入</span>
							<input type="file" style={{display: 'none'}} multiple="multiple"
								onChange={ev=>this.toImport(ev, oStory, oSct)}
							/>
						</label>
						<Button type="link" onClick={()=>this.goTool(oStory, oSct)} >
							听写
						</Button>
						<Popconfirm placement="topRight" okText="删除" cancelText="取消"
							title="删除不可恢复，是否删除？" onConfirm={()=>this.toDelSection(oSct)}
						>
							<Button type="link">删除</Button>
						</Popconfirm>
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
	// ▼生命周期
	async componentDidMount(){
		await this.init();
		this.getSctToStory();
		const pushFiles = this.pushFiles.bind(this);
		document.addEventListener("drop", pushFiles);		// ▼拖动释放
		document.addEventListener("dragleave", pushFiles);	// ▼拖动离开（未必会执行
		document.addEventListener("dragenter", pushFiles);	// ▼拖动进入
		document.addEventListener("dragover", pushFiles);	// ▼拖动进行中
	}
}