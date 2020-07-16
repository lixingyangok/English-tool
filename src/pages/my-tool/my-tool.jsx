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
      aLines: [oFirstLine.dc_], //字幕
    }],
    iCurStep: 0, //当前步骤
    oTarget: {}, // 故事信息如：故事id、章节id
    oStoryTB: {}, // 表-存故事
    oSectionTB: {}, // 表-存章节
    oStory: {}, // DB中的故事数据
    oSct: {}, // DB中的章节数据
    aWords: [],
    sTyped: '', //输入的，用于搜索
    aMatched: [],
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
    Object.assign(this.state, {oStoryTB, oSectionTB, oTarget});
    if (Object.keys(oTarget).length) this.init(oTarget);
  }
  render() {
    const {
      aSteps, iCurStep, iCanvasHeight,
      duration, fileSrc, playing, fPerSecPx,
      aWords, sTyped,
    } = this.state;
    const {aLines, iCurLine} = aSteps[iCurStep];
    return <cpnt.Div>
      <audio src={fileSrc} ref={this.oAudio}/>
      <Spin spinning={this.state.loading} size="large"/>
      <cpnt.WaveBox>
        <canvas height={iCanvasHeight} ref={this.oCanvas}/>
        <cpnt.WaveWrap ref={this.oWaveWrap} onScroll={() => this.onScrollFn()}>
          <cpnt.TimeBar style={{width: `${fPerSecPx * duration}px`}}
            onContextMenu={ev => this.clickOnWave(ev)} onMouseDown={ev=>this.mouseDownFn(ev)}
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
                // console.log(start, long);
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
      <cpnt.TextBox>
        {aSteps.map((cur,idx)=>{
          return <span key={idx} className={iCurStep === idx ? 'cur' : ''} 
            onClick={()=>console.log('步骤',idx, cur)}
          >
            {idx}
          </span>
        })}
      </cpnt.TextBox>
      {/* 分界 */}
      <Nav commander={(sFnName, ...aRest)=>this.commander(sFnName, aRest)} />
      {/* 分界 */}
      {this.getInfoBar()}
      <cpnt.InputWrap>
        {(() => {
          if (!aLines[iCurLine]) return <span />;
          // innerRef={dom => this.oTextArea = dom}
          return <TextArea value={(aLines[iCurLine] || {}).text}
            ref={this.oTextArea}
            id="myTextArea"
            onChange={ev => this.valChanged(ev)}
            onKeyDown={ev => this.enterKeyDown(ev)}
          />;
        })()}
      </cpnt.InputWrap>
      <cpnt.Words>
        {this.getWordsList(sTyped)}
      </cpnt.Words>
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
    </cpnt.Div>;
  }
  // ▲render
  getInfoBar(){
    const {oStory, oSct, buffer} = this.state;
    if (!Object.keys(oSct).length) return;
    const {aLines=[], audioFile={}, srtFile={}} = oSct;
    return <cpnt.InfoBar>
      <span>故事：{oStory.name}</span>
      <span>音频：{audioFile.name}</span>
      <span>时长：{buffer.sDuration_}</span>
      <span>字幕：{srtFile.name}</span>
      <span>句子数量：{aLines.length || 0}句</span>
      <span onClick={()=>this.getLineAndGo()} >最后一行</span>
    </cpnt.InfoBar>
  }
  getWordsList(sTyped='', getArr=false){
    const {aWords} = this.state;
    const aMatched = (()=>{
      if (!sTyped) return aWords;
      return aWords.filter((cur='')=>{
        return cur.toLocaleLowerCase().startsWith(sTyped.toLocaleLowerCase());
      })
    })();
    if (getArr) return aMatched;
    // this.setState({aMatched});
    return aMatched.map((cur, idx)=>{
      return <span key={idx} onClick={()=>this.delWord(cur)} >
        <small>{idx+1}</small><em>{cur}</em>
      </span>
    });
  }
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
    this.setState = (state, callback) => {return};
    // ReactDOM.unmountComponentAtNode(document.getElementById("tool"));
  }
  async init({storyId, sctId}){
    const {oStoryTB, oSectionTB, aSteps} = this.state;
    const [oStory, oSct] = await Promise.all([
      oStoryTB.get(storyId*1), oSectionTB.get(sctId*1),
    ]);
    if (!oStory || !oSct) return;
    const buffer = {
      ...oSct.buffer,
      aChannelData_: await oSct.buffer.oChannelDataBlob_.arrayBuffer().then(res=>{
          return new Int8Array(res)
      }),
    };
    const fileSrc = URL.createObjectURL(oSct.audioFile);
    if (oSct.aLines.length) aSteps.last_.aLines = oSct.aLines; //字幕
    this.setState({fileSrc, buffer, aSteps, oStory, oSct, aWords: oStory.aWords});
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
