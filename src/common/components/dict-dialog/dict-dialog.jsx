import React from "react";
import { Modal, Button } from 'antd';
import styled from 'styled-components';

const MyIframe = styled.iframe`
	width: 100%; 
	height: calc(100vh - 190px);
	border: none;
	margin: 0 auto -10px;
`;

export default function (props){
	const {switcher, word} = props;
	const src = `http://www.iciba.com/word?w=${word}`;
	const oIframe = <MyIframe src={src} />
	const openIt = ()=>{
		window.open(src, '_blank');
	};
	const HTML = <Modal maskClosable closable width="98vw" footer={null}
		style={{top: 20}}
		visible={!!word}
		onCancel={()=>switcher('')}
	>
		<div>
			{/* title={word}  */}
			<Button onClick={openIt} size="small">
				新窗口打开
			</Button>
		</div>
		<br/>
		{word ? oIframe : null}
	</Modal>;
	return HTML;
}
