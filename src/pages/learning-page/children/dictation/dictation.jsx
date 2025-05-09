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
const MyClass = window.mix(
	React.Component,
	coreFn, keyDownFn, MouseFn, wordsDbFn,
	figureOutRegion, initFn,
);
let unlistenFn = xx=>xx;

// TODO 合并临近行出错
// TODO 跳到下一篇
// TODO 上传时标记音频长度？
// TODO 上传时压缩？

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
	oFnLib = {}; // 快捷键方法库
	doingTimer = null; // 防抖（目前没有应用）
	oEmptyLine = oEmptyLine.dc_; // 空行
	typeingTimer = null;
	aHistory = [{
		iCurLineIdx: 0,
		aLineArr: [oEmptyLine.dc_],
	}];
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
		aSubtitleFromNet: [], //网上字幕
		aLineArr: [oEmptyLine.dc_],
		iCurLineIdx: 0, // 当前行
		sCurLineTxt: '',
		isSearching: true, // 废弃？
		// ▼故事与媒体
		oStory: {}, // 故事信息
		mediaId: null, // 媒体id
		fileSrc: "", //文件地址
		oMediaInfo: {}, // 媒体信息
		oMediaInTB: {}, // 媒体信息（在本地
		matchDialogVisible: false, // 
		sSearching: '',  // 正在搜索的单词
		mediaFile_: {}, // 媒体文件
		iBright: -1, // 输入框上的 hover 单词
		iTopLine: 0, // 应从第几行字幕开始显示
	};
	constructor(props) {
		super(props);
		window.tool = this;
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
			'sentenceScroll',
			'commander',
			'toHideWordModal',
			'toHideCompareModal',
			'keyDowned',
			'mouseMoveFn',
		].forEach(cur=>{
			this[cur] = this[cur].bind(this);
		});
		this.getFnArr(true).forEach(cur=>{
			this.oFnLib[cur.key] = cur.fn;
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
	getRegions(){
		const {aLineArr, iCurLineIdx, playing, fPerSecPx} = this.state;
		const myArr = [];
		let [nowSec, endSec] = this.getArea();
		for (let idx = 0, len = aLineArr.length; idx < len; idx++){
			const {end, start, long} = aLineArr[idx];
			const IsShow = end > nowSec || end > endSec;
			if (!IsShow) continue;
			myArr.push(
				<span key={idx} className={idx === iCurLineIdx ? "cur region" : "region"}
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
			oMediaInfo, buffer, iPerSecPx, aLineArr,
		} = oState;
		const [tips01, tips02] = this.getSubtitleInfo();
		return <cpnt.InfoBar>
			<span>
				章节：
				<em title={oMediaInfo.fileName} className="ellipsis red">
					{oMediaInfo.fileName}
				</em>
			</span>
			<span>时长：<em>{buffer.sDuration_}</em></span>
			<span>共计：<em>{aLineArr.length || 0}句</em></span>
			<span>每秒：<em>{iPerSecPx}px</em></span>
			<span>字幕：<em title={tips02}>{tips01}</em></span>
		</cpnt.InfoBar>
	}
	// ▼提示单词（小于1毫秒）
	getWordsList(){
		const { aMatched, oWords, oNames, sTyped } = this.state;
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
			return inner;
			// if (!sKind) return inner;
			// const result = <Popconfirm title="确定删除？" key={idx}
			// 	okText="删除" cancelText="取消" placement="topLeft"
			// 	onConfirm={()=>this.delWord(sKind, cur)}
			// >
			// 	{inner}
			// </Popconfirm>
			// return result;
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
		const { aSubtitleFromNet, aLineArr } = this.state;
		const iMax = Math.max(aSubtitleFromNet.length, aLineArr.length);
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
			const aa = aLineArr[idx] || {};
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
			sCurLineTxt: ev.target.value,
		});
	}
	getTextArea(){
		const {sCurLineTxt} = this.state;
		return <cpnt.TextareaWrap ref={this.oTextBg}>
			{this.markWords(sCurLineTxt)}
			<textarea className="textarea"
				ref={this.oTextArea}
				value={sCurLineTxt}
				onChange={this.valChanged}
			></textarea>
		</cpnt.TextareaWrap>;
	}
	getAllSentence(){
		// console.time("显示句子");
		const {
			iTopLine, aLineArr, iCurLineIdx, sCurLineTxt,
		} = this.state;
		const {length: iLen} = aLineArr;
		const aSentences = [];
		const iEnd = Math.min(iTopLine + 15, iLen);
		for (let idx = iTopLine; idx < iEnd; idx++ ){
			const isCurrent = idx === iCurLineIdx;
			const cur = aLineArr[idx];
			const oLi = <li key={idx}
				className={`one-line ${isCurrent ? "cur" : ""}`}
				onClick={() => this.goLine(idx)}
			>
				<i className="idx">{idx + 1}</i>
				<span className="time">
					<em>{cur.start_}</em><i>-</i><em>{cur.end_}</em>
				</span>
				<cpnt.oneSentence>
					{this.markWords(isCurrent ? sCurLineTxt : cur.text)}
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
		// console.timeEnd("显示句子");
		return HTML;
	}
	render() {
		// console.log("开始render ■■■■■■■■■■■■■■■■■■");
		const {
			iCanvasHeight,
			fileSrc, fPerSecPx, buffer, loading, mediaId,
			sSearching,
			mediaFile_,
			aLineArr,
			iCurLineIdx,
			iCurStep,
		} = this.state;
		const oThisLine = aLineArr[iCurLineIdx] || {};
		if ((this.oldMediaId !== mediaId) && mediaId) {
			this.oldMediaId = mediaId;
			this.getMediaInfo(mediaId);
		}
		const {oldContext={}, context={}} = this;
		const {UpdatedAt: UpdatedAtNew} = context.oStoryInfo || {};
		const {UpdatedAt: UpdatedAtOld} = oldContext.oStoryInfo || {};
		if (UpdatedAtNew && (UpdatedAtNew !== UpdatedAtOld)){
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
				{this.aHistory.map((cur,idx)=>{
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
	// ▼ 在render之前调用，state已更新。必须有返回值
	// getSnapshotBeforeUpdate(){}
	static getDerivedStateFromProps(nextProps, prevState){ // nextProps, prevState
		// console.log('%c02-A-getDerivedStateFromProps（双重调用【开始更新】', 'background:yellow');
		const {params={}} = nextProps.match;
		const mediaId = params.mediaId * 1;
		let newObj = null;
		if (mediaId && mediaId !== prevState.mediaId) {
			newObj = {
				mediaId,
				iCurLineIdx: 0, // 清空
				aLineArr: [oEmptyLine.dc_], // 清空
			};
		}
		return newObj;
	}
	// ▼以下是生命周期
	componentDidUpdate(){
		const { aLineArr, iCurLineIdx } = this.state;
		const oThisLine = aLineArr[iCurLineIdx] || {};
		if (this.sOldText !== oThisLine.text ) { 
			this.setSpanArr(); // 文字变化了就执行
		}
		this.sOldText = oThisLine.text;
	}
	async componentDidMount() {
		const oWaveWrap = this.oWaveWrap.current;
		const oAudio = this.oAudio.current;
		oWaveWrap.addEventListener( //在【波形图】上滚轮
			"mousewheel", ev => this.wheelOnWave(ev), {passive: false},
		);
		oAudio.addEventListener( //在【视频】在滚轮
			"mousewheel", ev => this.changeVideoSize(ev),
		);
		this.cleanCanvas();
		document.addEventListener('keydown', this.keyDowned);
		document.addEventListener('mousemove', this.mouseMoveFn);
		unlistenFn = this.props.history.listen(oRoute => { // bj监听路由变化
			console.log('路由已经改变');
			document.removeEventListener('keydown', this.keyDowned);
			document.removeEventListener('mousemove', this.mouseMoveFn);
			const goIn = oRoute.pathname.includes(`/${dictationPath}/`);
			if (!goIn) return;
			document.addEventListener('keydown', this.keyDowned);
			document.addEventListener('mousemove', this.mouseMoveFn);
		});
	}
	// ▼销毁前
	componentWillUnmount(){
		this.setState = (state, callback) => null;
		console.log('组件即将销毁');
		document.removeEventListener('keydown', this.keyDowned);
		document.removeEventListener('mousemove', this.mouseMoveFn);
		unlistenFn();
	}
}
