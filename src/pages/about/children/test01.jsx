import React from 'react';
import styled from 'styled-components';

const Div = styled.div`
	border: solid 1px #aaa;
	padding: 35px;
	button{
		margin-left: 20px;
	}
	textarea{
		width: 100%;
		height: 080px;
	}
`;

export default class extends React.Component {
	v01 = 1;
	state = {
		v02: 1,
		v03: 1,
		txt: '默认文字',
	}
	constructor(props){
		super(props);
		this.txtChangeFn = this.txtChangeFn.bind(this);
	}
	changeV01(){
		// 这个方法没有修改 state 不会触发视图更新
		this.v01++;
		console.log('新值', this.v01);
	}
	changeV02(sKeyName){
		this.setState({
			[sKeyName]: this.state[sKeyName] + 1,
		});
		console.log(`${sKeyName} - 新值`, this.state[sKeyName]);
	}
	txtChangeFn(ev){
		const txt = ev.target.value;
		this.setState({txt});
	}
	render(){
		console.log('render');
		const HTML = <Div>
			<p>
				值01：{this.v01} 
				<button onClick={()=>this.changeV01()} >
					v01值+1
				</button>
			</p>
			<p>
				值02：{this.state.v02} 
				<button onClick={()=>this.changeV02('v02')} >
					v02值+1
				</button>
			</p>
			<p>
				值03：这个值在 state 声明，但不显示出来
				<button onClick={()=>this.changeV02('v03')} >
					v03值+1
				</button>
			</p>
			<textarea value={this.state.txt} onChange={this.txtChangeFn}>
				{/*  */}
			</textarea>
		</Div>
		return HTML;
	}
}