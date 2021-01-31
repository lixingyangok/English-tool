import React from 'react';
import * as cpnt from "./style/index.js";
import indexFn from './js/index.js';
import cover from './img/cover.jpg';

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
	getLogInBar(){
		const { logInfo, loginForm } = this.state;
		const logInForm = <cpnt.LoginBox>
			<input name="account" value={loginForm.account} onChange={ev => this.inputChanged(ev)}/>
			<input name="password" value={loginForm.password} onChange={ev => this.inputChanged(ev)}/>
			<button onClick={()=>this.toLogIn()}>
				登录
			</button>
			<br/>
			<p>
				{`未登录 - ${logInfo.requestAt}`}
			</p>
		</cpnt.LoginBox>
		const userInfo = <cpnt.LoginBox>
			<p className="user-info" >
				用户：<em>{logInfo.account}</em>
				&emsp;
				登录于：<em>{logInfo.loginAt}</em>
			</p>
			<button onClick={()=>this.logOut()}>
				退出
			</button>
		</cpnt.LoginBox>
		if (logInfo.account) return userInfo;
		return logInForm;
	}
	render(){
		return <div className="center-box" >
			<cpnt.coverImg src={cover} />
			{this.getLogInBar()}
			<cpnt.footer className="be-center">
				网站备案/许可证号：陕ICP备20008324号
			</cpnt.footer>
		</div>
	}
	async componentDidMount(){
		this.getSession();
	}
}

