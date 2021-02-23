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
		const {altKey, ctrlKey, shiftKey, wheelDeltaY, deltaY} = ev;
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
		// console.log('监听到滚动');
		this.debounceFn();
		let {buffer, iPerSecPx} = this.state;
		let {offsetWidth, scrollLeft} = this.oWaveWrap.current;
		const {aPeaks, fPerSecPx} = this.getPeaks(
			buffer, iPerSecPx, scrollLeft, offsetWidth,
		);
		this.toDraw(aPeaks);
		const newObj = {aPeaks};
		if (fPerSecPx !== this.state.fPerSecPx) newObj.fPerSecPx = fPerSecPx;;
		this.setState(newObj);
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
		const {iPerSecPx: perSecPxOld, buffer} = this.state;
		const {deltaY, clientX = window.innerWidth / 2} = ev;
		const [min, max, iStep] = [20, 250, 20]; //每秒最小/大宽度（px），缩放步幅
		// ▼说明：小到头了就不要再缩小了，大到头了也就要放大了
		if (deltaY > 0 ? perSecPxOld <= min : perSecPxOld >= max){
			return this.setState({drawing: false});
		}
		const oWaveWrap = this.oWaveWrap.current;
		const {parentElement:{offsetLeft}, children:[markBar]} = oWaveWrap;
		const iPerSecPx = (() => { //新-每秒宽度
			const result = perSecPxOld + iStep * (deltaY <= 0 ? 1 : -1);
			if (result < min) return min;
			else if (result > max) return max;
			return result;
		})();
		const fPerSecPx = (()=>{ // 新-每秒宽度（精确）
			const sampleSize = ~~(buffer.sampleRate / iPerSecPx); // 每一份的点数 = 每秒采样率 / 每秒像素
			return buffer.length / sampleSize / buffer.duration; 
		})();
		markBar.style.width = fPerSecPx * buffer.duration + 'px';
		const iNewLeftPx = this.getPointSec({clientX}) * fPerSecPx - (clientX - offsetLeft);
		oWaveWrap.scrollLeft = iNewLeftPx;
		this.oPointer.current.style.left = `${this.oAudio.current.currentTime * fPerSecPx}px`;
		this.setState({iPerSecPx, drawing: true});
		if (iNewLeftPx<=0) this.onScrollFn();
	}
	// 改变波形高度
	changeWaveHeigh(deltaY) {
		let { iHeight } = this.state;
		const [min, max, iStep] = [0.1, 3, 0.2];
		if (deltaY >= 0) iHeight += iStep;
		else iHeight -= iStep;
		if (iHeight < min) iHeight = min;
		if (iHeight > max) iHeight = max;
		this.setState({ iHeight });
		this.toDraw();
	}
	changeVideoSize(ev){ 
		const {deltaY, target, target:{offsetWidth}} = ev; // 推轮 deltaY=负值，拉得正值
		const [min, max] = [250, 700];
		let iWidth = offsetWidth + (deltaY * -1 * 0.5);
		if (iWidth<min) iWidth = min;
		else if (iWidth>max) iWidth = max;
		target.width = iWidth;
	}
	setSpanArr(){
		const aWordDom = this.oTextBg.current.querySelectorAll('.word');
		if (!aWordDom[0]) return this.aWordDom = [];
		this.aWordDom = [...aWordDom];
		// .map((dom, idx)=>{
		// 	const {top, left} = dom.getBoundingClientRect();
		// 	const {offsetWidth: width, offsetHeight: height, innerText} = dom;
		// 	return { dom, top, left, width, height, innerText, idx };
		// });
		// console.log(aWordDom[0]);
	}
	mouseMoveFn(ev){
		clearTimeout(this.wordHoverTimer);
		const {aWordDom} = this;
		if (!aWordDom.length) return;
		const {x: evX, y: evY} = ev;
		const iBright = aWordDom.findIndex(cur=>{
			const { top, bottom, left, right } = cur.getBoundingClientRect();
			return (
				(evX > left && evX < right) && (evY > top && evY < bottom)
			);
		});
		// console.log('有目标：', !!oTarget);
		if (iBright < 0 || iBright === this.state.iBright) return;
		this.wordHoverTimer = setTimeout(()=>{
			this.setState({iBright});
		}, 250);
	}
}

function aa (){
	// 防抖
	function debounce(fn, wait) {    
		var timeout = null;    
		return function() {        
			if(timeout !== null)   clearTimeout(timeout);        
			timeout = setTimeout(fn, wait);    
		}
	}
	// 处理函数
	function handle() {    
		console.log(Math.random()); 
	}
	// 滚动事件
	window.addEventListener('scroll', debounce(handle, 1000));
}
if (0) aa();