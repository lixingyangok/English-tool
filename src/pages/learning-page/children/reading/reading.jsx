/*
 * @Author: 李星阳
 * @Date: 2021-02-15 21:00:05
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-02-21 17:51:38
 * @Description: 
 */

import React from "react";
import {Fn01} from './js/reading.js';
import {readingPath} from 'components/navigation/js/navigation.js';
import * as cpnt from './style/reading.style.js';
import DictDialog from 'components/dict-dialog/dict-dialog.jsx';
import {MyContext} from 'pages/learning-page/learning-page.jsx';

// import {getOneMedia, getSubtitle} from 'assets/js/learning-api.js';
// import {trainingDB} from 'assets/js/common.js';
// const {media: mediaTB} = trainingDB;
const MyClass = window.mix(
	React.Component, Fn01,
);

export default class Reading extends MyClass{
	static contextType = MyContext;
	oAudio = React.createRef();
	state = {
		mediaId: 0, // 媒体id
		oMedia: {}, // 媒体信息
		fileSrc: null, // 媒体src，用于播放
		aSubtitle: [], // 字幕
		// ▲稳定数据，▼变动数据
		curLine: 0, // 当前高亮行
		iPlaying: null, // 当前播放行
		timer: null, // 定时器
		fPlayRate: 0, // 0-100
		sSearching: '',
		// ▼长按阅读
		iStartTs: 0, //开始时间
		isKeyPressing: false, // true 表示正按着键
	};
	constructor(props){
		super(props);
		const {match} = props;
		// console.log(match, history);
		const {params={}} = match;
		const mediaId = params.mediaId * 1;
		if (!mediaId) return;
		this.state.mediaId = mediaId;
		this.init(mediaId);
	}
	getMediaPlayer(){
		const {oAudio} = this;
		const { fileSrc } = this.state;
		const HTML = <cpnt.mediaWrap>
			<video controls src={fileSrc} ref={oAudio} >
			</video>
			{/* <p className="subtitle" data-text={oCurLine.text}>
				{oCurLine.text}
			</p> */}
		</cpnt.mediaWrap>;
		return HTML;
	}
	getAllLines(){
		const { curLine, aSubtitle, iPlaying,  fPlayRate} = this.state;
		const aAllLine = aSubtitle.map((cur, idx)=>{
			const {text} = cur; 
			const textVal = (()=>{
				if (iPlaying !== idx) return '';
				const end = ~~(text.length / 100 * fPlayRate);
				return text.slice(0, end);
			})();
			const lineClass = (()=>{
				let result = idx === curLine ? 'current ' : '';
				if (iPlaying === idx && fPlayRate>=100) {
					result += ' done';
				}
				return result;
			})();
			return <cpnt.oneLine key={idx}
				onClick={()=>this.setState({curLine:idx})}
				className={lineClass}
			>
				<i className="idx" >{idx+1}</i>
				<div className={"text"} >
					<p className={'support'}>{text}</p>
					<p className={'bg'} text={textVal}></p>
					<p className='cover' >{text}</p>
				</div>
			</cpnt.oneLine>
		})
		return <ul> {aAllLine} </ul>
	}
	render(){
		const { oMedia, sSearching } = this.state;
		const HTML = <cpnt.outer className="" >
			{this.getMediaPlayer()}
			<hr/>
			<cpnt.mediaTitle>
				{oMedia.fileName}
			</cpnt.mediaTitle>
			{this.getAllLines()}
			<DictDialog word={sSearching} />
		</cpnt.outer>
		return HTML;
	}
	async componentDidMount() {
		const keyDownFn = this.keyDownFn.bind(this);
		const keyUpFn = this.keyUpFn.bind(this);
		document.addEventListener('keydown', keyDownFn);
		document.addEventListener('keyup', keyUpFn);
		this.props.history.listen(oRoute => { // bj:监听路由变化
			const {pathname} = oRoute;
			const hasLeft = !pathname.includes(`/${readingPath}/`);
			const type = hasLeft ? 'removeEventListener' : 'addEventListener';
			document[type]('keydown', keyDownFn);
			document[type]('keyup', keyUpFn);
		});
	}
}

