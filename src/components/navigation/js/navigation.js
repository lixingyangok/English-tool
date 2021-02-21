/*
 * @Author: 李星阳
 * @Date: 2021-02-14 12:24:53
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-02-21 14:45:43
 * @Description: 
 */
import React from "react";

function MyDiv (props){
	return <div className="center-box" >
		<br/>
		<br/>
		<h1>MyDiv的参数：{props.mark}</h1>
	</div>
}

const oListPage = {
	name: '所有资源',
	path: '/list/:type',
	pathRoot_: '/list/-1',
	component: React.lazy(() => import('pages/learning-data/children/story-list/story-list.jsx')),
};

export const aLearningData = [
	oListPage,
	{
		...oListPage,
		name: '听写',
		pathRoot_: '/list/1',
	},
	{
		...oListPage,
		name: '阅读',
		pathRoot_: '/list/2',
	},
];

export const dictationPath = 'dictation';
export const readingPath = 'reading';

export const aLearningPage = [{
	name: '列表',
	path: '/list',
	// component: MyDiv, // 可用
	// component: ()=><MyDiv mark="123" />, // 可用
	// component: <MyDiv mark="123"/>, // ★★报错★★
	component: React.lazy(() => import('pages/learning-page/children/media-list/media-list.jsx')),
}, {
	name: '听写',
	path: `/${dictationPath}/:mediaId`, //:mediaId',
	pathRoot_: `/${dictationPath}`,
	isDictationPage_: true,
	component: React.lazy(() => import('pages/learning-page/children/dictation/dictation.jsx')),
}, {
	name: '阅读',
	path: `/${readingPath}/:mediaId`, //:mediaId',
	pathRoot_: `/${readingPath}`,
	component: React.lazy(() => import('pages/learning-page/children/reading/reading.jsx')),
}, {
	name: '词汇',
	path: '/words',
	// component: React.lazy(() => import('pages/learning-page/children/dictation/dictation.jsx')),
	component: ()=><MyDiv mark="789" />, // 可用
}];

export const aLocalData = [{
	name: '列表',
	path: '/list',
	component: React.lazy(() => import('pages/local-data/children/learning-history/learning-history.jsx')),
}, {
	name: '自习室',
	path: '/practicing',
	component: React.lazy(() => import('pages/local-data/children/my-tool/my-tool.jsx')),
}];

export const aNavData = [{
	name: '首页',
	path: '/index',
	component: React.lazy(() => import('pages/index/index.jsx')),
}, {
	name: '学习资料',
	path: '/learning-data',
	component: React.lazy(() => import('pages/learning-data/learning-data.jsx')),
	children: aLearningData,
}, {
	name: '学习历史',
	path: '/history',
	component: ()=><MyDiv mark="abc" />, // 可用
}, {
	name: '学习页面',
	path: '/learning-page/:storyId',
	hide_: true,
	component: React.lazy(() => import('pages/learning-page/learning-page.jsx')),
	children: aLearningPage,
}, {
	name: '本地数据',
	path: '/local-data',
	component: React.lazy(() => import('pages/local-data/local-data.jsx')),
	children: aLocalData,
}, {
	name: '关于',
	path: '/about',
	component: React.lazy(() => import('pages/about/about.jsx')),
}];
