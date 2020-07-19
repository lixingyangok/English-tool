import React from "react";
import * as cpnt from "./style/my-tool-style.js";
import {Spin, Input, Popconfirm} from "antd";
import coreFn from "./js/core-fn.js";
import keyDownFn from "./js/key-down-fn.js";
import MouseFn from './js/mouse-fn.js';
import fileFn from './js/file-fn.js';
import Nav from './children/menu/menu.jsx';
// import {fileToBuffer} from 'assets/js/pure-fn.js';

const { TextArea } = Input;
const MyClass = window.mix(
	React.Component, coreFn, keyDownFn, MouseFn, fileFn,
);
const oFirstLine = new coreFn().fixTime({start: 0.1, end: 5});

export default class Tool extends MyClass {
	oAudio = React.createRef();
	oCanvas = React.createRef();
	oPointer = React.createRef();
	oWaveWrap = React.createRef();
	oTextArea = React.createRef();
	oSententList = React.createRef();
	state = {
		buffer: {}, //音频数据
		aPeaks: [], //波形数据
		oFirstLine, //默认行
		fileName: "", //文件名
		fileSrc: "", //文件地址
		iHeight: 0.3, // 波形高
		iCanvasHeight: cpnt.iCanvasHeight, //画布高
		iPerSecPx: 55, //人为定义的每秒宽度
		fPerSecPx: 55, //实际算出每秒像素数
		drawing: false, //是否在绘制中（用于防抖
		loading: false, //是否在加载中（解析文件
		playing: false, //储存播放的定时器setInterval的返回值
		aSteps: [{ //历史记录
			iCurLine: 0, // 当前所在行
			aLines: [oFirstLine.dc_], //字幕
		}],
		iCurStep: 0, //当前步骤
		oTarget: {}, // 故事信息如：故事id、章节id
		oStoryTB: {}, // 表-存故事
		oSectionTB: {}, // 表-存章节
		oStory: {}, // DB中的【故事】
		oSct: {}, // DB中的【章节】
		aWords: [], //DB中的【单词】
		sTyped: '', //已经输入的，用于搜索
	};
	constructor(props) {
		super(props);
		const oTarget = (()=>{
			const {search} = props.location;
			if (!search) return {};
			return search.slice(1).split('&').reduce((result, cur)=>{
				const [key, val] = cur.split('=');
				return {...result, [key]: val};
			}, {});
		})();
		const [oStoryTB, oSectionTB] = (()=>{
			const theDB = new window.Dexie("myDb");
			theDB.version(1).stores({stories: '++id, name'});
			theDB.version(2).stores({sections: '++id, idx, parent'});
			return [theDB.stories, theDB.sections];
		})();
		const loading = !!oTarget.storyId;
		Object.assign(this.state, {oStoryTB, oSectionTB, oTarget, loading});
		if (oTarget.storyId) this.init(oTarget);
	}
	render() {
		const {
			aSteps, iCurStep, iCanvasHeight,
			fileSrc, fPerSecPx, sTyped, buffer, loading,
		} = this.state;
		const {aLines, iCurLine} = aSteps[iCurStep];
		return <cpnt.Div>
			<audio src={fileSrc} ref={this.oAudio}/>
			<Spin spinning={loading} size="large"/>
			<cpnt.WaveBox>
				<canvas height={iCanvasHeight} ref={this.oCanvas}/>
				<cpnt.WaveWrap ref={this.oWaveWrap} onScroll={() => this.onScrollFn()}>
					<cpnt.LongBar style={{width: `${fPerSecPx * buffer.duration}px`}}
						onContextMenu={ev => this.clickOnWave(ev)} onMouseDown={ev=>this.mouseDownFn(ev)}
					>
						{this.getMarkBar(this.state)}
						{this.getRegions(this.state)}
					</cpnt.LongBar>
				</cpnt.WaveWrap>
			</cpnt.WaveBox>
			<Nav commander={(sFnName, ...aRest)=>this.commander(sFnName, aRest)} />
			{this.getInfoBar(this.state)}
			<cpnt.HistoryBar>
				{aSteps.map((cur,idx)=>{
					return <span key={idx} className={iCurStep === idx ? 'cur' : ''} />
				})}
			</cpnt.HistoryBar>
			<cpnt.TextareaWrap>
				{(() => {
					return <TextArea id="myTextArea" ref={this.oTextArea}
						value={aLines[iCurLine].text}
						onChange={ev => this.valChanged(ev)}
						onKeyDown={ev => this.enterKeyDown(ev)}
					/>;
				})()}
			</cpnt.TextareaWrap>
			{this.getWordsList(sTyped)}
			<cpnt.SentenceWrap ref={this.oSententList}>
				{aLines.map((cur, idx) => {
					return <li className={`one-line ${idx === iCurLine ? "cur" : ""}`}
						key={idx} onClick={() => this.goLine(idx)}
					>
						<i className="idx" style={{width: `${String(aLines.length || 0).length}em`}} >
							{idx + 1}
						</i>
						<span className="time">
							<em>{cur.start_}</em>&nbsp;-&nbsp;<em>{cur.end_}</em>
						</span>
						<p className="the-text" >{cur.text}</p>
					</li>;
				})}
			</cpnt.SentenceWrap>
		</cpnt.Div>;
	}
	// ▲render  // ▼返回dom的方法，按从上到下的顺序排列
	// ▼时间刻度
	getMarkBar({fPerSecPx}){
		const myArr = [];
		let [nowSec, endSec] = this.getArea();
		while (nowSec < endSec) {
			const minute = ~~(nowSec / 60);
			const second = nowSec < 60 ? nowSec : nowSec % 60;
			const is10Times = nowSec % 10 === 0;
			const className = 'one-second ' + (is10Times ? 'ten-times' : '');
			myArr.push(
				<span className={className} key={nowSec} style={{left: nowSec * fPerSecPx + "px"}}>
					<b className="mark"/>
					{(()=>{
						if (minute && second === 0) return `${minute}'0`; //分钟
						if (fPerSecPx > 100) return `${minute}'${second}`;
						if (fPerSecPx > 50) return `${second}`;
						if (is10Times) return `${minute}'${second}`; //如果每秒太窄-仅在几十秒的时候显示
					})()}
				</span>
			);
			nowSec++;
		}
		return <cpnt.MarkWrap>{myArr}</cpnt.MarkWrap>;
	}
	// ▼句子区间
	getRegions({playing, aSteps, iCurStep, fPerSecPx}){
		const myArr = [];
		let [nowSec, endSec] = this.getArea();
		const {aLines, iCurLine} = aSteps[iCurStep];
		for (let idx = 0, len = aLines.length; idx < len; idx++){
			const {end, start, long} = aLines[idx];
			const IsShow = end > nowSec || end > endSec;
			if (!IsShow) continue;
			myArr.push(
				<span key={idx} className={idx === iCurLine ? "cur region" : "region"}
					style={{left: `${start * fPerSecPx}px`, width: `${long * fPerSecPx}px`}}
				>
					<span className="idx">{idx + 1}</span>
				</span>
			)
			if (end > endSec) break;
		}
		const oPointer = <i ref={this.oPointer} className={"pointer " + (playing ? 'playing' : '')}/>;
		return <cpnt.RegionWrap>{oPointer}{myArr}</cpnt.RegionWrap>
	}
	// ▼故事信息等
	getInfoBar({oStory, oSct, buffer, iPerSecPx}){ 
		if (!Object.keys(oSct).length) return;
		const {aLines=[], audioFile={}, srtFile={}} = oSct;
		return <cpnt.InfoBar>
			<span>故事：{oStory.name}</span>
			<span>音频：{audioFile.name}</span>
			<span>时长：{buffer.sDuration_}</span>
			<span>字幕：{srtFile.name || '无'}</span>
			<span>共计：{aLines.length || 0}句</span>
			<span>每秒：{iPerSecPx}px</span>
		</cpnt.InfoBar>
	}
	// ▼提示单词
	getWordsList(sTyped='', getArr=false){
		sTyped = sTyped.toLocaleLowerCase().trim();
		const {aWords=[]} = this.state;
		const aMatched = (()=>{
			if (!sTyped) return aWords;
			const aFiltered = aWords.filter(cur => cur.toLocaleLowerCase().startsWith(sTyped));
			return aFiltered.slice(0, 9); //最多9个，再多也没法按数字键去选取
		})();
		if (getArr) return aMatched;
		const arr = aMatched.map((cur, idx)=>{
			const Idx = sTyped ? <i className="idx">{idx+1}</i> : null;
			return <Popconfirm title="确定删除？" okText="删除" cancelText="取消" placement="topLeft"
				onConfirm={()=>this.delWord(cur)} key={idx}
			>
				{Idx}
				<mark className="word">{sTyped}</mark>
				<em className="word">{cur.slice(sTyped.length)}</em>
			</Popconfirm>
		});
		return <cpnt.Words>{arr}</cpnt.Words>;
	}
	// ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
	// ▼以下是生命周期
	async componentDidMount() {
		this.cleanCanvas();
		const oWaveWrap = this.oWaveWrap.current;
		oWaveWrap.addEventListener( //注册滚轮事件
			"mousewheel", ev => this.wheelOnWave(ev), {passive: false},
		);
		const pushFiles = this.pushFiles.bind(this);
		document.onkeydown = this.keyDowned.bind(this);
		document.addEventListener("drop", pushFiles);		// ▼拖动释放
		document.addEventListener("dragleave", pushFiles);	// ▼拖动离开（未必会执行
		document.addEventListener("dragenter", pushFiles);	// ▼拖动进入
		document.addEventListener("dragover", pushFiles);	// ▼拖动进行中
	}
	// ▼销毁前
	componentWillUnmount(){
		// this.setState = (state, callback) => {return};
		// ReactDOM.unmountComponentAtNode(document.getElementById("tool"));
		this.setState = (state, callback) => null;
	}
	async init({storyId, sctId}){
		const {oStoryTB, oSectionTB, aSteps} = this.state;
		const [oStory, oSct] = await Promise.all([
			oStoryTB.get(storyId*1), oSectionTB.get(sctId*1),
		]);
		if (!oStory || !oSct) return;
		const buffer = {
			...oSct.buffer,
			aChannelData_: await oSct.buffer.oChannelDataBlob_.arrayBuffer().then(res=>new Int8Array(res)),
		};
		const [{aWords=[]}, loading] = [oStory, false];
		const fileSrc = URL.createObjectURL(oSct.audioFile);
		if (oSct.aLines.length) aSteps.last_.aLines = oSct.aLines; //字幕
		this.setState({fileSrc, buffer, aSteps, oStory, oSct, aWords, loading});
		this.bufferToPeaks();
	}
	// ▼音频数据转换波峰数据
	bufferToPeaks(perSecPx_, leftPoint = 0) {
		const oWaveWrap = this.oWaveWrap.current;
		const {offsetWidth, scrollLeft} = oWaveWrap || {};
		const {buffer, iPerSecPx} = this.state;
		if (!buffer || !oWaveWrap) return;
		const obackData = this.getPeaks(
			buffer, (perSecPx_ || iPerSecPx), scrollLeft, offsetWidth,
		);
		this.setState({ ...obackData });
		this.toDraw();
		return obackData.aPeaks;
	}
}
