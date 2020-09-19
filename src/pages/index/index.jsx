import React from 'react';
import { Result, Button } from 'antd';
import * as cpnt from "./style/index.js";


export default  class IndexPage extends React.Component {
	state = {
		loginForm: {
			account: '',
			password: '',
		},
		session: "没登录",
	}
	render(){
		// const {session} = this.state;
		const { session } = this.state;
		return <div className="center-box" >
			<br/>
			<br/>
			<Result status="403"
				title="这是首页"
				subTitle="欢迎来到“哈哈学习”，你能来这里，说明你智商蛮可以！"
				extra={<Button type="primary">Back Home</Button>}
			/>
			<div>
				{session}
			</div>
			<cpnt.LoginBox>
				<input name="account" onChange={ev => this.inputChanged(ev)}/>
				<input name="password" onChange={ev => this.inputChanged(ev)}/>
				<button onClick={()=>this.toLogIn()} >
					登录
				</button>
				<button onClick={()=>this.logOut()} >
					退出
				</button>
			</cpnt.LoginBox>
			<footer className="be-center">
				网站备案/许可证号：陕ICP备20008324号
			</footer>
		</div>
	}
	async componentDidMount(){
		this.getSession();
	}
	inputChanged({target}){
		// console.log('ev', target)
		const {loginForm} = this.state;
		loginForm[target.name] = target.value;
		this.setState({loginForm});
	}
	async toLogIn(){
		const {loginForm} = this.state;
		await window.axios.post('/user/login', {
			...loginForm,
		});
		this.getSession();
	}
	async logOut(){
		await window.axios.get('/user/logout');
		this.getSession();
	}
	async getSession(){
		const res = await window.axios.get('/user/session');
		this.setState({
			session: res,
		});
	}
}

