/*
 * @Author: 李星阳
 * @LastEditors: 李星阳
 * @Description: 
 */

export default class {
  // ▼处理左键点击和拖动
  mouseDownFn(ev01) {
    if (ev01.button !== 0) return; // 只处理左键点击
    const oWaveWrap = this.oWaveWrap.current;
    const downPoint = ev01.clientX; // 把落点提前准备出来
    this.setTime('start', this.getPointSec(ev01));
    document.onmouseup = function () {
      oWaveWrap.onmousemove = () => 0;
    };
    oWaveWrap.onmousemove = ev02 => {
      console.log('拖动中');
      const keyName = ev02.clientX >= downPoint ? 'end' : 'start';
      this.setTime(keyName, this.getPointSec(ev02));
      ev02.preventDefault();
      ev02.stopPropagation();
      return false;
    };
  }
  // ▼处理右键点击事件
  clickOnWave(ev) {
    if (ev.button !== 2) return; // 只处理右键点击
    this.setTime('end', this.getPointSec(ev));
    ev.preventDefault();
    ev.stopPropagation();
    return false;
  }
  // ▼在波形上滚动滚轮
  wheelOnWave(ev) {
    const { altKey, ctrlKey, shiftKey, wheelDeltaY, deltaY } = ev;
    if (0) console.log(shiftKey, deltaY);
    if (ctrlKey) {
      this.zoomWave(ev);
    } else if (altKey) {
      this.changeWaveHeigh(wheelDeltaY);
    } else {
      this.scrollToFn(wheelDeltaY);
    }
    ev.preventDefault();
    ev.stopPropagation();
    ev.returnValue = false;
  }
  // 监听滚动
  onScrollFn() {
    let {buffer, iPerSecPx} = this.state;
    let {offsetWidth, scrollLeft} = this.oWaveWrap.current;
    const {aPeaks, fPerSecPx} = this.getPeaks(
      buffer, iPerSecPx, scrollLeft, offsetWidth,
    );
    this.setState({aPeaks, fPerSecPx});
    this.toDraw(aPeaks);
  }
  // ▼使其横向滚动
  scrollToFn(deltaY) {
    const oDom = this.oWaveWrap.current;
    const iLong = 350;
    const newVal = (() => {
      let oldVal = oDom.scrollLeft;
      if (deltaY >= 0) return oldVal - iLong;
      else return oldVal + iLong;
    })();
    oDom.scrollTo(newVal, 0);
  }
  // ▼横向缩放。接收一个事件对象
  zoomWave(ev){
    if (this.state.drawing) return; //防抖
    const {iPerSecPx: perSecPxOld, fPerSecPx, buffer} = this.state;
    const {deltaY, clientX = document.body.offsetWidth / 2} = ev;
    const [min, max, iStep] = [10, 250, 20]; //每秒最小/最大px
    if ((perSecPxOld<=min && deltaY>=0) || (perSecPxOld>=max && deltaY<=0)){
      return this.setState({drawing: false});
    }
    const oWaveWrap = this.oWaveWrap.current;
    const {offsetLeft, scrollLeft} = oWaveWrap;
    const iLeftPx = clientX - offsetLeft + scrollLeft; //鼠标左侧的px值
    const iNowSec = iLeftPx / fPerSecPx; //当前指向时间（秒）
    const iPerSecPx = (() => {
      const iDirection = iStep * (deltaY <= 0 ? 1 : -1);
      let result = perSecPxOld + iDirection;
      if (result < min) return min;
      else if (result > max) return max;
      return result;
    })();
    const sampleSize = ~~(buffer.sampleRate / iPerSecPx); // 每一份的点数 = 每秒采样率 / 每秒像素
    const fPerSecPx_ = buffer.length / sampleSize / buffer.duration;
    const iNewLeftPx = (iNowSec * fPerSecPx_) - (clientX - offsetLeft);
    this.setState({iPerSecPx, fPerSecPx_, drawing: true});
    oWaveWrap.scrollTo(iNewLeftPx, 0);
    this.oPointer.current.style.left = (()=>{
      const {currentTime} = this.oAudio.current;
      return `${currentTime * fPerSecPx_}px`;
    })();
    if (iNewLeftPx<=0) this.onScrollFn();
  }
  // 改变波形高度
  changeWaveHeigh(deltaY) {
    let { iHeight } = this.state;
    const [min, max, iStep] = [10, 350, 10];
    if (deltaY >= 0) iHeight += iStep;
    else iHeight -= iStep;
    if (iHeight < min) iHeight = min;
    if (iHeight > max) iHeight = max;
    this.setState({ iHeight });
    this.toDraw();
  }
}


