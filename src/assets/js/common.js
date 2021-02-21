/*
 * @Author: 李星阳
 * @Date: 2021-02-14 15:52:51
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-02-21 14:33:15
 * @Description: 
 */

// ▼得到字母表 a,b,c.....
export const aAlphabet = [...Array(26).keys()].map(cur=>{
	return String.fromCharCode(97 + cur);
});

export const trainingDB = (()=>{
	// console.log('trainingDB ★★:\n', new Date().toLocaleString());
	const oResult = new window.Dexie("trainingDB");
	oResult.version(1).stores({story: '++id, ID, storyName, storyId'});
	oResult.version(2).stores({media: '++id, ID, fileName'}); //fileId
	return oResult;
})();

export const wordsDB = (()=>{
	// console.log('wordsDB ▲▲:\n', new Date().toLocaleString());
	const oResult = new window.Dexie("wordsDB");
	aAlphabet.forEach((cur, idx)=>{
		oResult.version(idx+1).stores({[cur]: '++id, word'});
	});
	return oResult;
})();

export function timeAgo(iTimeStamp){
	const iNowTs = new Date().getTime();
	const iGapTime = iNowTs - iTimeStamp;
	if (iGapTime < 0) return '';
	const minute = 1000 * 60;      // 把分，时，天，周，半个月，一个月用毫秒表示
	const hour = minute * 60;
	const day = hour * 24;
	const week = day * 7;
	const month = day * 30;
	const minC = iGapTime / minute;  //计算时间差的分，时，天，周，月
	const hourC = iGapTime / hour;
	const dayC = iGapTime / day;
	const weekC = iGapTime / week;
	const monthC = iGapTime / month;
	if(monthC >= 1 && monthC <= 3){
		return `${parseInt(monthC)}月前`;
	}else if(weekC >= 1 && weekC <= 3){
		return `${parseInt(weekC)}周前`;
	}else if(dayC >= 1 && dayC <= 6){
		return `${parseInt(dayC)}天前`;
	}else if(hourC >= 1 && hourC <= 23){
		return `${parseInt(hourC)}小时前`;
	}else if(minC >= 1 && minC <= 59){
		return `${parseInt(minC)}分钟前`;
	}else if(iGapTime >= 0 && iGapTime <= minute){
		return "刚刚";
	}
	const oData = new Date(iTimeStamp);
	const Nyear = oData.getFullYear();
	const Nmonth = String(oData.getMonth() + 1).padStart(2, 0);
	const Ndate = String(oData.getDate()).padStart(2, 0);
	// const Nhour = String(oData.getHours()).padStart(2, 0); // const Nminute = String(oData.getMinutes()).padStart(2, 0); // const Nsecond = String(oData.getSeconds()).padStart(2, 0);
	return `${Nyear}-${Nmonth}-${Ndate}`;
}
