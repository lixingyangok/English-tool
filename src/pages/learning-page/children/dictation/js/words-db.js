/*
 * @Author: 李星阳
 * @LastEditors: 李星阳
 * @Description: 
 */ 
import React from "react";
import {setWrods} from 'assets/js/learning-api.js';
import {wordsDB, aAlphabet} from 'assets/js/common.js'
// import {Popover, Button} from 'antd';

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
		const tooMuchSpace = (sWord.match(/\s/g) || []).length >= 3; // 有2个空格得保存，如：Dulcinea del Toboso
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
		const keyName = {name: "aNames", 'new-word': "aWords"}[sKey];
		const arrToSubmit = this.state[keyName].filter(cur => {
			return cur !== sWord;
		});
		this.setState({[keyName]: arrToSubmit});
		await setWrods(oStory.ID, sKey, arrToSubmit);
		this.message.success(`保存成功`);
		this.context.updateStoryInfo();
	}
	handleVisibleChange (newVal){
		this.setState({iBright: newVal ? newVal : -1});
	};
	strToDom({txt, sClass=''}, idx){
		// const {iBright} = this.state;
		const {'0': body, index} = txt.match(/\w.*\w+/) || {'0': '', index: -1};
		const head = index===-1 ? txt : txt.slice(0, index) || '';
		const tail = index===-1 ? '' : txt.slice(index + body.length) || '';
		// if (iBright === idx) sClass += ' hover';
		return <span key={idx}>
			{head}
			{/* <Popover trigger="hover" placement="topLeft" 
				onVisibleChange={this.handleVisibleChange.bind(this)}
				visible={iBright === idx}
				content={<Button>按钮1</Button>}
			>
				<span className={sClass}>{body}</span>
			</Popover> */}
			<span className={'word ' + sClass}>{body}</span>
			{tail}
		</span>
	}
	
	// 
	markWords(sText=''){
		const {aWords, aNames} = this.state;
		const aText = sText.match(/\S+\s*/g) || [];
		const iLength = aText.length;
		// console.time('计时');
		const aWordsList = [];
		const regExp01 = /\S\w*/;
		const regExp011 = /[\w-]+/;
		const regExp02 = /\w.*/; // 用于 back01 & back02
		for (let idx = 0; idx < iLength; idx++) {
			if (idx === 0) {
				aWordsList.push({txt: aText[idx], sClass: ''});
				continue;
			}
			const cur = aText[idx];
			const sCurFixed = cur.match(regExp01)[0];
			const len = aWordsList.length;
			const sBack02Txt = (aWordsList[len - 2] || {}).txt || '';
			const sBack01Txt = aWordsList[len - 1].txt;
			const [isLonger, sClass, isGoBackTwo] = (()=>{
				const sBack02Fixed = (sBack02Txt.match(regExp02) || [''])[0];
				const longText = sBack02Fixed + sBack01Txt + sCurFixed;
				if (hasIn(aWords, longText)) return [true, 'new-word word-group', true];
				if (hasIn(aNames, longText)) return [true, 'name word-group', true];
				const sBack01Fixed = (sBack01Txt.match(regExp02) || [''])[0];
				const sNewOne = sBack01Fixed + sCurFixed;
				if (hasIn(aWords, sNewOne)) return [true, 'new-word word-group'];
				if (hasIn(aNames, sNewOne)) return [true, 'name word-group'];
				return [false, ''];
			})();
			if (isLonger) {
				if (isGoBackTwo){
					const txt = sBack02Txt + sBack01Txt + cur;
					aWordsList.splice(len - 2, 2, {txt, sClass});
				}else{
					aWordsList[len-1] = {txt: sBack01Txt + cur, sClass};
				}
			}else{
				const sCurFixed= (cur.match(regExp011) || [''])[0];
				let sClass = hasIn(aWords, sCurFixed) && 'new-word';
				if (!sClass) sClass = hasIn(aNames, sCurFixed) && 'name';
				aWordsList.push({txt: cur, sClass});
			}
		}
		// console.timeEnd('计时');
		const {'0': txt} = sText.match(/^\s+/) || [''];
		if (txt) aWordsList.unshift({txt});
		const aResult = aWordsList.map((oCur, idx)=>{
			return this.strToDom(oCur, idx);
		});
		return aResult;
	}
}

// ▼校验二参是否在一参中
function hasIn(arr, str){
	// 如人名是 li da 且被收藏，再输入 li 会被点亮，要注意
	const strLower = str.toLowerCase();
	for (let idx = arr.length; idx--;){
		if (arr[idx].toLowerCase() === strLower) {
			return true;
		}
	}
}
// ▼校验二参是否在一参中
function checkInArr(arr, str01, str02){
	str01 = str01.toLowerCase();
	str02 = str02.toLowerCase();
	for (let idx = arr.length; idx--;){
		const cur = arr[idx].toLowerCase();
		if (cur === str01 || cur === str02) {
			return cur;
		}
	}
}

if (0) console.log(checkInArr);

// const aWordsList = aText.reduce((aResult, cur, idx)=>{
// 	if (idx === 0) return [{txt: cur, sClass: ''}];
// 	const len = aResult.length;
// 	const sBack02Txt = (aResult[len - 2] || {}).txt || '';
// 	const sBack01Txt = aResult[len - 1].txt;
// 	const {'0': sCurFixed} = cur.match(/\S+/) || [''];
// 	// ▼开始计算
// 	let [isLonger, isIn, sClass] = [false, false, ''];
// 	if (len>=2){
// 		[isLonger, sClass] = (()=>{
// 			if (len < 2) return [false, ''];
// 			const {'0': sBack02Fixed} = sBack02Txt.match(/\w.*/) || [''];
// 			const longText = sBack02Fixed + sBack01Txt + sCurFixed;
// 			if (hasIn(aWords, longText)) return [true, 'new-word word-group'];
// 			if (hasIn(aNames, longText)) return [true, 'name word-group'];
// 			return [false, ''];
// 		})();
// 	}
// 	// ▲短-长▼
// 	[isIn, sClass] = (()=>{
// 		if (isLonger) return [false, sClass];
// 		const {'0': sBack01Fixed} = sBack01Txt.match(/\w.*/) || [''];
// 		const sNewOne = sBack01Fixed + sCurFixed;
// 		if (hasIn(aWords, sNewOne)) return [true, 'new-word word-group'];
// 		if (hasIn(aNames, sNewOne)) return [true, 'name word-group'];
// 		return [false, ''];
// 	})();
// 	if (isLonger) {
// 		const txt = sBack02Txt + sBack01Txt + cur;
// 		aResult.splice(len - 2, 2, {txt, sClass});
// 	}else if (isIn){
// 		aResult[len-1] = {txt: sBack01Txt + cur, sClass};
// 	}else{
// 		sClass = hasIn(aWords, sCurFixed) && 'new-word';
// 		if (!sClass) sClass = hasIn(aNames, sCurFixed) && 'name';
// 		aResult.push({txt: cur, sClass});
// 	}
// 	return aResult;
// }, []);