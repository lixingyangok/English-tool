/*
 * @Author: 李星阳
 * @Date: 2020-09-18 20:44:43
 * @LastEditors: 李星阳
 * @LastEditTime: 2020-12-27 19:01:46
 * @Description: 
 */
import axios from 'axios';

const myAxios = axios.create({
	// withCredentials: true, //添加此项以便跨域，值为true无法上传到七牛
	timeout: 1000 * 30, //30秒超时
	'Cache-Control': 'no-cache', // 不要缓存
	'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', // 
	// 'Content-Type': 'application/json', // 
});

const setting = {}; // 保存每次请求的设定

// ▼请求拦截器
myAxios.interceptors.request.use(config => {
	if (config.url.startsWith('/')) config.url = '/api' + config.url;
	const mySitting = setting[config.url] || {};
	// 将参数转 form 格式数据
	if (['put', 'post', 'patch'].includes(config.method)) {
		config.data = dataToFormData(config.data);
	}
	config.timeout = mySitting.timeout || config.timeout; // 特定接口加长延时
	// console.log('config设置\n', config);
	return config;
}, error => {
	return Promise.reject(error);
});

// ▼响应拦截器
myAxios.interceptors.response.use(response => {
	// console.log('response', response);
	return response.data;
});

export default myAxios;

// ▼转formData
function dataToFormData(oData){
	const oFormData = new FormData();
	for (const [key, val] of Object.entries(oData)) {
		if (Array.isArray(val)) { //是
			for (const oneItem of val) oFormData.append(key, oneItem);
		} else {
			oFormData.append(key, val);
		}
	}
	return oFormData;
}
