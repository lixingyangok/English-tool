import React, {useState} from "react";
import { Modal, Button } from 'antd';
import * as cpnt from './style/dict-dialog.js';


const aDict = [{
	name: '剑桥',
	getUrl: word => `https://dictionary.cambridge.org/us/dictionary/english/${word}`,
},{
	name: '朗文(新窗口)',
	getUrl: word => {
		const url = `https://www.ldoceonline.com/dictionary/${word}`;
		window.open(url, '_blank');
		return;
	},
},{
	name: '百度(新窗口)',
	getUrl: word => {
		const url = `https://fanyi.baidu.com/#en/zh/${word}`;
		window.open(url, '_blank');
		return;
	},
},{
	name: '有道',
	getUrl: word => `http://dict.youdao.com/w/${word}`,
},{
	name: '金山',
	getUrl: word => `http://www.iciba.com/word?w=${word}`,
}];

export default function (props){
	const {word} = props;
	const [visible, setVisible] = useState(false);
	const [dictIdx, setDictIdx] = useState(0);
	const [src, setSrc] = useState('');
	const changeDict = idx =>{
		const newSrc = aDict[idx].getUrl(word);
		if (!newSrc) return;
		if (idx===dictIdx) return window.open(newSrc, '_blank');
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
	const HTML = <Modal maskClosable closable width="calc(100vw - 35px)" footer={null}
		style={{top: 20, paddingBottom: 0}} visible={visible}
		onCancel={()=>setVisible(false)}
	>
		<cpnt.titleBar>
			<cpnt.wordName title={word}>
				{word}
			</cpnt.wordName>
			{aDictArr}
		</cpnt.titleBar>
		{word ? <cpnt.MyIframe src={src} /> : null}
	</Modal>;
	return HTML;
}
