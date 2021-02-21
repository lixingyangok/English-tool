/*
 * @Author: 李星阳
 * @Date: 2021-02-21 16:06:12
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-02-21 16:59:43
 * @Description: 
 */


export const oStoryType = {
	'-1': {
		name: '所有资源', 
		val: -1,
	},
	'0': {
		name: '默认', 
		val: 0,
	},
	'1': {
		name: '听写', 
		val: 1,
		color: '#87d068',
	},
	'2': {
		name: '阅读', 
		val: 2,
		color: '#b600b9',
	},
}

export const aStoryType = (()=>{
	const obj = JSON.parse(
		JSON.stringify(oStoryType),
	);
	delete obj['-1'];
	obj.length = Object.keys(obj).length;
	return Array.from(obj);
})();


