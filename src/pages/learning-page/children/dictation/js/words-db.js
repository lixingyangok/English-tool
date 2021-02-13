/*
 * @Author: 李星阳
 * @LastEditors: 李星阳
 * @Description: 
 */ 

import {setWrods} from 'common/js/learning-api.js';

export default class {
	// ▼控制词库窗口可见性
	showWordsDialog(){
		this.setState({visible: true});
	}
	// ▼得到字母表 a,b,c.....
	getAlphabet(){
		return [...Array(26).keys()].map(cur=>String.fromCharCode(97 + cur));
	}
	// ▼
	checkWordsDB(oWordsDB){
		const aAlphabet = this.getAlphabet();
		aAlphabet.forEach(async (cur, idx)=>{
			oWordsDB.version(idx+1).stores({[cur]: '++id, word'});
		});
		const aWordsDBState = [];
		aAlphabet.forEach(async (cur, idx)=>{
			const iRes = await oWordsDB[cur].count();
			aWordsDBState.push(iRes);
			if (idx<25) return;
			this.setState({aWordsDBState})
		});
	}
	// ▼初始 26 个英文字母
	async initWordsDB(){
		const {oWordsDB} = this.state;
		const aAlphabet = this.getAlphabet();
		const wordArr = [];
		const promiseArr = aAlphabet.map(async (cur, idx)=>{
			const res = await fetch(`/static/text/${cur}.txt`, {
				headers: {"Content-Type": "application/json"},
				credentials: "same-origin",
			});  //.then(async res=>await res.text()).catch(()=>false)
			wordArr[idx] = await res.text();
			return true;
		});
		await Promise.all(promiseArr);
		for (let idx = 0; idx < aAlphabet.length; idx++) {
			await new Promise(fn=>setTimeout(()=>fn(), 500));
			const curLetter = aAlphabet[idx];
			const wordArrToTb = wordArr[idx].split(/\n/).filter(Boolean).map((word,id)=>({word, id}));
			const curTB = oWordsDB[curLetter];
			await curTB.clear();
			await curTB.bulkAdd(wordArrToTb);
            this.message.success(`初始化完成 ${curLetter}`);
            if (idx===25) this.checkWordsDB();
        }
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
		this.setState({sSearching: ''});
		const sSearching = window.getSelection().toString().trim();
		if (!sSearching) return;
		this.setState({sSearching});
		this.saveWord(sSearching);
	}
	// ▼保存生词到云
	async saveWord(sSearching='') {
		const {oStory, aWords, aNames} = this.state; //oStoryTB,
		const sWord = sSearching || window.getSelection().toString().trim();
		const canSave = this.checkWord(sWord, !sSearching);
		if (!canSave) return;
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
		const {aWords, aNames} = this.state; //oStoryTB,
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
