import React from 'react';
import TheFn from './js/learning-history-fn.js';
import * as cpnt from './style/learning-history.js';
// ▼组件库
import {
	Modal, Form, Input, Button, Typography 
} from 'antd';

const MyClass = window.mix(
	React.Component, TheFn,
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
	onFinish = values => {
        const {oStories, aStories} = this.state;
		console.log('Success:', values);
		this.setState({
			visible: false,
            aStories: aStories.concat(values),
		});
		oStories.add(values);
	};
	onFinishFailed = errorInfo => {
		console.log('Failed:', errorInfo);
	};
	render(){
		const {aStories} = this.state;
		return <div className='center-box'>
			<cpnt.H1>
				历史记录
			</cpnt.H1>
			<cpnt.BtnBar>
				<Button type="primary" onClick={this.showModal}>
					新增
				</Button>
			</cpnt.BtnBar>
			<cpnt.Ul>
				{aStories.map((cur, idx)=>{
					return <cpnt.OneItem key={idx}>
						<Typography.Title level={4}>
							{cur.name}	
						</Typography.Title>
						<Button size='small' className="to-del" onClick={()=>this.toDel(cur.id)} >
							删除
						</Button>
						{cur.note}
					</cpnt.OneItem>
				})}
			</cpnt.Ul>
			{/* onOk={()=>this.handleOk()}
			onCancel={this.handleCancel} */}
			<Modal title="新增" visible={this.state.visible}
				footer={[
					<Button key="back" onClick={this.handleCancel}>关闭</Button>,
					<Button key="submit" type="primary" onClick={()=>this.oForm.current.submit()}>保存</Button>,
				]}
			>
				<Form name="basic" initialValues={{}}
					ref={this.oForm}
					{...{labelCol: {span: 4}, wrapperCol: {span: 19}}}
					onFinish={this.onFinish} onFinishFailed={this.onFinishFailed}
				>
					<Form.Item label="名称" name="name" rules={[{ required: true, message: 'Please input' }]} >
						<Input/>
					</Form.Item>
					<Form.Item label="备注" name="note" rules={[{ required: true, message: 'Please input' }]} >
						<Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }}/>
					</Form.Item>
					<Form.Item>
						<Button type="primary" htmlType="submit">Submit</Button>
					</Form.Item>
				</Form>
			</Modal>
		</div>
	}
	componentDidMount(){
		this.startDb();
	}
	showModal = () => {
		this.setState({
			visible: true,
		});
	};
	handleOk = e => {
		this.oForm.current.submit(); //提交表单
	};
	handleCancel = e => {
		this.setState({
			visible: false,
		});
	};
}