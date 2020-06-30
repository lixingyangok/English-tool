import React from "react";
import * as cpnt from "./style/my-tool-style.js";
import * as fn from "./js/my-tool-pure-fn.js";
import {Button, Spin} from "antd";
import coreFn from "./js/core-fn.js";
import keyDownFn from "./js/key-down-fn.js";
import MouseFn from './js/mouse-fn.js';
import fileFn from './js/file-fn.js';

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
    const oFirstLine = this.fixTime({start: 0.1, end: 5});
    this.state = {
      buffer: {}, //音频数据
      aPeaks: [], //波形数据
      duration: 0, //音频长度（秒
      playTimer: null, // 定时器
      iCurLine: 0, //当前行
      oFirstLine, //默认行
      aTimeLine: [oFirstLine], //字幕
      fileName: "", //文件名
      fileSrc: "", //文件地址
      fileSrcFull: "",
      iHeight: 50, // 波形高
      iCanvasHeight: 150, //画布高
      iPerSecPx: 55, //人为定义的每秒像素数
      fPerSecPx: 0, //实际每秒像素数
      drawing: false, //是否在绘制中（用于防抖
      loading: false, //是否在加载中（解析文件
      aHistory: [],
      iCurHst: 0,
    };
  }
  render() {
    const {
      buffer, aTimeLine, iCurLine, iCanvasHeight, aHistory,
      duration, iPerSecPx, fileSrc, // fPerSecPx,
    } = this.state;
    const sampleSize = ~~(buffer.sampleRate / iPerSecPx); // 每一份的点数 = 每秒采样率 / 每秒像素
    const fPerSecPx = buffer.length / sampleSize / duration;
    return (
      <cpnt.Div>
        <Spin spinning={this.state.loading} size="large"></Spin>
        <cpnt.WaveWrap ref={this.oWaveWrap}
          onScroll={() => this.onScrollFn()}
          style={{height: `${iCanvasHeight + cpnt.iScrollHeight}px`}}
        >
          <canvas height={iCanvasHeight} ref={this.oCanvas} />
          <audio src={fileSrc} ref={this.oAudio}/>
          <cpnt.TimeBar style={{width: `${fPerSecPx * duration}px`}}
            onContextMenu={ev => this.clickOnWave(ev)}
            onMouseDown={ev=>this.mouseDownFn(ev)}
          >
            <cpnt.MarkWrap className="mark-wrap" >
              {[...Array(~~duration).keys()].map((cur, idx) => {
                return <span className="second-mark" key={cur}
                  style={{width: fPerSecPx + "px", left: idx*fPerSecPx + "px"}}
                >
                  {cur}
                </span>;
              })}
            </cpnt.MarkWrap>
            <cpnt.RegionWrap>
              <i className="pointer" ref={this.oPointer}/>
              {aTimeLine.map(({ start, end }, idx) => {
                return <span key={idx}
                  className={idx === iCurLine ? "cur region" : "region"}
                  style={{left: `${start * fPerSecPx}px`, width: `${(end - start) * fPerSecPx}px`}}
                >
                  <span className="idx" >{idx + 1}</span>
                </span>
              })}
            </cpnt.RegionWrap>
          </cpnt.TimeBar>
        </cpnt.WaveWrap>
        {/* 上下分界 */}
        <cpnt.BtnBar>
          <div>
            <Button type="primary" onClick={() => this.toSave()}>
              保存到IndexedDB
            </Button>&nbsp;
            <Button onClick={() => this.toExport()}>
              导出.srt文件
            </Button>&nbsp;
            <label className="ant-btn" >
              导入文件
              <input style={{display: 'none'}} type="file" multiple="multiple"
                onChange={ev => this.toImport(ev)}
              />
            </label>
          </div>
        </cpnt.BtnBar>
        <ul>
          {aHistory.map((cur,idx)=>{
            return <li key={idx} style={{display: 'inline-block'}} >
              {idx}--&emsp;
            </li>;
          })}
        </ul>
        {/* 分界 */}
        <cpnt.InputWrap>
          {(() => {
            if (!aTimeLine[iCurLine]) return <span />;
            return <textarea value={(aTimeLine[iCurLine] || {}).text}
              ref={this.oTextArea}
              onChange={(ev) => this.valChanged(ev)}
              onKeyDown={(ev) => this.enterKeyDown(ev)}
            />;
          })()}
        </cpnt.InputWrap>
        {/* 分界 */}
        <cpnt.SentenceWrap ref={this.oSententList}>
          {aTimeLine.map((cur, idx) => {
            return <li className={`one-line ${idx === iCurLine ? "cur" : ""}`}
              key={idx} onClick={() => this.goLine(idx)}
            >
              <i className="idx" style={{width: `${String(aTimeLine.length || 0).length}em`}} >
                {idx + 1}
              </i>
              <span className="time">
                <em>{cur.start_}</em>&nbsp;-&nbsp;<em>{cur.end_}</em>
              </span>
              {cur.text}
            </li>;
          })}
        </cpnt.SentenceWrap>
      </cpnt.Div>
    );
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
    this.testFn();
  }
  // componentWillUpdate(nextProps, nextState) {
  //   const {aTimeLineOld} = this.state;
  //   const {aTimeLineNew} = nextState;
  //   if (aTimeLineOld==aTimeLineNew) return;
    
  //   console.log('componentWillUpdate', aTimeLineOld==aTimeLineNew);
  // }
  // ▼测试
  async testFn(){
    const buffer = await fn.getMp3();
    const sText = await fn.getText();
    const aTimeLine = this.getTimeLine(sText).slice(0, 13); //字幕
    this.setState({buffer, aTimeLine, fileSrc: fn.mp3Src});
    this.bufferToPeaks();
    this.toDraw();
  }
  // ▼音频数据转换波峰数据
  bufferToPeaks(perSecPx_, leftPoint = 0) {
    const oWaveWrap = this.oWaveWrap.current;
    const { offsetWidth, scrollLeft } = oWaveWrap;
    const { buffer, iPerSecPx } = this.state;
    const obackData = this.getPeaks(
      buffer, (perSecPx_ || iPerSecPx), scrollLeft, offsetWidth,
    );
    // ▲返回内容：{aPeaks, fPerSecPx, duration};
    this.setState({ ...obackData });
    return obackData.aPeaks;
  }
}
