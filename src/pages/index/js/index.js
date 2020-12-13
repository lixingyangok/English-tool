export default class {
	inputChanged({target}){
		// console.log('ev', target)
		const {loginForm} = this.state;
		loginForm[target.name] = target.value;
		this.setState({loginForm});
	}
	async toLogIn(){
		const {loginForm} = this.state;
		if (!loginForm.account || !loginForm.password) {
			loginForm.account = window.store.get('account') || '';
			loginForm.password = window.store.get('password') || '';
		}
		await window.axios.post('/user/login', loginForm);
		this.getSession();
	}
	async logOut(){
		await window.axios.get('/user/logout');
		this.getSession();
	}
	async getSession(){
		const res = await window.axios.get('/user/session');
		this.setState({logInfo: res || {}});
	}
	// ---------------------
	async saveTodo(val){
		console.log('提交', val)
		const res = await window.axios.post('/todolist', {
			val,
		});
		console.log('返回', res);
	}
}


