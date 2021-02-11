/*
 * @Author: 李星阳
 * @Date: 2021-01-31 18:34:35
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-02-11 17:15:25
 * @Description: 
 */

import React from 'react';
import pageFn from './js/story-info-fn.js';
import * as cpnt from './style/story-info.js';
import FileFn from './js/file-fn.js';
import {MyContext} from 'pages/learning-page/learning-page.jsx';
import {
	Button, Popconfirm, message, Table, // Tag, Space, 
} from 'antd';

const { Column } = Table;

const MyClass = window.mix(
	React.Component,
	pageFn,
	FileFn,
);

export default class extends MyClass {
	static contextType = MyContext;
	oldContext = {};
	message = message;
	state = {
		visible: false, //窗口显示
		oStoryTB: {}, // 本地故事列表TB
		oMediaTB: {}, // 本地媒体列表TB
		loading: false,
		// ▼新
		oQueuer: {}, // 排队上传的媒体
		oStory: {}, // 故事信息
		aMedia: [], // 媒体列表
	}
	constructor(props) {
		super(props);
		const oTarget = this.getSearchOjb(props.location);
		const loading = !!oTarget.storyId; //有id就loading
		const [oStoryTB, oMediaTB] = (()=>{
			const trainingDB = new window.Dexie("trainingDB");
			trainingDB.version(1).stores({story: '++id, ID, name, storyId'});
			trainingDB.version(2).stores({media: '++id, ID, fileId, ownerStoryId'});
			return [trainingDB.story, trainingDB.media];
		})();
		Object.assign(this.state, {
			oStoryTB, oMediaTB, oTarget, loading,
		});
		if (!oTarget.storyId) return;
		// this.init()
	}
	getInfoBox(){
		const {oStory} = this.state;
		// const oStory = this.context;
		const oHtml = <cpnt.infoBox>
			<h1>{oStory.storyName}</h1>
			<div className="story-info">
				<span>创建时间：{oStory.CreatedAt}</span>&emsp;&emsp;
				<span>媒体数量：{oStory.kids}</span>&emsp;&emsp;
				{/* ant-btn ant-btn-primary ant-btn-sm */}
				操作：<label className="btn">
					导入文件
					<input type="file" multiple="multiple" style={{display: 'none'}}
						onChange={ev => this.toCheckFile(ev, oStory)}
					/>
				</label>
			</div>
			<div>词汇：{(oStory.words || '').replace(/,/g, ', ') || '无'}</div>
			<div>备注：{oStory.note || '无'}</div>
		</cpnt.infoBox>
		return oHtml;
	}
	// ▼陈列【待上传】的文件
	showTheFileListReadyForUpload(){
		const {oStory} = this.state;
		const aFiles = this.state.oQueuer[oStory.ID] || [];
		if (!aFiles.length) return null;
		function getSubtitleInfo(oneMedia){
			if (oneMedia.loadingStr) return <span>
				正在加载字幕 <i className="fas fa-spinner fa-spin yellow"></i>
			</span>;
			if (oneMedia.oSubtitleFile) return <span>
				{oneMedia.oSubtitleFile.name}
			</span>;
			return <span>无字幕</span>;
		}
		const myLiArr = aFiles.map((cur, idx)=>{
			const {file} = cur;
			const oLi = <li key={idx}>
				音频：{file.name}<br/>
				字幕：{getSubtitleInfo(cur)}<br/>
				<Button type="primary" size="small"
					onClick={()=>this.toUpload(oStory, cur, idx)}
				>
					上传
				</Button>
				&nbsp;
				<Button type="primary" size="small"
					onClick={()=>this.deleteOneCandidate(oStory.ID, idx)}
				>
					删除
				</Button>
			</li>;
			return oLi;
		});
		const ul = <cpnt.fileList>
			{myLiArr}
		</cpnt.fileList>
		return ul;
	}
	getTable(){
		const {oStory, aMedia} = this.state;
		const dataForTable = aMedia.map(cur=>{
			cur.key = cur.ID;
			return cur;
		});
		const getBtn = oMedia=>{
			const HTML = <>
				<Button type="text" size="small" onClick={()=>this.goDictation(oMedia)}>
					听写
				</Button>
				<Popconfirm placement="topRight" okText="确定" cancelText="取消"
					title="确定删除？"
					onConfirm={()=>this.delOneMedia(oStory, oMedia)}
				>
					<Button type="text" size="small" danger >删除</Button>
				</Popconfirm>
				<br/>
				<label className="ant-btn ant-btn-text ant-btn-sm">
					替换音/视频
					<input type="file" accept="audio/*, video/*"
						style={{display: 'none'}}
						onChange={ev => this.checkForUpload(ev, oStory, oMedia, 0)}
					/>
				</label>
				<label className="ant-btn ant-btn-text ant-btn-sm">
					替换字幕
					<input type="file" style={{display: 'none'}}
						onChange={ev => this.checkForUpload(ev, oStory, oMedia, 1)}
					/>
				</label>
			</>
			return HTML;
		}
		return <Table dataSource={dataForTable} bordered
			pagination={{position: ['none', 'none']}}
		>
			<Column title="文件" key="fileName" 
				render={oMedia=>{
					return <div>
						<em>{oMedia.fileName}</em><br/>
						<small style={{color: "#999"}} >{oMedia.subtitleFileName || '无字幕'}</small>
					</div>
				}}
			/>
			{/* <Column title="字幕" dataIndex="subtitleFileName" key="subtitleFileName" /> */}
			<Column title="修改时间" dataIndex="subtitleFileModifyStr" key="address" />
			<Column title="Tags" dataIndex="tags" key="tags"
				render={tags => ( 123 )}
			/>
			<Column title="操作" key="action"
				render={oMedia => getBtn(oMedia)}
			/>
		</Table>;
	}
	render(){
		const resultHTML = <cpnt.outer className="">
			{this.getInfoBox()}
			{/* ▼废弃？ */}
			{/* {this.showFilesOfOneStory()} */}
			{this.showTheFileListReadyForUpload()}
			{this.getTable()}
		</cpnt.outer>
		return resultHTML;
	}
	// ▲render
	// ▼生命周期
	async componentDidMount(){
		// console.log("componentDidMount");
		this.oldContext = this.context;
		const {oStoryInfo} = this.context;
		if (oStoryInfo.ID) {
			this.setState({oStory: oStoryInfo});
			console.log("查询媒体");
			this.getMediaForOneStory(oStoryInfo.ID);
		}
	}
	componentDidUpdate(){
		// console.log("componentDidUpdate");
		// console.log("this.context：\n", this.context);
		const {oldContext, context={}} = this;
		const {oStoryInfo={}} = context;
		if (oldContext.oStoryInfo !== oStoryInfo && oStoryInfo.ID) {
			console.log("查询媒体");
			this.setState({oStory: oStoryInfo});
			this.getMediaForOneStory(oStoryInfo.ID);
		}
		this.oldContext = context;
	}
}
