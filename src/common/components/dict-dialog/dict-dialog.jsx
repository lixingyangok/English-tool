import React, {useState} from "react";
import { Modal, Button } from 'antd';
import * as cpnt from './style/dict-dialog.js';

const aDict = [{
	name: '有道',
	getUrl: word => `http://dict.youdao.com/w/${word}`,
},{
	name: '金山',
	getUrl: word => `http://www.iciba.com/word?w=${word}`,
},{
	name: '剑桥',
	getUrl: word => `https://dictionary.cambridge.org/us/dictionary/english/${word}`,
},{
	name: '朗文(新窗口)',
	getUrl: word => {
		const url = `https://www.ldoceonline.com/dictionary/${word}`;
		window.open(url, '_blank');
		return;
	},
}];

export default function (props){
	const {word} = props;
	const [visible, setVisible] = useState(false);
	const [dictIdx, setDictIdx] = useState(0);
	const [src, setSrc] = useState('');
	const openIt = () => window.open(src, '_blank');
	const changeDict = idx =>{
		if (!aDict[idx].getUrl(word)) return;
		setDictIdx(idx);
	}
	// ▼生命周期
	React.useEffect(()=>{
		const srcString = aDict[dictIdx].getUrl(word);
		srcString && setSrc(srcString);
		setVisible(!!word);
	}, [word, dictIdx]);
	// ▼ HTML 
	const aDictArr = aDict.map((cur, idx)=>{
		return <Button  size="small" key={idx}
			type={idx===dictIdx ? 'primary' : ''}
			onClick={()=>changeDict(idx)}
		>
			{cur.name}
		</Button>
	});
	const HTML = <Modal maskClosable closable width="98vw" footer={null}
		style={{top: 20, paddingBottom: 0}} visible={visible}
		onCancel={()=>setVisible(false)}
	>
		<cpnt.titleBar>
			<cpnt.wordName>{word}</cpnt.wordName>
			{aDictArr}
			<Button onClick={openIt} size="small">
				新窗口打开
			</Button>
		</cpnt.titleBar>
		{word ? <cpnt.MyIframe src={src} /> : null}
	</Modal>;
	return HTML;
}
