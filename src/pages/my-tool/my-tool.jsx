import React from "react";
import * as cpnt from "./style/my-tool-style.js";
import {Spin, Input, Popconfirm} from "antd";
import coreFn from "./js/core-fn.js";
import keyDownFn from "./js/key-down-fn.js";
import MouseFn from './js/mouse-fn.js';
import fileFn from './js/file-fn.js';
import wordsDbFn from './js/words-db.js';
import Nav from './children/menu/menu.jsx';
import {Modal, Button, Upload, message} from 'antd';

const { TextArea } = Input;
const { confirm } = Modal;

const MyClass = window.mix(
	React.Component, coreFn, keyDownFn, MouseFn, fileFn, wordsDbFn,
);
const oFirstLine = new coreFn().fixTime({start: 0.1, end: 5});

export default class Tool extends MyClass {
	message= message;
	confirm = confirm;
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
		iPerSecPx: 60, //人为定义的每秒宽度
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
		oWordsDB: {}, //词库
		oStory: {}, // DB中的【故事】
		oSct: {}, // DB中的【章节】
		sTyped: '', //已经输入的，用于搜索
		aWords: [], //DB中的【单词】
		aMatched: [], //与当前输入匹配到的单词
		visible: false,
		aWordsDBState: [],
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
		const loading = !!oTarget.storyId; //有id就loading
		const [oStoryTB, oSectionTB, oWordsDB] = (()=>{
			const theDB = new window.Dexie("myDb");
			const oWordsDB = new window.Dexie("wordsDB");
			theDB.version(1).stores({stories: '++id, name'});
			theDB.version(2).stores({sections: '++id, idx, parent'});
			return [theDB.stories, theDB.sections, oWordsDB];
		})();
		Object.assign(
			this.state,
			{oStoryTB, oSectionTB, oTarget, loading, oWordsDB},
		);
		if (oTarget.storyId) this.init(oTarget);
		this.checkWordsDB(oWordsDB);
	}
	render() {
		const {
			aSteps, iCurStep, iCanvasHeight,
			fileSrc, fPerSecPx, buffer, loading, oSct,
		} = this.state;
		const {aLines, iCurLine} = aSteps[iCurStep];
		const isVideo = oSct.audioFile && oSct.audioFile.type.includes('video/');

		return <cpnt.Container>
			<Spin spinning={loading} size="large"/>
			<cpnt.MediaAndWave>
				<cpnt.VideoWrap className={(isVideo ? 'show' : '') + ' left'}>
					<video src={fileSrc} name="controls"
						ref={this.oAudio} className="video"
					/>
					<p className="subtitle" data-text={aLines[iCurLine].text}>
						{aLines[iCurLine].text}
					</p>
				</cpnt.VideoWrap>
				<div className="right">
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
						<TextArea id="myTextArea" ref={this.oTextArea}
							value={aLines[iCurLine].text}
							onChange={ev => this.valChanged(ev)}
							onKeyDown={ev => this.enterKeyDown(ev)}
						/>
					</cpnt.TextareaWrap>
					{this.getWordsList(this.state)}
				</div>
			</cpnt.MediaAndWave>
			{/* 分界 */}
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
			{this.getDialog(this.state)}
		</cpnt.Container>;
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
	getInfoBar({oStory, oSct, buffer, iPerSecPx, aSteps, iCurStep}){ 
		const oCurStep = aSteps[iCurStep];
		if (!Object.keys(oSct).length) return;
		const {audioFile={}} = oSct;
		return <cpnt.InfoBar>
			<span>故事：{oStory.name}</span>
			<span>音频：{audioFile.name}</span>
			<span>时长：{buffer.sDuration_}</span>
			<span>共计：{oCurStep.aLines.length || 0}句</span>
			<span>每秒：{iPerSecPx}px</span>
		</cpnt.InfoBar>
	}
	// ▼提示单词
	getWordsList({aMatched, aWords, sTyped}){
		const arr = aMatched.map((cur, idx)=>{
			const Idx = sTyped ? <i className="idx">{idx+1}</i> : null;
			const isInDb = aWords.find(curWord => curWord.toLowerCase() === cur.toLowerCase());
			return <Popconfirm title="确定删除？" okText="删除" cancelText="取消" placement="topLeft"
				onConfirm={()=>this.delWord(cur)} key={idx}
				className={isInDb ? 'in-db' : ''}
			>
				{Idx}
				<mark className="word">{sTyped}</mark>
				<em className="word">{cur.slice(sTyped.length)}</em>
			</Popconfirm>
		});
		return <cpnt.Words>
			{arr}
		</cpnt.Words>;
	}
	getDialog({aWords, aWordsDBState}){
		const arr = aWords.sort().map((cur, idx)=>{
			return <Popconfirm title="确定删除？" okText="删除" cancelText="取消" placement="topLeft"
				onConfirm={()=>this.delWord(cur)} key={idx}
			>
				<span className="one-word">{cur}</span>
			</Popconfirm>
		});
		const noWrods = <p className="no-words">暂无单词</p>;
		const isWordsDBOK = aWordsDBState.every(Boolean);
		return <Modal title="单词库"
			visible={this.state.visible} footer={null}
			onCancel={()=>this.setState({visible: false})}
		>	
			<cpnt.WordsDialog>
				<div className="btn-bar">
					<Button onClick={()=>this.initWordsDB()} type={isWordsDBOK && "primary"}>
						{isWordsDBOK ? '词库已经初始化' : '初始化单词库'}
					</Button>
					<Upload type="primary" beforeUpload={file=>this.beforeUpload(file)} >
						<Button>导入</Button>
					</Upload>
					<Button onClick={()=>this.exportWods()}>导出</Button>
					<Button onClick={()=>this.cleanWordsList()}>清空</Button>
				</div>
				<div className="words-list">
					{arr.length ? arr : noWrods}
				</div>
			</cpnt.WordsDialog>
		</Modal>;
	}
	// ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
	// ▼以下是生命周期
	async componentDidMount() {
		this.cleanCanvas();
		const oWaveWrap = this.oWaveWrap.current;
		const oAudio = this.oAudio.current;
		oWaveWrap.addEventListener( //注册滚轮事件
			"mousewheel", ev => this.wheelOnWave(ev), {passive: false},
		);
		oAudio.addEventListener( //注册滚轮事件
			"mousewheel", ev => this.changeVideoSize(ev), // {passive: false},
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
		document.onkeydown = xx=>xx;
	}
	// ▼主要方法等
	async init({storyId, sctId}){
		const {oStoryTB, oSectionTB, aSteps} = this.state;
		const [oStory, oSct] = await Promise.all([
			oStoryTB.get(storyId*1),
			oSectionTB.get(sctId*1),
		]);
		console.log(oSct);
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
