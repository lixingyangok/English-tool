import React from "react";
import * as cpnt from "./style/my-tool-style.js";
import {Spin, Input, Popconfirm} from "antd";
import coreFn from "./js/core-fn.js";
import keyDownFn from "./js/key-down-fn.js";
import MouseFn from './js/mouse-fn.js';
import fileFn from './js/file-fn.js';
import wordsDbFn from './js/words-db.js';
import figureOutRegion from './js/figure-out-region.js';
import Nav from './children/menu/menu.jsx';
import {Modal, Button, Upload, message} from 'antd';

const { TextArea } = Input;
const { confirm } = Modal;

const MyClass = window.mix(
	React.Component,
	coreFn, keyDownFn, MouseFn, fileFn, wordsDbFn,
	figureOutRegion,
);
const oFirstLine = new coreFn().fixTime({start: 0.1, end: 5});

export default class Tool extends MyClass {
	message = message;
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
		iPerSecPx: 100, //人为定义的每秒宽度
		fPerSecPx: 100, //实际算出每秒像素数
		drawing: false, //是否在绘制中（用于防抖
		loading: false, //是否在加载中（解析文件
		playing: false, //储存播放的定时器setInterval的返回值
		aSteps: [{ //历史记录
			iCurLine: 0, // 当前所在行
			aLines: [oFirstLine.dc_], //字幕
		}],
		iCurStep: 0, //当前步骤
		oTarget: {}, // 故事信息如：故事id、章节id
		trainingDB: {}, // 表-存故事 - 原来的oStoryTB
		oMediaTB: {}, // 表-存媒体
		oWordsDB: {}, //词库
		oStory: {}, // DB中的【故事】
		oSct: {}, // DB中的【章节】
		sTyped: '', //已经输入的，用于搜索
		aWords: [], //DB中的【单词】
		aMatched: [], //与当前输入匹配到的单词
		visible: false,
		aWordsDBState: [],
		scrollTimer: null,
	};
	constructor(props) {
		super(props);
		const oTarget = (()=>{
			const {search} = props.location; // ?storyId=1&mediaId=9
			if (!search) return {};
			return search.slice(1).split('&').reduce((result, cur)=>{
				const [key, val] = cur.split('=');
				return {...result, [key]: val};
			}, {});
		})();
		console.log('页面加载了：oTarget', oTarget);
		const loading = !!oTarget.storyId; //有id就loading
		const [storyTB, oMediaTB, oWordsDB] = (()=>{
			const oWordsDB = new window.Dexie("wordsDB");
			const trainingDB = new window.Dexie("trainingDB");
			trainingDB.version(1).stores({story: '++id, ID, name, storyId'});
			trainingDB.version(2).stores({media: '++id, ID, fileId, ownerStoryId'});
			return [trainingDB.story, trainingDB.media, oWordsDB];
		})();
		Object.assign(
			this.state,
			{storyTB, oMediaTB, oTarget, loading, oWordsDB},
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
		const resultHTML = <cpnt.Container>
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
							<cpnt.LongBar style={{width: `${fPerSecPx * buffer.duration + 100}px`}}
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
		return resultHTML;
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
		const oWaveWrap = this.oWaveWrap.current;
		const oAudio = this.oAudio.current;
		oWaveWrap.addEventListener( //在【波形图】上滚轮
			"mousewheel", ev => this.wheelOnWave(ev), {passive: false},
		);
		oAudio.addEventListener( //在【视频】在滚轮
			"mousewheel", ev => this.changeVideoSize(ev),
		);
		this.cleanCanvas();
		document.onkeydown = this.keyDowned.bind(this);
	}
	// ▼销毁前
	componentWillUnmount(){
		// this.setState = (state, callback) => {return};
		// ReactDOM.unmountComponentAtNode(document.getElementById("tool"));
		this.setState = (state, callback) => null;
		document.onkeydown = null; // xx=>xx;
	}
	// ▼主要方法等
	async init({storyId, mediaId}){
		console.log('init()');
		const {storyTB, oMediaTB, } = this.state; // aSteps
		const [oStory, oMedia] = await Promise.all([
			storyTB.where('ID').equals(storyId*1).first(),
			oMediaTB.where('ID').equals(mediaId*1).first(),
		]);
		if (!oStory) return;
		console.log(oStory, oMedia);
		if (!oMedia){ // 如果找不到对应的故事
			const oMidaInfo = oStory.aMedia_.find(cur=>{
				return cur.ID === mediaId * 1;
			});
			this.downLoadMedia(oMidaInfo);
		}
		// const aChannelData_ = await (async ()=>{
		// 	const theBlob = oSct.buffer.oChannelDataBlob_;
		// 	if (!theBlob.arrayBuffer) return;
		// 	const res = await theBlob.arrayBuffer();
		// 	return new Int8Array(res);
		// })();
		// if (!aChannelData_) {
		// 	this.setState({loading: false});
		// 	return alert('浏览器无法解析音频数据');
		// }
		// const buffer = {...oSct.buffer, aChannelData_};
		// const [{aWords=[]}, loading] = [oStory, false];
		// const fileSrc = URL.createObjectURL(oSct.audioFile);
		// const iAlines = oSct.aLines.length;
		// if (iAlines) aSteps.last_.aLines = oSct.aLines; //字幕
		// this.setState({fileSrc, buffer, aSteps, oStory, oSct, aWords, loading});
		// this.bufferToPeaks();
		// iAlines || this.giveUpThisOne(0);
	}
	// ▼下载音频字幕，然后保存
	async downLoadMedia(oMidaInfo){
		console.log('oMidaInfo', oMidaInfo);
		const filePath = 'http://qn.hahaxuexi.com/' + oMidaInfo.fileId;
		const res = await window.axios.get(filePath, {
			responseType: "blob",
		});
		if (!res) return;
		const mediaFile = new File([res], oMidaInfo.fileName, {
			type: res.type,
		});
		console.log('媒体文件\n', mediaFile);
		const subtitleFilePath = 'http://qn.hahaxuexi.com/' + oMidaInfo.subtitleFileId;
		const res02 = await window.axios.get(subtitleFilePath, {
			// responseType: "blob",
		});
		if (!res02) return;
		console.log('字幕\n', res02);
		// var file=document.getElementById("file").file[0];
		// var reader=new FileReader();
		// //将文件以文本形式读入页面
		// read.readAsText(file);
		// reader.οnlοad=function(f)
		// {
		// 	var result=document.getElementById("result");
		// 	//在页面上显示读入文本
		// 	result.innerHTML=this.result;
		// }
		// this.saveOneMedia(oStory, {
		// 	...oMidaInfo, mediaFile,
		// });
	}
	// ▼保存媒体的方法
	async saveOneMedia(oStory, oneMedia){
		const {mediaTB} = this.state;
		oneMedia.ownerStoryId = oStory.ID;
		const collection  = await mediaTB.where('fileId').equals(oneMedia.fileId);
		const oFirst = await collection.first();
		if (!oFirst) return mediaTB.add(oneMedia);
		mediaTB.put({
			...oFirst, ...oneMedia,
		});
	}
	// ▼旧的
	// ▼音频数据转换波峰数据
	bufferToPeaks(perSecPx_) {
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
