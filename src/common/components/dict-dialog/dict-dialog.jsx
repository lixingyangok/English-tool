import React, {useState} from "react";
import { Modal, Button } from 'antd';
import styled from 'styled-components';

const MyIframe = styled.iframe`
	width: 100%; 
	height: calc(100vh - 135px);
	border: none;
	margin: 0 auto -10px;
`;

export default function (props){
	const {word} = props;
	const [visible, setVisible] = useState(false);
	const src = `http://www.iciba.com/word?w=${word}`;
	const openIt = ()=>{
		window.open(src, '_blank');
	};
	// ▼生命周期
	React.useEffect(()=>{
		setVisible(!!word);
	}, [word]);
	const HTML = <Modal maskClosable closable width="98vw" footer={null}
		style={{top: 20}} visible={visible}
		onCancel={()=>setVisible(false)}
	>
		<div>
			<Button onClick={openIt} size="small">
				新窗口打开
			</Button>
		</div>
		<br/>
		{word ? <MyIframe src={src} /> : null}
	</Modal>;
	return HTML;
}
