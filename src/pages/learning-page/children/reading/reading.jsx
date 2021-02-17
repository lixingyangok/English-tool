/*
 * @Author: 李星阳
 * @Date: 2021-02-15 21:00:05
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-02-17 09:12:23
 * @Description: 
 */

import React from "react";
import {Fn01} from './js/reading.js';
import {readingPath} from 'components/navigation/js/navigation.js';
import * as cpnt from './style/reading.style.js';

// import {getOneMedia, getSubtitle} from 'assets/js/learning-api.js';
// import {trainingDB} from 'assets/js/common.js';
// const {media: mediaTB} = trainingDB;
const MyClass = window.mix(
	React.Component, Fn01,
);


export default class Reading extends MyClass{
	oAudio = React.createRef();
	state = {
		mediaId: null,
		oMedia: {},
		fileSrc: null,
		curLine: 0,
		aSubtitle: [],
		timer: null,
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
	render(){
		const {oAudio} = this;
		const {fileSrc, mediaId, curLine, oMedia, aSubtitle} = this.state;
		const oCurLine = aSubtitle[curLine] || {};
		const HTML = <div className="center-box" >
			{mediaId}
			<br/><br/>
			<div>
				<video controls src={fileSrc} ref={oAudio} >
					{/* <source /> */}
				</video>
				<p className="subtitle" data-text={oCurLine.text}>
					{oCurLine.text}
				</p>
			</div>
			阅读：{mediaId}<br/>
			{oMedia.fileName}
			<br/>
			<hr/>
			{aSubtitle.map((cur, idx)=>{
				return <cpnt.oneLine key={idx} 
				className={idx===curLine ? 'current' : ''}
					onClick={()=>this.toPlay(idx)}
				>
					{cur.text}
				</cpnt.oneLine>
			})}
		</div>
		return HTML;
	}
	async componentDidMount() {
		const keyDownFn = this.keyDownFn.bind(this);
		document.addEventListener('keydown', keyDownFn);
		this.props.history.listen(oRoute => { // bj监听路由变化
			const {pathname} = oRoute;
			const hasLeft = !pathname.includes(`/${readingPath}/`);
			const type = hasLeft ? 'removeEventListener' : 'addEventListener';
			document[type]('keydown', keyDownFn);
		});
	}
}

