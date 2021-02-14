import {message} from 'antd';
const {axios, store} = window;

export default class {
	inputChanged({target}){
		// console.log('ev', target)
		const {loginForm} = this.state;
		loginForm[target.name] = target.value;
		this.setState({loginForm});
	}
	async toLogIn(){
		const {loginForm} = this.state;
		// const testing = location.host.startsWith('localhost');
		if (!loginForm.account || !loginForm.password) {
			loginForm.account = store.get('account') || '';
			loginForm.password = store.get('password') || '';
		}
		const {data} = await axios.post('/open/login', loginForm);
		if (data && data.loginAt) {
			message.success('已登录');
			return this.getSession();
		}
		message.warning(data);
	}
	async logOut(){
		const {data} = await axios.get('/open/logout');
		if (!data) return;
		message.success('已退出');
		this.getSession();
	}
	async getSession(){
		const {data} = await axios.get('/open/session');
		this.setState({logInfo: data || {}});
	}
}


