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
		const {iPerSecPx: perSecPxOld, buffer} = this.state;
		const {deltaY, clientX = window.innerWidth / 2} = ev;
		const [min, max, iStep] = [20, 250, 20]; //每秒最小/大宽度（px）， 变化步伐
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
	// ▼词库
	showDialog(){
		console.log(123);
		this.setState({visible: true});
	}
	// ▼ type='in', 'out'
	async exportWods(){
		const {oTarget, oStoryTB} = this.state;
		console.log(oTarget);
		const res = await oStoryTB.get(oTarget.storyId*1);
		console.log(res.aWords );
	}
	beforeUpload(file){
		console.log(file);
		return false;
	}
}


