/*
 * @Author: 李星阳
 * @Date: 2021-01-31 18:34:35
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-02-15 16:31:22
 * @Description: 
 */

import React from 'react';
import pageFn from './js/story-info-fn.js';
import * as cpnt from './style/story-info.js';
import FileFn from './js/file-fn.js';
import {MyContext} from 'pages/learning-page/learning-page.jsx';
import DictDialog from 'common/components/dict-dialog/dict-dialog.jsx';
import {MyLoading} from 'common/components/loading/loading02.jsx';
import {timeAgo} from 'common/js/common.js';
import {
	Button, Popconfirm, message, Table, Popover,
	Divider, Modal,
} from 'antd';

const { Column } = Table;

const MyClass = window.mix(
	React.Component,
	pageFn,
	FileFn,
);

export default class extends MyClass {
	static contextType = MyContext;
	message = message;
	oldContext = {};
	state = {
		visible: false, // 单词气泡可见性
		sPopWords: '', // 弹出气泡的词汇
		sSearching: '', // 搜索词汇
		oQueuer: {}, // 排队上传的媒体
		oStory: {}, // 故事信息
		aMedia: [], // 媒体列表
		sLoadingAction: '', // 加载事项
		tipForChoseSrt: null, // 
		oDownLoading: {}, //正在下载的字幕信息
	}
	// constructor(props) {
	// 	super(props);
	// }
	getWrodsList(sWords, sKey){
		if (!sWords.length) return '无';
		const aWords = sWords.split(',');
		const handleVisibleChange = (sPopWords) => {
			this.setState({sPopWords});
		};
		const aResult = aWords.map((sOneWord, idx)=>{
			const btn = <div>
				<h2>{sOneWord}</h2>
				<Button size="small" onClick={()=>this.searchWord(sOneWord)}>
					搜索
				</Button>
				<Button size="small" onClick={()=>this.copyWord(sOneWord)}>
					复制
				</Button>
				<Button size="small" onClick={()=>this.switchWord(sKey, sOneWord)}>
					切换
				</Button>
				<Button size="small" onClick={()=>this.delWord(sKey, sOneWord)}>
					删除
				</Button>
			</div>
			// title={sOneWord}
			const result = <Popover trigger="hover" placement="topLeft"
				key={idx} content={btn}
				visible={this.state.sPopWords === sOneWord}
				onVisibleChange={newVal=>handleVisibleChange(newVal ? sOneWord : '')}
			>
				<span>{sOneWord}, </span>
			</Popover>
			return result;
		});
		return aResult;
	}
	getInfoBox(){
		const {oStory, aMedia} = this.state;
		const {CreatedAt, words='', names=''} = oStory;
		const sTime = new Date(CreatedAt).toLocaleString();
		const wordsLength = words.split(',').filter(Boolean).length;
		const namesLength = names.split(',').filter(Boolean).length;
		const part01 = <>
			<h1>{oStory.storyName}</h1>
			<div className="story-info">
				<span>创建时间：{sTime}</span>&emsp;&emsp;
				<span>媒体数量：{aMedia.length}</span>&emsp;&emsp;
				操作：
				<label className="btn">
					导入文件
					<input type="file" multiple="multiple" style={{display: 'none'}}
						onChange={ev => this.toCheckFile(ev, oStory)}
					/>
				</label>
			</div>
			<div>备注：{oStory.note || '无'}</div>
		</>;
		const oHtml = <cpnt.infoBox>
			{part01}
			<cpnt.myHr/>
			<cpnt.wordsBar>
				词汇共计 {namesLength + wordsLength} 个
			</cpnt.wordsBar>
			<cpnt.wordsBar>
				专有名词（人名、地名等） {namesLength} 个：
				{this.getWrodsList(names, "names")}
			</cpnt.wordsBar>
			<cpnt.wordsBar>
				重点词汇（生词，关注词） {wordsLength} 个：
				{this.getWrodsList(words, "words")}
			</cpnt.wordsBar>
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
				<br/>
				<Button type="text" size="small" onClick={()=>this.toExport(oMedia)}>
					导出字幕
				</Button>
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
			<Column title="修改时间" key="address" 
				render={oMedia=>{
					const {subtitleFileModifyTs: ts} = oMedia;
					if (!ts) return '';
					const HTML = <>
						{new Date(ts).toLocaleString()}<br/>
						{timeAgo(ts)}
					</>
					return HTML;
				}}
			/>
			<Column title="操作" key="action" width="215px"
				render={oMedia => getBtn(oMedia)}
			/>
		</Table>;
	}
	choseSubmitModal(){
		const {tipForChoseSrt} = this.state;
		const closeFn = ()=>this.setState({tipForChoseSrt: null});
		const HTML = <Modal title="请选择" footer={null}
			visible={!!tipForChoseSrt}
			onCancel={closeFn}
		>
			{tipForChoseSrt}
			<br/><br/>
			<div style={{textAlign: 'center'}} >
				<Button size="small" onClick={closeFn}>
					关闭
				</Button>
				<Button size="small" onClick={()=>this.downloadSrtFileFn(1)} >
					下载网上字幕
				</Button>
				<Button size="small" onClick={()=>this.downloadSrtFileFn(2)} >
					下载本地字幕
				</Button>
			</div>
        </Modal>
		return HTML;
	}
	render(){
		const {sLoadingAction, sSearching, aMedia} = this.state;
		const resultHTML = <cpnt.outer className="">
			<MyLoading {...{sLoadingAction}}/>
			{this.getInfoBox()}
			{this.showTheFileListReadyForUpload()}
			{this.getTable()}
			<DictDialog word={sSearching} />
			<Divider plain>共 {aMedia.length} 条音频</Divider>
			{this.choseSubmitModal()}
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
		const {oldContext={}, context={}} = this;
		const {UpdatedAt: UpdatedAtNew, ID} = context.oStoryInfo || {};
		const {UpdatedAt: UpdatedAtOld } = oldContext.oStoryInfo || {};
		if (UpdatedAtNew && UpdatedAtNew !== UpdatedAtOld){
			this.setState({oStory: context.oStoryInfo});
		}
		if (ID && (ID !== oldContext.oStoryInfo.ID)){
			this.getMediaForOneStory(ID);
		}
		this.oldContext = context;
	}
}
