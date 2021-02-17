/*
 * @Author: 李星阳
 * @Date: 2021-02-15 21:00:05
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-02-17 15:35:46
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
		mediaId: null,
		oMedia: {},
		fileSrc: null,
		curLine: 0,
		aSubtitle: [],
		timer: null,
		iPlaying: null,
		sSearching: '',
		fPlayRate: 0, // 最大100
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
			// const playingMe = iPlaying===idx;
			const textVal = (()=>{
				if (iPlaying !== idx) return '';
				const end = ~~(cur.text.length / 100 * fPlayRate) + 1;
				return cur.text.slice(0, end);
			})();
			return <cpnt.oneLine key={idx}
				onClick={()=>this.setState({curLine:idx})}
				className={idx === curLine ? 'current ' : ''}
			>
				<i className="idx" >{idx+1}</i>
				<div className={"text "} >
					<p className={'support'}>{cur.text}</p>
					<p className={'bg'} text={textVal}></p>
					<p className={'up'} >
						{cur.text}
					</p>
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
		document.addEventListener('keydown', keyDownFn);
		this.props.history.listen(oRoute => { // bj:监听路由变化
			const {pathname} = oRoute;
			const hasLeft = !pathname.includes(`/${readingPath}/`);
			const type = hasLeft ? 'removeEventListener' : 'addEventListener';
			document[type]('keydown', keyDownFn);
		});
	}
}

