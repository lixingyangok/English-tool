import React from "react";
import * as cpnt from './style/menu.js';

/* 
文件：导入、导出、暂存、最近打开
编辑：撤销、恢复、查找/替换
字幕：拆分、合并、时间调整
关于
*/
export default class Menu extends React.Component{
	render(){
		const {commander} = this.props;
		const btnBar = <cpnt.BtnBar>
			<label className="btn" title="打开本地文件" >
				<i className="fas fa-folder-open"/>
				<input style={{display: 'none'}} type="file" multiple="multiple"
					onChange={ev => commander('toImport', ev)}
				/>
			</label>
			<span className="btn" title="显示词库"
				onClick={()=>commander('showWordsDialog')}
			>
				<i className="fas fa-book"/>
			</span>
			|
			<span className="btn" title="保存字幕到浏览器" 
				onClick={()=>commander('toSaveInDb')}
			>
				<i className="fas fa-save"/>
			</span>
			<span className="btn" title="导出字幕到本地" 
				onClick={()=>commander('toExport')}
			>
				<i className="fas fa-download"/>
			</span>
			<span className="btn" title="上传字幕到云"
				onClick={()=>commander('uploadToCloudBefore')}
			>
				<i className="fas fa-cloud-upload-alt"/>
			</span>
			<span className="btn" title="对比两地字幕"
				onClick={()=>commander('compareSubtitle')}
			>
				<i className="fas fa-columns"/>
			</span>
		</cpnt.BtnBar>
		return <cpnt.Header>
			{btnBar}
		</cpnt.Header>
	}
}
