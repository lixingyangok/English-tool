/*
 * @Author: 李星阳
 * @Date: 2021-01-31 18:34:35
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-01-31 19:50:26
 * @Description: 
 */

import React from 'react';
import pageFn from './js/story-info-fn.js';
import * as cpnt from './style/story-info.js';
import {Button} from 'antd';

const MyClass = window.mix(
	React.Component,
	pageFn,
);

export default class extends MyClass {
	state = {
		visible: false, //窗口显示
		oStoryTB: {}, // 本地故事列表TB
		oMediaTB: {}, // 本地媒体列表TB
		oQueuer: {}, // 排队上传的媒体
		loading: false,
		pageInfo: {
			current: 1,
			pageSize: 10,
		},
		total: 0,
		// ▼新
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
	getInfoBox(){
		const {oStory} = this.state;
		const oHtml = <cpnt.infoBox>
			{oStory.storyName}
		</cpnt.infoBox>
		return oHtml;
	}
	render(){
		// const {oStory} = this.state;
		const resultHTML = <div className="center-box">
			{this.getInfoBox()}
			<br/>
			{this.getMediaList()}
		</div>
		return resultHTML;
	}
	// ▲render
	// ▼生命周期
	async componentDidMount(){
		console.log('componentDidMount');
	}
}
