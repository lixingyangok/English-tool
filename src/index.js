/*
 * @Author: 李星阳
 * @LastEditors: 李星阳
 * @Description: 
 */
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import * as serviceWorker from './serviceWorker';
import global from 'assets/js/global.js';
// ▼样式
import 'assets/style/global.css';
import 'assets/style/rewrite-antd.css';

global();
window.axios.get('/open/session');

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
