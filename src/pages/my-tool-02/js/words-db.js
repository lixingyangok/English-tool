/*
 * @Author: 李星阳
 * @LastEditors: 李星阳
 * @Description: 
 */ 

const { axios } = window;

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
			let {oTarget:{storyId}, oStoryTB} = this.state;
			this.setState({aWords: []});
			oStoryTB.update(storyId*1, {aWords: []});
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
		const { oStory } = this.state; //oStoryTB,
		const sWord = window.getSelection().toString().trim();
		if (sWord.includes(',')) {
			return this.message.error('不能包含英文逗号');
		}
		const comma = oStory.words ? ',' : '';
		const words = `${oStory.words}${comma}${sWord}`;
		axios.put('/story/set-words', {
			storyId: oStory.ID,
			words,
		});
		// const aWords = oStory.aWords || [];
		// if ((sWord.length < 2 || sWord.length > 30) || aWords.includes(sWord)) {
		// 	this.message.error(`已经保存不可重复添加，或单词长度不在合法范围（2-30字母）`);
		// 	return; //不要重复保存
		// }
		// aWords.push(sWord);
		// oStoryTB.update(oStory.id, { aWords }); //增量更新本地数据
		// this.setState({ aWords });
		// this.message.success(`保存成功`);
	}
	// ▼删除一个保存的单词
	delWord(sWord) {
		const { oStoryTB, oStory } = this.state;
		const aWords = this.state.aWords.filter(cur => cur !== sWord);
		this.setState({ aWords });
		oStoryTB.update(oStory.id, { aWords }); //增量更新
		this.message.success(`保存成功`);
	}
}