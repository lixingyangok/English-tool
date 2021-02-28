/*
 * @Author: 李星阳
 * @Date: 2021-02-21 14:31:01
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-02-28 14:27:38
 * @Description: 
 */

import axios from 'assets/js/ajax.js';
const store = require('store');

export default function (){
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
		dc_: { // dc = deep copy = 深拷贝
			get: function () {
				try {
					return toClone(this);
				} catch (err) {
					console.error('拷贝未成功', err)
					return JSON.parse(JSON.stringify(this));
				}
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
}

function copyProperties(target, source) {
	for (let key of Reflect.ownKeys(source)) {
		if (key !== 'constructor' && key !== 'prototype' && key !== 'name' ) {
			let desc = Object.getOwnPropertyDescriptor(source, key);
			Object.defineProperty(target, key, desc);
		}
	}
}

function mix(...mixins) {
	class Mix {
		constructor() {
			for (let mixin of mixins) {
				copyProperties(this, new mixin()); // 拷贝实例属性
			}
		}
	}
	for (let mixin of mixins) {
		copyProperties(Mix, mixin); // 拷贝静态属性
		copyProperties(Mix.prototype, mixin.prototype); // 拷贝原型属性
	}
	return Mix;
}

function toClone(source) {
	if ((source instanceof Object) === false || typeof source !== 'object' || !source) {
		return source; // 不处理值类型，即忽略非数组、非对象
	}
	const newObj = new source.constructor();
	const iterator = Array.isArray(source) ? source.keys() : Object.keys(source);
	while (true) {
		const thisOne = iterator.next();
		if (thisOne.done) break;
		const key = thisOne.value;
		const val = source[key];
		newObj[key] = val instanceof Object ? toClone(val) : val;
	}
	return newObj;
}