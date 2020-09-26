import React from 'react';
import { Result, Button, Input } from 'antd';
import * as cpnt from "./style/index.js";
import indexFn from './js/index.js';


const MyClass = window.mix(
	React.Component, indexFn,
);

export default class IndexPage extends MyClass {
	state = {
		loginForm: {
			account: '',
			password: '',
		},
		logInfo: {},
	}
	render(){
		const { logInfo } = this.state;
		return <div className="center-box" >
			<br/>
			<br/>
			<Result status="403"
				title="这是首页"
				subTitle="欢迎来到“哈哈学习”，你能来这里，说明你智商蛮可以！"
				extra={<Button type="primary">Back Home</Button>}
			/>
			<div>
				{(()=>{
					if (!logInfo.account) return '未登录';
					return `用户：${logInfo.account}  --  登录于：${logInfo.loginAt}`;
				})()}
			</div>
			<cpnt.LoginBox>
				<input name="account" onChange={ev => this.inputChanged(ev)}/>
				<input name="password" onChange={ev => this.inputChanged(ev)}/>
				<button onClick={()=>this.toLogIn()}>
					登录
				</button>
				<button onClick={()=>this.logOut()}>
					退出
				</button>
			</cpnt.LoginBox>
			<br/>
			<br/>
			<br/>
			<Input.Search placeholder="请输入"
				enterButton="添加"
				onSearch={value => this.saveTodo(value)}
			/>
			<footer className="be-center">
				网站备案/许可证号：陕ICP备20008324号
			</footer>
		</div>
	}
	async componentDidMount(){
		this.getSession();
	}
}

