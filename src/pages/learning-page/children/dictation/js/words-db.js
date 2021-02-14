/*
 * @Author: 李星阳
 * @LastEditors: 李星阳
 * @Description: 
 */ 

import {setWrods} from 'common/js/learning-api.js';
import {wordsDB, aAlphabet} from 'common/js/common.js'

export default class {
	// ▼控制词库窗口可见性
	showWordsDialog(){
		this.setState({visible: true});
	}
	// ▼检查词库是否已生效（页面一加载就执行）
	async checkWordsDB(){
		const arr = aAlphabet.map(async (cur)=>{
			return await wordsDB[cur].count();
		});
		const aWordsDBState = await Promise.all(arr);
		if (aWordsDBState.length===26 && aWordsDBState.every(Boolean)){
			this.setState({aWordsDBState})
			return;
		}
		this.confirm({ title: '初始化单词库？', 
			okText: '确定',
			cancelText: '取消',
			onOk: ()=>this.initWordsDB(),
		});
	}
	// ▼初始化词库
	async initWordsDB(){
		const setOneLetter = async (sLetter, sWords) => {
			const aWords = sWords.split(/\s+/).map((word, id)=>({word, id}));
			await wordsDB[sLetter].clear();
			await wordsDB[sLetter].bulkAdd(aWords);
            this.message.success(`初始化完成 ${sLetter}`);
		};
		for (const cur of aAlphabet) {
			const res = await fetch(`/static/text/${cur}.txt`, {
				headers: {"Content-Type": "application/json"},
				credentials: "same-origin",
			});
			const text = await res.text();
			await setOneLetter(cur, text.trim());
		}
		this.checkWordsDB();
	}
	// ▼清空词库
	cleanWordsList(){
		const onOk = async ()=>{
			const {oStory} = this.state;
			await setWrods(oStory.ID, 'words', []);
			await setWrods(oStory.ID, 'names', []);
			this.context.updateStoryInfo();
			this.setState({aWords: [], aNames: []});
		};
		this.confirm({
			title: '清空后不可恢复，欢乐祥瑞清空？', 
			okText: '确定', cancelText: '取消',
			onOk, onCancel: ()=>null,
		});
		this.setState({visible: true});
	}
	// ▼搜索
	async searchWord() {
		const sSearching = window.getSelection().toString().trim();
		if (!sSearching) return;
		this.saveWord(sSearching);
		this.setState({sSearching: ''}, ()=>{
			this.setState({sSearching});
		});
	}
	// ▼保存生词到云
	async saveWord(sSearching='') {
		const {oStory, aWords, aNames} = this.state;
		const sWord = sSearching || window.getSelection().toString().trim();
		const canSave = this.checkWord(sWord, !sSearching);
		const tooMuchSpace = (sWord.match(/\s/g) || []).length >= 2;
		if (!canSave || tooMuchSpace) return;
		// ▲通过考验，▼保存
		const isCapitalize = /[A-Z]/.test(sWord[0]);
		const sKey = isCapitalize ? 'names' : 'words'; // 如大写字母开头视为专有名词
		const arrToSubmit = isCapitalize ? aNames : aWords;
		arrToSubmit.push(sWord);
		this.setState({aWords, aNames});
		this.message.success(`保存成功`);
		await setWrods(oStory.ID, sKey, arrToSubmit);
		this.context.updateStoryInfo();
	}
	checkWord(sWord, showTip){
		const {aWords, aNames} = this.state;
		const aAll = aWords.concat(aNames);
		const {error} = this.message;
		if (aAll.find(cur => cur.toLowerCase() === sWord.toLowerCase())) {
			showTip && error(`已经保存不可重复添加`);
			return;
		}
		if (sWord.length < 2 || sWord.length > 30) {
			showTip && error(`单词长度超出范围：2-30字母`);
			return;
		}
		if (sWord.includes(',')) {
			showTip && error('不能包含英文逗号');
			return;
		}
		return true;
	}
	// ▼删除一个保存的单词
	async delWord(sKey, sWord) {
		const {oStory} = this.state;
		const keyName = {names: "aNames", words: "aWords"}[sKey];
		const arrToSubmit = this.state[keyName].filter(cur => {
			return cur !== sWord;
		});
		this.setState({[keyName]: arrToSubmit});
		await setWrods(oStory.ID, sKey, arrToSubmit);
		this.message.success(`保存成功`);
		this.context.updateStoryInfo();
	}
}
