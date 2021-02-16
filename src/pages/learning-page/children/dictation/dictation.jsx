import React from "react";
import * as cpnt from "./style/dictation.js";
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
	Spin, Input, Popconfirm,
} from 'antd';

const { TextArea } = Input;
const { confirm } = Modal;
const oFirstLine = fixTime({start: 0.1, end: 5});
const MyClass = window.mix(
	React.Component,
	coreFn, keyDownFn, MouseFn, wordsDbFn,
	figureOutRegion, initFn,
);

// TODO，区分人名与词汇、添加词汇后没有立即显示出来
// 在输入框输入，不应触发上级的监听
// textare 校对效果，搜索

// window.alert('类声明前夕');

export default class Tool extends MyClass {
	static contextType = MyContext;
	// ▼ 若使用修饰符 static 则在 constructor、componentDidMount 拿不到值
	/*static*/ confirm = confirm;
	message = message;
	oldContext = undefined;
	oldMediaId = undefined;
	oAudio = React.createRef();
	oCanvas = React.createRef();
	oPointer = React.createRef();
	oWaveWrap = React.createRef();
	oTextArea = React.createRef();
	oSententList = React.createRef();
	state = {
		buffer: {}, //音频数据
		aPeaks: [], //波形数据
		iHeight: 0.3, // 波形高
		iCanvasHeight: cpnt.iCanvasHeight, //画布高
		iPerSecPx: 100, //人为定义的每秒宽度
		fPerSecPx: 100, //实际算出每秒像素数
		drawing: false, //是否在绘制中（用于防抖
		loading: false, //是否在加载中（解析文件
		playing: false, //储存播放的定时器setInterval的返回值
		iCurStep: 0, //当前步骤
		sTyped: '', //已经输入的，用于搜索
		aMatched: [], //与当前输入匹配到的单词
		visible: false, // 控制词汇弹出窗口的可见性
		aWordsDBState: [],
		scrollTimer: null,
		// ▼新版--------------------------------
		oFirstLine, //默认行
		fileSrc: "", //文件地址
		aSteps: [{ //历史记录
			iCurLine: 0, // 当前所在行
			aLines: [oFirstLine.dc_], //字幕
		}],
		aWords: [], // 生词
		aNames: [], // 专有名词（proper noun
		oStory: {}, // 故事信息
		oMediaInfo: {}, // 媒体信息
		oMediaInTB: {}, // 媒体信息（在本地
		changeTs: 0, // 字幕修改时间
		matchDialogVisible: false, // 
		aSubtitleFromNet: [], //网上字幕
		mediaId: null, // 媒体id
		sSearching: '',  // 正在搜索的单词
		mediaFile_: {}, // 媒体文件
	};
	constructor(props) {
		super(props);
		this.checkWordsDB();
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
	getInfoBar(oState){ 
		const {
			oMediaInfo,
			buffer, iPerSecPx, aSteps, iCurStep,
		} = oState;
		const oCurStep = aSteps[iCurStep];
		const [tips01, tips02] = this.getSubtitleInfo();
		return <cpnt.InfoBar>
			<span>章节：<em>{oMediaInfo.fileName}</em></span>
			<span>时长：<em>{buffer.sDuration_}</em></span>
			<span>共计：<em>{oCurStep.aLines.length || 0}句</em></span>
			<span>每秒：<em>{iPerSecPx}px</em></span>
			<span>字幕：<em title={tips02}>{tips01}</em></span>
		</cpnt.InfoBar>
	}
	// ▼提示单词
	getWordsList({aMatched, aWords, aNames, sTyped}){
		const arr = aMatched.map((cur, idx)=>{
			const isName = aNames.find(curWord => curWord.toLowerCase() === cur.toLowerCase());
			const isWord = aWords.find(curWord => curWord.toLowerCase() === cur.toLowerCase());
			const kind = isName ? 'names' : (isWord ? 'words' : '');
			const sRight = cur.slice(sTyped.length).trim();
			const inner = <cpnt.oneWord key={idx} kind={kind}>
				{sTyped ? <i className="idx">{idx+1}</i> : null}
				<em className="left">{sTyped}</em>
				{(sTyped && sRight) ? '·' : ''}
				<span className="right">{sRight}</span>
			</cpnt.oneWord>
			if (!kind) return inner;
			const result = <Popconfirm title="确定删除？" key={idx}
				okText="删除" cancelText="取消" placement="topLeft"
				onConfirm={()=>this.delWord(kind, cur)}
			>
				{inner}
			</Popconfirm>
			return result;
		});
		return <cpnt.WordsBar>
			{arr}
		</cpnt.WordsBar>;
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
		const isWordsDBOK = aWordsDBState.length === 26;
		return <Modal title="单词库"
			visible={this.state.visible} footer={null}
			onCancel={()=>this.setState({visible: false})}
		>
			<cpnt.WordsDialog>
				<div className="btn-bar">
					<Button type={isWordsDBOK && "primary"}
						onClick={()=>this.initWordsDB()}
					>
						{isWordsDBOK ? '词库已经初始化' : '初始化单词库'}
					</Button>
					<Button onClick={()=>this.cleanWordsList()}>清空</Button>
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
			<Button type="primary" onClick={()=>this.uploadToCloudBefore()} >
				上传本地字幕
			</Button>
			<Button onClick={()=>this.beforeUseNetSubtitle()} >
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
		return <Modal title="对比窗口" width="92%"
			style={{ top: 20,  }}
			visible={this.state.matchDialogVisible} footer={null}
			onCancel={()=>this.setState({matchDialogVisible: false})}
		>
			{btnBar}
			<cpnt.matchUl>{aLi}</cpnt.matchUl>
		</Modal>;
	}
	render() {
		const {
			aSteps, iCurStep, iCanvasHeight,
			fileSrc, fPerSecPx, buffer, loading, mediaId,
			sSearching,
			mediaFile_,
		} = this.state;
		const {aLines, iCurLine} = aSteps[iCurStep];
		const oThisLine = aLines[iCurLine] || {};
		if ((this.oldMediaId !== mediaId) && mediaId) {
			console.log('媒体id变成了--', mediaId);
			this.oldMediaId = mediaId;
			this.setMedia(mediaId);
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
		const WaveRight = <div className="right">
			<cpnt.WaveBox>
				<canvas height={iCanvasHeight} ref={this.oCanvas}/>
				<cpnt.WaveWrap ref={this.oWaveWrap} onScroll={() => this.onScrollFn()}>
					<cpnt.LongBar style={{width: `${fPerSecPx * buffer.duration + 100}px`}}
						onContextMenu={ev => this.clickOnWave(ev)} onMouseDown={ev=>this.mouseDownFn(ev)}
					>
						{this.getMarkBar(this.state)}
						{this.getRegions(this.state)}
					</cpnt.LongBar>
				</cpnt.WaveWrap>
			</cpnt.WaveBox>
			<Menu commander={(sFnName, ...aRest)=>this.commander(sFnName, aRest)} />
			{this.getInfoBar(this.state)}
			<cpnt.HistoryBar>
				{aSteps.map((cur,idx)=>{
					return <span key={idx} className={iCurStep === idx ? 'cur' : ''} />
				})}
			</cpnt.HistoryBar>
			<cpnt.TextareaWrap>
				<TextArea id="myTextArea" ref={this.oTextArea}
					value={oThisLine.text}
					onChange={ev => this.valChanged(ev)}
					onKeyDown={ev => this.enterKeyDown(ev)}
				/>
			</cpnt.TextareaWrap>
			{this.getWordsList(this.state)}
		</div>
		// ▼句子列表
		const {secToStr} = this;
		const SentenceWrap = <cpnt.SentenceWrap ref={this.oSententList}>
			{aLines.map((cur, idx) => {
				return <li className={`one-line ${idx === iCurLine ? "cur" : ""}`}
					key={idx} onClick={() => this.goLine(idx)}
				>
					<i className="idx" style={{width: `${String(aLines.length || 0).length}em`}} >
						{idx + 1}
					</i>
					<span className="time">
						<em>{secToStr(cur.start)}</em>&nbsp;-&nbsp;<em>{secToStr(cur.end)}</em>
					</span>
					<p className="the-text" >{cur.text}</p>
				</li>;
			})}
		</cpnt.SentenceWrap>
		// ===============================================
		const resultHTML = <cpnt.Container>
			<Spin spinning={loading} size="large"/>
			<cpnt.MediaAndWave>
				{WaveLeft}
				{WaveRight}
			</cpnt.MediaAndWave>
			{SentenceWrap}
			{this.getDialog(this.state)}
			{this.getMatchDialog(this.state)}
			<DictDialog word={sSearching} />
		</cpnt.Container>;
		return resultHTML;
	}
	// ▲render  // ▼返回dom的方法，按从上到下的顺序排列
	// ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
	// // ▼生命周期
	// static getDerivedStateFromProps(newProps, oldState){
	// 	console.log("newProps\n", newProps);
	// 	return null;
	// }
	static getDerivedStateFromProps(nextProps, prevState){ // nextProps, prevState
		// console.log('%c02-A-getDerivedStateFromProps（双重调用【开始更新】', 'background:yellow');
		const {params={}} = nextProps.match;
		const mediaId = params.mediaId * 1;
		if (mediaId && mediaId !== prevState.mediaId) {
			// console.log('新的媒体id--------', mediaId);
			return {mediaId}; 
		}
		return null;
	}
	// ▼以下是生命周期
	// componentDidUpdate(){
	// 	document.onkeydown = this.keyDowned.bind(this);
	// }
	async componentDidMount() {
		const oWaveWrap = this.oWaveWrap.current;
		const oAudio = this.oAudio.current;
		const keyDownFn = this.keyDowned.bind(this);
		oWaveWrap.addEventListener( //在【波形图】上滚轮
			"mousewheel", ev => this.wheelOnWave(ev), {passive: false},
		);
		oAudio.addEventListener( //在【视频】在滚轮
			"mousewheel", ev => this.changeVideoSize(ev),
		);
		this.cleanCanvas();
		document.onkeydown = keyDownFn;
		this.props.history.listen(oRoute => { // bj监听路由变化
			const {pathname} = oRoute;
			const hasLeft = !pathname.includes(`/${dictationPath}/`);
			document.onkeydown = hasLeft ? null : keyDownFn;
		});
	}
	// ▼销毁前
	componentWillUnmount(){
		// this.setState = (state, callback) => {return};
		// ReactDOM.unmountComponentAtNode(document.getElementById("tool"));
		this.setState = (state, callback) => null;
		document.onkeydown = null; // xx=>xx;
	}
}
