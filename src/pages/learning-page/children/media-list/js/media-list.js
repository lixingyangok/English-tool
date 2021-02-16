/*
 * @Author: 李星阳
 * @Date: 2021-01-31 19:13:46
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-02-16 12:05:41
 * @Description: 
 */
import {dictationPath, readingPath} from 'common/components/navigation/js/navigation.js';

import {
	setWrods,
} from 'common/js/learning-api.js';
import {message} from 'antd';

export default class {
	// ▼跳到听写页
	goDictation(oMedia){
		const {oStory} = this.state;
		const sUrl = `/learning-page/${oStory.ID}/${dictationPath}/${oMedia.ID}`;
		this.props.history.push(sUrl);
	}
	// ▼跳到听写页
	goRead(oMedia){
		const {oStory} = this.state;
		const sUrl = `/learning-page/${oStory.ID}/${readingPath}/${oMedia.ID}`;
		this.props.history.push(sUrl);
	}
	// ▼搜索
	searchWord(sSearching){
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
	// ▼修改单词分类
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
