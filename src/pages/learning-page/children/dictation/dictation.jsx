import React from "react";
import * as cpnt from "./style/dictation.style.js";
import coreFn from "./js/core-fn.js";
import keyDownFn from "./js/key-down-fn.js";
import MouseFn from './js/mouse-fn.js';
import initFn from './js/init-fn.js';
import wordsDbFn from './js/words-db.js';
import figureOutRegion from './js/figure-out-region.js';
import Menu from './menu/menu.jsx';
import {MyContext} from 'pages/learning-page/learning-page.jsx';
import { fixTime } from 'assets/js/pure-fn.js';
import DictDialog from 'components/dict-dialog/dict-dialog.jsx';
import {dictationPath} from 'components/navigation/js/navigation.js';
import {
	Modal, Button, message, Space, 
	Spin, Popconfirm, // Popover,
} from 'antd';

const { confirm } = Modal;
const oEmptyLine = fixTime({start: 0.1, end: 5}); // 考虑挂到 this 上
const aEmptySteps = [{ // 历史记录
	iCurLine: 0, // 当前所在行
	aLines: [oEmptyLine.dc_], //字幕
}];


// TODO
// textarea 的输入动效，输入后听写校对功能

const MyClass = window.mix(
	React.Component,
	coreFn, keyDownFn, MouseFn, wordsDbFn,
	figureOutRegion, initFn,
);
export default class Dictation extends MyClass {
	static contextType = MyContext;
	confirm = confirm; // 使用修饰符(static)之后后，在 constructor、componentDidMount 拿不到值
	message = message;
	// ▲外部介入，▼内部生成
	oAudio = React.createRef();
	oCanvas = React.createRef();
	oPointer = React.createRef();
	oWaveWrap = React.createRef();
	oTextArea = React.createRef();
	oTextBg = React.createRef();
	oSententList = React.createRef();
	// ▼父级下发数据
	oldContext = undefined; // 记录父级页下发的数据
	oldMediaId = undefined; // 旧的媒体id, 用于判断新旧变化
	// ▼关于输入框
	wordHoverTimer = null; // 在输入框的hover的计时器
	sOldText = ''; // 保存上次输入内容，用于对比变化
	aWordDom = []; // 把输入框背景的span保存起来，用于判断鼠标hover
	// ▼其它
	doingTimer = null; // 防抖（目前没有应用）
	oEmptyLine = oEmptyLine.dc_; // 空行
	aEmptySteps = aEmptySteps.dc_; // 空历史记录
	// ▼state
	state = {
		isDoing: false, // 用于防抖，考虑删除
		loading: false, //是否在加载中（解析文件
		visible: false, // 控制词汇弹出窗口的可见性
		aWordsDBState: [], // 考虑删除
		scrollTimer: null, // 滚动条滚动的定时器
		// ▼波形
		playing: false, //储存播放的定时器setInterval的返回值
		buffer: {}, //音频数据
		aPeaks: [], //波形数据
		iHeight: 0.3, // 波形高
		iCanvasHeight: cpnt.iCanvasHeight, //画布高
		iPerSecPx: 100, //人为定义的每秒宽度
		fPerSecPx: 100, //实际算出每秒像素数
		drawing: false, //是否在绘制中（用于防抖
		// ▼输入相关--------------------------------
		sTyped: '', //已经输入的，用于搜索
		aMatched: [], //与当前输入匹配到的单词
		aWords: [], // 考虑删除
		aNames: [], // 考虑删除
		oWords: {}, // 生词
		oNames: {}, // 专有名词（proper noun
		// ▼字幕
		iCurStep: 0, // 当前步骤
		changeTs: 0, // 字幕修改时间
		aSteps: aEmptySteps.dc_,
		// ▼故事
		oStory: {}, // 故事信息
		// ▼媒体
		mediaId: null, // 媒体id
		fileSrc: "", //文件地址
		oMediaInfo: {}, // 媒体信息
		oMediaInTB: {}, // 媒体信息（在本地
		matchDialogVisible: false, // 
		aSubtitleFromNet: [], //网上字幕
		sSearching: '',  // 正在搜索的单词
		mediaFile_: {}, // 媒体文件
		iBright: -1, // 输入框上的 hover 单词
		iTopLine: 0, // 应从第几行字幕开始显示
		myTxt: '默认文字',
	};
	constructor(props) {
		super(props);
		this.checkWordsDB();
		[
			'delWord',
			'initWordsDB',
			'cleanWordsList',
			'uploadToCloudBefore',
			'beforeUseNetSubtitle',
			'clickOnWave',
			'mouseDownFn',
			'waveWrapScroll',
			'valChanged',
			'enterKeyDown',
			'sentenceScroll',
			'commander',
			'toHideWordModal',
			'toHideCompareModal',
		].forEach(cur=>{
			this[cur] = this[cur].bind(this);
		});
	}
	// ▼时间刻度
	getMarkBar({fPerSecPx}){
		const myArr = [];
		let [nowSec, endSec] = this.getArea();
		while (nowSec < endSec) {
			const minute = ~~(nowSec / 60);
			const second = nowSec < 60 ? nowSec : nowSec % 60;
			const is10Times = nowSec % 10 === 0;
			const className = 'one-second ' + (is10Times ? 'ten-times' : '');
			const oneSpan = <span className={className} key={nowSec} style={{left: nowSec * fPerSecPx + "px"}}>
				<b className="mark"/>
				{(()=>{
					if (minute && second === 0) return `${minute}'0`; //分钟
					if (fPerSecPx > 100) return `${minute}'${second}`;
					if (fPerSecPx > 50) return `${second}`;
					if (is10Times) return `${minute}'${second}`; //如果每秒太窄-仅在几十秒的时候显示
				})()}
			</span>
			myArr.push(oneSpan);
			nowSec++;
		}
		return <cpnt.MarkWrap>{myArr}</cpnt.MarkWrap>;
	}
	// ▼句子波形上的【区间标记】
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
		return <cpnt.RegionWrap>
			<i ref={this.oPointer} className={"pointer " + (playing ? 'playing' : '')}/>;
			{myArr}
		</cpnt.RegionWrap>
	}
	// ▼故事信息等
	getInfoBar(oState){ 
		const {
			oMediaInfo,
			buffer, iPerSecPx, aSteps, iCurStep,
		} = oState;
		const oCurStep = aSteps[iCurStep];
		const [tips01, tips02] = this.getSubtitleInfo();
		return <cpnt.InfoBar>
			<span>
				章节：
				<em title={oMediaInfo.fileName} className="ellipsis red">
					{oMediaInfo.fileName}
				</em>
			</span>
			<span>时长：<em>{buffer.sDuration_}</em></span>
			<span>共计：<em>{oCurStep.aLines.length || 0}句</em></span>
			<span>每秒：<em>{iPerSecPx}px</em></span>
			<span>字幕：<em title={tips02}>{tips01}</em></span>
		</cpnt.InfoBar>
	}
	// ▼提示单词
	getWordsList({aMatched, oWords, oNames, sTyped}){
		const arr = aMatched.map((cur, idx)=>{
			const curLower = cur.toLowerCase();
			let sKind = oNames[curLower] && 'name';
			sKind = sKind || (oWords[curLower] ? 'new-word' : '');
			const sClass = sKind + (/\s/.test(cur) ? ' word-group' : '');
			const sRight = cur.slice(sTyped.length).trim();
			const inner = <cpnt.oneWord key={idx} >
				{sTyped ? <i className="idx">{idx+1}</i> : null}
				<span className={sClass}>
					<em className="left">{sTyped}</em>
					{(sTyped && sRight) ? '·' : ''}
					<span className="right">{sRight}</span>
				</span>
			</cpnt.oneWord>
			if (!sKind) return inner;
			const result = <Popconfirm title="确定删除？" key={idx}
				okText="删除" cancelText="取消" placement="topLeft"
				onConfirm={()=>this.delWord(sKind, cur)}
			>
				{inner}
			</Popconfirm>
			return result;
		});
		return <cpnt.WordsBar>
			{arr}
		</cpnt.WordsBar>;
	}
	// ▼单词库的窗口
	getWordsDialog({aWords, aWordsDBState}){
		const arr = aWords.sort().map((cur, idx)=>{
			return <Popconfirm title="确定删除？"
				okText="删除" cancelText="取消" placement="topLeft"
				onConfirm={()=>this.delWord(cur)} key={idx}
			>
				<span className="one-word">{cur}</span>
			</Popconfirm>
		});
		const noWrods = <p className="no-words">暂无单词</p>;
		const isWordsDBOK = aWordsDBState.length === 26;
		return <Modal title="单词库" visible={this.state.visible} 
			footer={null} onCancel={this.toHideWordModal}
		>
			<cpnt.WordsDialog>
				<div className="btn-bar">
					<Button type={isWordsDBOK && "primary"}
						onClick={this.initWordsDB}
					>
						{isWordsDBOK ? '词库已经初始化' : '初始化单词库'}
					</Button>
					<Button onClick={this.cleanWordsList}>清空</Button>
				</div>
				<div className="words-list">
					{arr.length ? arr : noWrods}
				</div>
			</cpnt.WordsDialog>
		</Modal>;
	}
	// ▼字幕对比窗口
	getMatchDialog(){
		const { aSteps, iCurStep, aSubtitleFromNet } = this.state;
		const { aLines } = aSteps[iCurStep];
		const iMax = Math.max(aSubtitleFromNet.length, aLines.length);
		const iLong = String(iMax).length;
		const [tips01, tips02] = this.getSubtitleInfo();
		const btnBar = <Space>
			<Button type="primary" onClick={this.uploadToCloudBefore}>
				上传本地字幕
			</Button>
			<Button onClick={this.beforeUseNetSubtitle}>
				使用网络字幕
			</Button>
			<em>{tips01}，{tips02}</em>
		</Space>
		const aLi = [...Array(iMax).keys()].map(idx=>{
			const aa = aLines[idx] || {};
			const bb = aSubtitleFromNet[idx] || {};
			return <cpnt.oneMatchLine key={idx}>
				<span className="idx">{String(idx+1).padStart(iLong, '0')}</span>
				<div className="left">{aa.text || ''}</div>
				<div className="right">{bb.text || ''}</div>
			</cpnt.oneMatchLine>
		});
		const oStyle = { top: 20 };
		return <Modal title="对比窗口" width="92%" style={oStyle}
			visible={this.state.matchDialogVisible} footer={null}
			onCancel={this.toHideCompareModal}
		>
			{btnBar}
			<cpnt.matchUl>{aLi}</cpnt.matchUl>
		</Modal>;
	}
	toChange(ev){
		this.setState({
			myTxt: ev.target.value,
		});
	}
	getTextArea(oThisLine){
		const {text=''} = oThisLine;
		const aWordsList = this.markWords(text);
		return <cpnt.TextareaWrap ref={this.oTextBg}>
			{aWordsList}
			<textarea className="textarea" ref={this.oTextArea}
				value={text}
				onChange={this.valChanged}
			></textarea>
			{/* onKeyDown={this.enterKeyDown} */}
			{/* <textarea className="textarea" ref={this.oTextArea}
				value={this.state.myTxt}
				onChange={ev=>this.toChange(ev)}
			></textarea> */}
		</cpnt.TextareaWrap>;
	}
	getAllSentence(){
		console.time("显示句子");
		const { aSteps, iCurStep, iTopLine } = this.state;
		const {aLines, iCurLine} = aSteps[iCurStep];
		const {length: iLen} = aLines;
		const aSentences = [];
		const iEnd = Math.min(iTopLine + 15, iLen);
		for (let idx = iTopLine; idx < iEnd; idx++ ){
			const cur = aLines[idx];
			const oLi = <li key={idx} onClick={() => this.goLine(idx)}
				className={`one-line ${idx === iCurLine ? "cur" : ""}`}
			>
				<i className="idx">{idx + 1}</i>
				<span className="time">
					<em>{cur.start_}</em><i>-</i><em>{cur.end_}</em>
				</span>
				<cpnt.oneSentence>
					{this.markWords(cur.text)}
				</cpnt.oneSentence>
			</li>;
			aSentences.push(oLi);
		}
		const iHeight = cpnt.iLineHeight;
		const oTopGap = {height: `${iHeight * iTopLine}px`};
		const oBottomGap = {height: `${iHeight * (iLen - iEnd) + 100}px`};
		const oStyle = {'--width': `${String(iLen || 0).length}em`};
		const HTML = <cpnt.SentenceWrap ref={this.oSententList} 
			style={oStyle} onScroll={this.sentenceScroll}
		>
			<li style={oTopGap}></li>
			{aSentences}
			<li style={oBottomGap}></li>
		</cpnt.SentenceWrap>
		console.timeEnd("显示句子");
		return HTML;
	}
	render() {
		console.log("开始render ■■■■■■■■■■■■■■■■■■");
		const {
			aSteps, iCurStep, iCanvasHeight,
			fileSrc, fPerSecPx, buffer, loading, mediaId,
			sSearching,
			mediaFile_,
		} = this.state;
		const {aLines, iCurLine} = aSteps[iCurStep];
		const oThisLine = aLines[iCurLine] || {};
		if ((this.oldMediaId !== mediaId) && mediaId) {
			this.oldMediaId = mediaId;
			this.getMediaInfo(mediaId);
		}
		const {oldContext={}, context={}} = this;
		const {UpdatedAt: UpdatedAtNew} = context.oStoryInfo || {};
		const {UpdatedAt: UpdatedAtOld} = oldContext.oStoryInfo || {};
		if (UpdatedAtNew && UpdatedAtNew !== UpdatedAtOld){
			console.log("context数据更新了");
			this.oldContext = context;
			this.init();
		}
		const isVideo = (mediaFile_.type || '').includes('video/');
		const WaveLeft = <cpnt.VideoWrap className={(isVideo ? 'show' : '') + ' left'}>
			<video src={fileSrc} name="controls"
				ref={this.oAudio} className="video"
			/>
			<p className="subtitle" data-text={oThisLine.text}>
				{oThisLine.text}
			</p>
		</cpnt.VideoWrap>
		// 左右分界
		const oLongBarStyle = {width: `${fPerSecPx * buffer.duration + 100}px`};
		const WaveRight = <div className="right">
			<cpnt.WaveBox>
				<canvas height={iCanvasHeight} ref={this.oCanvas}/>
				<cpnt.WaveWrap ref={this.oWaveWrap} onScroll={this.waveWrapScroll}>
					<cpnt.LongBar style={oLongBarStyle}
						onContextMenu={this.clickOnWave}
						onMouseDown={this.mouseDownFn}
					>
						{this.getMarkBar(this.state)}
						{this.getRegions(this.state)}
					</cpnt.LongBar>
				</cpnt.WaveWrap>
			</cpnt.WaveBox>
			<Menu commander={this.commander} />
			{this.getInfoBar(this.state)}
			<cpnt.HistoryBar>
				{aSteps.map((cur,idx)=>{
					return <span key={idx} className={iCurStep === idx ? 'cur' : ''} />
				})}
			</cpnt.HistoryBar>
			{this.getTextArea(oThisLine)}
			{this.getWordsList(this.state)}
		</div>
		// ===============================================
		const resultHTML = <cpnt.Container>
			<Spin spinning={loading} size="large"/>
			<cpnt.MediaAndWave>
				{WaveLeft}
				{WaveRight}
			</cpnt.MediaAndWave>
			{this.getAllSentence()}
			{this.getWordsDialog(this.state)}
			{this.getMatchDialog(this.state)}
			<DictDialog word={sSearching} />
		</cpnt.Container>;
		return resultHTML;
	}
	// ▲render  // ▼返回dom的方法，按从上到下的顺序排列
	// ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
	// // ▼生命周期
	// shouldComponentUpdate(){
	//     console.log( 'B-shouldComponentUpdate（更新调用' );
	//     return true;
	// }
	static getDerivedStateFromProps(nextProps, prevState){ // nextProps, prevState
		// console.log('%c02-A-getDerivedStateFromProps（双重调用【开始更新】', 'background:yellow');
		const {params={}} = nextProps.match;
		const mediaId = params.mediaId * 1;
		let newObj = null;
		if (mediaId && mediaId !== prevState.mediaId) {
			newObj = {
				mediaId,
				iCurStep: 0, // 清空
				aSteps: aEmptySteps.dc_, // 清空
			};
		}
		return newObj;
	}
	// ▼以下是生命周期
	componentDidUpdate(){
		const { aSteps, iCurStep } = this.state;
		const {aLines, iCurLine} = aSteps[iCurStep];
		const oThisLine = aLines[iCurLine] || {};
		if (this.sOldText !== oThisLine.text ) { 
			this.setSpanArr(); // 文字变化了就执行
		}
		this.sOldText = oThisLine.text;
	}
	async componentDidMount() {
		const oWaveWrap = this.oWaveWrap.current;
		const oAudio = this.oAudio.current;
		const keyDownFn = this.keyDowned.bind(this);
		const mouseMoveFn = this.mouseMoveFn.bind(this);
		oWaveWrap.addEventListener( //在【波形图】上滚轮
			"mousewheel", ev => this.wheelOnWave(ev), {passive: false},
		);
		oAudio.addEventListener( //在【视频】在滚轮
			"mousewheel", ev => this.changeVideoSize(ev),
		);
		this.cleanCanvas();
		document.addEventListener('keydown', keyDownFn);
		document.addEventListener('mousemove', mouseMoveFn);
		this.props.history.listen(oRoute => { // bj监听路由变化
			const {pathname} = oRoute;
			const hasLeft = !pathname.includes(`/${dictationPath}/`);
			const type = hasLeft ? 'removeEventListener' : 'addEventListener';
			document[type]('keydown', keyDownFn);
			document[type]('mousemove', mouseMoveFn);
		});
	}
	// ▼销毁前
	componentWillUnmount(){
		this.setState = (state, callback) => null;
	}
}
