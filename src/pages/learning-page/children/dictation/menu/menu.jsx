import React from "react";
import * as cpnt from './style/menu.js';

export default class Menu extends React.Component{
	render(){
		const {commander} = this.props;
		const btnBar = <cpnt.BtnBar>
			<cpnt.Btn onClick={()=>commander('showWordsDialog')} >
				<i className="fas fa-book"/>显示词库
			</cpnt.Btn>
			<cpnt.Btn onClick={()=>commander('uploadToCloudBefore')} >
				<i className="fas fa-cloud-upload-alt"/>上传字幕到云
			</cpnt.Btn>
			<cpnt.Btn onClick={()=>commander('compareSubtitle')} >
				<i className="fas fa-columns"/>对比两地字幕
			</cpnt.Btn>
			<cpnt.Btn onClick={()=>commander('toSaveInDb')} >
				<i className="fas fa-save"/>保存字幕到浏览器
			</cpnt.Btn>
			<cpnt.Btn onClick={()=>commander('toExport')} >
				<i className="fas fa-download"/>导出字幕到本地
			</cpnt.Btn>
			<cpnt.Btn onClick={()=>commander('abc')} >
				<i className="fas fa-download"/>快捷键
			</cpnt.Btn>
		</cpnt.BtnBar>
		return <cpnt.Header>
			{btnBar}
		</cpnt.Header>
	}
}
