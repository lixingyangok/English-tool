/*
 * @Author: 李星阳
 * @LastEditors: 李星阳
 * @Description: 
 */
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { mix } from './common/common.js';
import axios from 'common/lib/js/ajax.js';
// ▼样式
import 'assets/style/global.css'
const store = require('store');

Object.defineProperties(window, {
	mix: {
		writable: false,
		value: mix,
	},
	store: {
		writable: false,
		value: store,
	},
	axios: {
		writable: false,
		value: axios,
	},
});

Object.defineProperties(Object.prototype, { // eslint-disable-line
	dc_: { // deep copy = 深拷贝
		get: function () {
			// console.time('%c克隆耗时■■■');
			function toClone(source) {
				const isNeed = source && typeof source == 'object' && source instanceof Object;
				if (!isNeed) return source; //不处理值类型，即忽略非数组、非对象
				const newObj = new source.constructor();
				const iterator = Array.isArray(source) ? source.entries() : Object.entries(source);
				for (let [key, val] of iterator) {
					newObj[key] = val instanceof Object ? toClone(val) : val;
				}
				return newObj;
			}
			const result = (() => {
				try {return toClone(this)} 
				catch (err) {console.error('拷贝没成功', err)}
				return JSON.parse(JSON.stringify(this));
			})();
			// console.timeEnd('%c克隆耗时■■■');
			return result;
		},
	},
});

Object.defineProperties(Array.prototype, { // eslint-disable-line
	last_: { // 取数组末位
		get: function () {
			return this[this.length - 1] || null;
		},
	},
});

Date.prototype.format = function (fmt) {  // eslint-disable-line
	var o = {
		"M+": this.getMonth() + 1,                 //月份 
		"d+": this.getDate(),                    //日 
		"h+": this.getHours(),                   //小时 
		"m+": this.getMinutes(),                 //分 
		"s+": this.getSeconds(),                 //秒 
		"q+": Math.floor((this.getMonth() + 3) / 3), //季度 
		"S": this.getMilliseconds()             //毫秒 
	};
	if (/(y+)/.test(fmt)) {
		fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
	}
	for (var k in o) {
		if (new RegExp("(" + k + ")").test(fmt)) {
			fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
		}
	}
	return fmt;
}

ReactDOM.render(
	// <React.StrictMode>
	<App />,
	// </React.StrictMode>,
	document.getElementById('root'),
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
