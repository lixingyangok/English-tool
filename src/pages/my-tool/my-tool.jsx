import React from "react";
import * as cpnt from "./style/my-tool-style.js";
import {Spin, Input} from "antd";
import coreFn from "./js/core-fn.js";
import keyDownFn from "./js/key-down-fn.js";
import MouseFn from './js/mouse-fn.js';
import fileFn from './js/file-fn.js';
import Nav from './children/menu/menu.jsx';
// import {fileToBuffer} from 'assets/js/pure-fn.js';

const { TextArea } = Input;
const MyClass = window.mix(
  React.Component,
  coreFn, keyDownFn, MouseFn, fileFn,
);

export default class Tool extends MyClass {
  oCanvas = React.createRef();
  oAudio = React.createRef();
  oWaveWrap = React.createRef();
  oPointer = React.createRef();
  oSententList = React.createRef();
  oTextArea = React.createRef();
  constructor(props) {
    super(props);
    const {search} = props.location;
    const oTarget = (()=>{
      if (!search) return {};
      return search.slice(1).split('&').reduce((result, cur)=>{
        const [key, val] = cur.split('=');
        return {...result, [key]: val};
      }, {});
    })();
    console.log('search ', oTarget);
    const oFirstLine = this.fixTime({start: 0.1, end: 5});
    const myDb = window.myDb = new window.Dexie("myDb");
    myDb.version(1).stores({stories: '++id, name'});
		myDb.version(2).stores({sections: '++id, idx, parent'});
    const oStoryTB = myDb.stories;
    const oSectionTB = myDb.sections;
    this.state = {
      buffer: {}, //音频数据
      aPeaks: [], //波形数据
      duration: 0, //音频长度（秒
      playTimer: null, //定时器
      oFirstLine, //默认行
      fileName: "", //文件名
      fileSrc: "", //文件地址
      fileSrcFull: "", //文件地址2
      iHeight: 0.3, // 波形高
      iCanvasHeight: cpnt.iCanvasHeight, //画布高
      iPerSecPx: 55, //人为定义的每秒像素数
      fPerSecPx: 0, //实际每秒像素数
      drawing: false, //是否在绘制中（用于防抖
      loading: false, //是否在加载中（解析文件
      playing: false, //是否在播放中（用于控制指针显示
      aSteps: [{ //历史记录
        iCurLine: 0, // 当前所在行
        aLines: [[oFirstLine]], //字幕
        // ts: 0, //ts = timestap = 时间戳
      }],
      iCurStep: 0, //当前步骤
      oTarget, // 故事信息如：id、trackIdx
      oStoryTB, //故事数据库
      oSectionTB, //
      oStory: {}, //本地故事数据
    };
  }
  render() {
    const {
      aSteps, iCurStep, buffer, iCanvasHeight,
      duration, iPerSecPx, fileSrc, playing, fPerSecPx,
    } = this.state;
    // const fPerSecPx = (()=>{ //待办-清除这个，用state的
    //   const sampleSize = ~~(buffer.sampleRate / iPerSecPx); // 每一份的点数 = 每秒采样率 / 每秒像素
    //   return buffer.length / sampleSize / duration;
    // })();
    const {aLines, iCurLine} = aSteps[iCurStep];
    return <cpnt.Div>
      <audio src={fileSrc} ref={this.oAudio}/>
      <Spin spinning={this.state.loading} size="large"/>
      <cpnt.WaveBox>
        <canvas height={iCanvasHeight} ref={this.oCanvas}/>
        <cpnt.WaveWrap ref={this.oWaveWrap}
          onScroll={() => this.onScrollFn()}
        >
          <cpnt.TimeBar style={{width: `${fPerSecPx * duration}px`}}
            onContextMenu={ev => this.clickOnWave(ev)}
            onMouseDown={ev=>this.mouseDownFn(ev)}
          >
            <cpnt.MarkWrap>
              {[...Array(~~duration).keys()].map((cur, idx) => {
                return <span className="second-mark" key={cur}
                  style={{width: fPerSecPx + "px", left: idx * fPerSecPx + "px"}}
                >
                  {cur}
                </span>;
              })}
            </cpnt.MarkWrap>
            <cpnt.RegionWrap>
              <i ref={this.oPointer} className={"pointer " + (playing ? 'playing' : '')} />
              {aLines.map(({start, long}, idx) => {
                return <span key={idx} className={idx === iCurLine ? "cur region" : "region"}
                  style={{left: `${start * fPerSecPx}px`, width: `${long * fPerSecPx}px`}}
                >
                  <span className="idx">{idx + 1}</span>
                </span>
              })}
            </cpnt.RegionWrap>
          </cpnt.TimeBar>
        </cpnt.WaveWrap>
      </cpnt.WaveBox>
      {/* 分界 */}
      <Nav commander={(sFnName, ...aRest)=>this.commander(sFnName, aRest)} />
      {/* <cpnt.Steps>
        {aSteps.map((cur, idx)=>{
          return <li key={idx} className={idx===iCurStep ? 'cur' : ''}>{idx}</li>;
        })}
      </cpnt.Steps> */}
      {/* 分界 */}
      <cpnt.InputWrap>
        {(() => {
          if (!aLines[iCurLine]) return <span />;
          return <TextArea value={(aLines[iCurLine] || {}).text}
            ref={this.oTextArea}
            onChange={(ev) => this.valChanged(ev)}
            onKeyDown={(ev) => this.enterKeyDown(ev)}
          />;
        })()}
      </cpnt.InputWrap>
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
            {cur.text}
          </li>;
        })}
      </cpnt.SentenceWrap>
    </cpnt.Div>;
  }
  // ▲render
  // ▼以下是生命周期
  async componentDidMount() {
    const {oTarget} = this.state;
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
    if (Object.keys(oTarget).length) this.init(oTarget);
  }
  // ▼销毁前
  componentWillUnmount(){
    this.setState = (state, callback) => {return};
    // ReactDOM.unmountComponentAtNode(document.getElementById("tool"));
  }
  async init({storyId, sctId}){
    console.log('故事-章节', storyId, sctId)
    const {oStoryTB, oSectionTB, aSteps} = this.state;
    const [oStory, oSct] = await Promise.all([
      oStoryTB.get(storyId*1), oSectionTB.get(sctId*1),
    ]);
    if (!oStory || !oSct) return;
    const buffer = oSct.buffer;
    const fileSrc = URL.createObjectURL(oSct.audioFile);
    aSteps.last_.aLines = oSct.aLines; //字幕
    this.setState({fileSrc, buffer, aSteps, oStory});
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
    // ▲返回内容：{aPeaks, fPerSecPx, duration};
    this.setState({ ...obackData });
    this.toDraw();
    return obackData.aPeaks;
  }
}


// // ▼测试
// async testFn(){
//   const buffer = await fn.getMp3();
//   const sText = await fn.getText();
//   const {aSteps} = this.state;
//   // aSteps.last_.aLines = this.getTimeLine(sText).slice(0, 13); //字幕
//   aSteps.last_.aLines = sText; //字幕
//   this.setState({buffer, aSteps});
//   this.bufferToPeaks();
// }