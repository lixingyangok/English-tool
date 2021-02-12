/*
 * @Author: 李星阳
 * @Date: 2021-01-31 19:13:46
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-02-12 21:50:09
 * @Description: 
 */
import {
	getStoryInfo, setWrods,
} from 'common/js/learning-api.js';
import {message} from 'antd';

export default class {
	// ▼格式化 search
	getSearchOjb(oLocation){
		const sSearch = oLocation.search;
		if (!sSearch) return {};
		const oResult = sSearch.slice(1).split('&').reduce((result, cur)=>{
			const [key, val] = cur.split('=');
			return {...result, [key]: val};
		}, {});
		return oResult;
	}
	// ▼初始化的方法（查询故事信息并保存）
	async init(storyId){
		const {oStoryTB} = this.state;
		const [{data: oStory}, oStoryFromTB] = await Promise.all([
			getStoryInfo(storyId), // 故事信息
			oStoryTB.where('ID').equals(storyId*1).first(), //故事信息【本地】
		]);
		if (!oStory) return; // 查不到故事故事，返回
		// console.log('故事信息', oStory);
		this.setState({oStory});
		if (oStoryFromTB) { // 更新本地故事数据
			oStoryTB.put({...oStory, id: oStoryFromTB.id}); //全量更新
		}else{
			oStoryTB.add(oStory);
		}
	}
	goDictation(oMedia){
		const {oStory} = this.state;
		const sUrl = `/learning-page/${oStory.ID}/dictation/${oMedia.ID}`;
		this.props.history.push(sUrl);
	}
	timeAgo(dateTimeStamp){
		const iNowTs = new Date().getTime();
		const diffValue = iNowTs - dateTimeStamp;
		if (diffValue < 0) return '';
		const minute = 1000 * 60;      // 把分，时，天，周，半个月，一个月用毫秒表示
		const hour = minute * 60;
		const day = hour * 24;
		const week = day * 7;
		const month = day * 30;
		const minC = diffValue / minute;  //计算时间差的分，时，天，周，月
		const hourC = diffValue / hour;
		const dayC = diffValue / day;
		const weekC = diffValue / week;
		const monthC = diffValue / month;
		let result = '';
		if(monthC >= 1 && monthC <= 3){
			result = " " + parseInt(monthC) + "月前";
		}else if(weekC >= 1 && weekC <= 3){
			result = " " + parseInt(weekC) + "周前";
		}else if(dayC >= 1 && dayC <= 6){
			result = " " + parseInt(dayC) + "天前";
		}else if(hourC >= 1 && hourC <= 23){
			result = " " + parseInt(hourC) + "小时前";
		}else if(minC >= 1 && minC <= 59){
			result =" " + parseInt(minC) + "分钟前";
		}else if(diffValue >= 0 && diffValue <= minute){
			result = "刚刚";
		}else {
			const oData = new Date(dateTimeStamp);
			const Nyear = oData.getFullYear();
			const Nmonth = String(oData.getMonth() + 1).padStart(2, 0);
			const Ndate = String(oData.getDate()).padStart(2, 0);
			// const Nhour = String(oData.getHours()).padStart(2, 0);
			// const Nminute = String(oData.getMinutes()).padStart(2, 0);
			// const Nsecond = String(oData.getSeconds()).padStart(2, 0);
			result = Nyear + "-" + Nmonth + "-" + Ndate;
		}
		return result;
	}
	searchWord(sSearching){
		console.log('调用了我');
		this.setState({sSearching, sPopWords: ''});
		// const url = ``;
		// window.open(url, '_blank');
	}
	// ▼复制文字到剪贴板
	copyWord(sWord){
		this.setState({sPopWords: ''});

		const {body} = document;
		const oInput = Object.assign(document.createElement('input'), {
			value: sWord, // 把文字放进 input 中，供复制
		});
		body.appendChild(oInput);
		oInput.select();  // 选中创建的input
		// ▼执行复制方法，该方法返回布尔值，表示复制的成功性
		const isCopyOk = document.execCommand('copy');
		if (isCopyOk) message.success('已复制到粘贴板');
		else message.error('复制失败');
		body.removeChild(oInput); // 操作中完成后 从Dom中删除创建的input
	}
	// ▼删除单词
	async delWord(sKey, sWord){
		this.setState({sPopWords: ''});
		const {oStory} = this.state;
		const aWordsFrom = oStory[sKey].split(',').filter(cur => cur !== sWord);
		const res = await setWrods(oStory.ID, sKey, aWordsFrom);
		if (!res) return;
		this.context.updateStoryInfo();
	}
	async switchWord(sKey, sWord){
		this.setState({sPopWords: ''});
		const {oStory} = this.state;
		const oppositeKey = ({words: 'names', names: 'words'}[sKey]);
		const aWordsFrom = oStory[sKey].split(',').filter(cur => cur !== sWord);
		const aWordsTo = oStory[oppositeKey].split(',').filter(Boolean);
		const hasInAim = aWordsTo.includes(sWord);
		if (hasInAim){
			const res = await setWrods(oStory.ID, sKey, aWordsFrom);
			if (res) this.context.updateStoryInfo();
			return;
		}
		aWordsTo.push(sWord); // 插入单词
		let res = await setWrods(oStory.ID, oppositeKey, aWordsTo);
		if (!res) return;
		res = await setWrods(oStory.ID, sKey, aWordsFrom);
		if (res) this.context.updateStoryInfo();
	}
}
