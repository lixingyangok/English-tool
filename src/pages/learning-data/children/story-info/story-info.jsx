/*
 * @Author: 李星阳
 * @Date: 2021-01-31 18:34:35
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-01-31 20:19:03
 * @Description: 
 */

import React from 'react';
import pageFn from './js/story-info-fn.js';
import * as cpnt from './style/story-info.js';
import FileFn from './js/file-fn.js';

import {
	Button, Space, Popconfirm, 
} from 'antd';

const MyClass = window.mix(
	React.Component,
	pageFn,
	FileFn,
);

export default class extends MyClass {
	state = {
		visible: false, //窗口显示
		oStoryTB: {}, // 本地故事列表TB
		oMediaTB: {}, // 本地媒体列表TB
		loading: false,
		pageInfo: {
			current: 1,
			pageSize: 10,
		},
		total: 0,
		// ▼新
		oQueuer: {}, // 排队上传的媒体
		oStory: {}, // 故事信息
		aMedia: [],
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
		this.init(oTarget.storyId);
		this.getMediaForOneStory(oTarget.storyId);
	}
	getInfoBox(){
		const {oStory} = this.state;
		const oHtml = <cpnt.infoBox>
			{oStory.storyName}
			<br/>
			<label className="ant-btn ant-btn-link ant-btn-sm">
				导入文件
				{/* onChange={ev => this.toCheckFile(ev, oCurStory)} */}
				<input type="file" multiple="multiple" style={{display: 'none'}}
				/>
			</label>
		</cpnt.infoBox>
		return oHtml;
	}
	getMediaList(){
		const {aMedia} = this.state;
		const aLi = aMedia.map((cur, idx)=>{
			const oLi = <li key={idx}>
				<em>{cur.fileName}</em>
				&emsp;
				<Button type="text" onClick={()=>this.goToolPage(cur)} >
					听写
				</Button>
			</li>
			return oLi;
		});
		return <ul>{aLi}</ul>
	}
	// ▼陈列【已经上传】的文件
	showFilesOfOneStory(){
		const {oStory, aMedia} = this.state.aMedia;
		if (!aMedia.length) return '暂无文件';
		const myLiArr = aMedia.map((oMedia, idx)=>{
			const oneLi= <li key={idx}>
				<h3 className="title ellipsis" >
					{oMedia.fileName}
				</h3>
				字幕：{oMedia.subtitleFileName || '元'}<br/>
				<Space className="media-btn-wrap" >

					<label className="ant-btn ant-btn-sm">
						替换音/视频
						<input type="file" accept="audio/*, video/*"
							style={{display: 'none'}}
							onChange={ev => this.checkForUpload(ev, oStory, oMedia, 0)}
						/>
					</label>
					<label className="ant-btn ant-btn-sm">
						替换字幕
						<input type="file" style={{display: 'none'}}
							onChange={ev => this.checkForUpload(ev, oStory, oMedia, 1)}
						/>
					</label>
					<Popconfirm placement="topRight" okText="确定" cancelText="取消"
						title="确定删除？"
						onConfirm={()=>this.delOneMedia(oStory, oMedia)}
					>
						<Button size="small">删除</Button>
					</Popconfirm>
				</Space>
			</li>;
			return oneLi;
		});
		const ul = <cpnt.fileList>{myLiArr}</cpnt.fileList>
		return ul;
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
		const ul = <cpnt.filesWaitToUpload>
			{myLiArr}
		</cpnt.filesWaitToUpload>
		return ul;
	}
	render(){
		// const {oStory} = this.state;
		const resultHTML = <div className="center-box">
			{this.getInfoBox()}
			<br/>
			{/* {this.getMediaList()} */}
			{this.showFilesOfOneStory()}
			{this.showTheFileListReadyForUpload()}
		</div>
		return resultHTML;
	}
	// ▲render
	// ▼生命周期
	async componentDidMount(){
		console.log('componentDidMount');
	}
}
