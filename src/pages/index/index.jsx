import React from 'react';
import { Result } from 'antd';
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
		const { logInfo, loginForm } = this.state;
		return <div className="center-box" >
			<br/>
			<br/>
			<Result status="403"
				title="开始学习吧"
				subTitle123="欢迎来到“哈哈学习”，你能来这里，说明你智商蛮可以！"
			/>
			<cpnt.LoginBox>
				{(()=>{
					if (!logInfo.account) return (
						`未登录 - ${logInfo.requestAt}`
					);
					return `用户：${logInfo.account}  --  登录于：${logInfo.loginAt}`;
				})()}
			</cpnt.LoginBox>
			<cpnt.LoginBox>
				<input name="account" value={loginForm.account} onChange={ev => this.inputChanged(ev)}/>
				<input name="password" value={loginForm.password} onChange={ev => this.inputChanged(ev)}/>
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
			<footer className="be-center">
				网站备案/许可证号：陕ICP备20008324号
			</footer>
		</div>
	}
	async componentDidMount(){
		this.getSession();
	}
}

