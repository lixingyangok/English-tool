/*
 * @Author: 李星阳
 * @LastEditors: 李星阳
 * @Description: 
 */ 

import {setWrods} from 'common/js/learning-api.js';

export default class {
	getAlphabet(){
		return [...Array(26).keys()].map(cur=>String.fromCharCode(97 + cur));
	}
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
	// ▼词库
	showWordsDialog(){
		this.setState({visible: true});
	}
	// ▼清空词库
	cleanWordsList(){
		const onOk = ()=>{
			const {oStory} = this.state;
			this.setState({aWords: []});
			setWrods(oStory.ID, []);
		};
		this.confirm({
			title: '清空后不可恢复，欢乐祥瑞清空？', 
			okText: '确定', cancelText: '取消',
			onOk, onCancel: ()=>null,
		});
		this.setState({visible: true});
	}
	// ▼保存生词到DB
	saveWord() {
		const {error} = this.message;
		const {oStory, aWords} = this.state; //oStoryTB,
		const sWord = window.getSelection().toString().trim();
		if (sWord.length < 2 || sWord.length > 30) {
			return error(`单词长度不在合法范围（2-30字母）`);
		}
		if (sWord.includes(',')) return error('不能包含英文逗号');
		if (aWords.includes(sWord)) return error(`已经保存不可重复添加`);
		aWords.push(sWord);
		this.setState({aWords});
		setWrods(oStory.ID, aWords);
		this.message.success(`保存成功`);
	}
	// ▼删除一个保存的单词
	delWord(sWord) {
		let {oStory, aWords} = this.state;
		aWords = aWords.filter(cur => cur !== sWord);
		this.setState({ aWords });
		setWrods(oStory.ID, aWords);
		this.message.success(`保存成功`);
	}
}