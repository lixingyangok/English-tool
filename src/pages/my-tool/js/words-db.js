/*
 * @Author: 李星阳
 * @LastEditors: 李星阳
 * @Description: 
 */ 

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
            if (idx==25) this.checkWordsDB();
        }
	}
}