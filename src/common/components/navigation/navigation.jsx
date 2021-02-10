import React from "react";
import { NavLink, /* useLocation */ } from "react-router-dom";
import * as cpnt from './style/navigation.js';

export const aLearningData = [{
	name: '列表',
	path: '/list',
	component: React.lazy(() => import('pages/learning-data/children/story-list/story-list.jsx')),
}, {
	name: '自习室',
	path: '/practicing',
	component: React.lazy(() => import('pages/my-tool-02/my-tool.jsx')),
}, {
	name: '故事详情',
	path: '/story-info',
	hide_: true,
	component: React.lazy(() => import('pages/learning-data/children/story-info/story-info.jsx')),
}];

// class A1 extends React.Component{
// 	constructor(props){
// 		super(props)
// 		console.log("props", props);
// 	}
// 	render(){
// 		return <div>{this.props.mark}</div>
// 	}
// }

function A2 (props){
	return <div>A2的参数：{props.mark}</div>
}

export const aLearningPage = [{
	name: '列表',
	path: '/info',
	// component: React.lazy(() => import('pages/learning-page/children/dictation/dictation.jsx')),
	// component: A2, // 可用
	// component: <A2 mark="123"/>, // 报错
	component: ()=><A2 mark="123" />, // 可用
}, {
	name: '听写',
	path: '/dictation',
	// component: React.lazy(() => import('pages/learning-page/children/dictation/dictation.jsx')),
	component: ()=><A2 mark="456" />, // 可用

}, {
	name: '词汇',
	path: '/words',
	// component: React.lazy(() => import('pages/learning-page/children/dictation/dictation.jsx')),
	component: ()=><A2 mark="789" />, // 可用
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
	name: '学习页面',
	path: '/learning-page',
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

export default function () {
	const getUl = function (parent, children) {
		if (!children) return null;
		children = children.filter(cur => !cur.hide_);
		const aLi = children.map((oneLi, idx) => {
			return <li key={idx} >
				<NavLink to={parent.path + oneLi.path} target={oneLi.target || ''} >
					{oneLi.name}
				</NavLink>
			</li>
		});
		return <ul> {aLi} </ul>;
	}
	const theNav = <cpnt.Nav className="center-box02">
		<em className="logo" >
			哈哈学习
		</em>
		<cpnt.Ul>
			{aNavData.map((cur, idx) => {
				const { children, path, hide_ } = cur;
				if (hide_) return null;
				// const aim = children ? children[0].path : path;
				const aim = path;
				return <cpnt.Li key={idx}>
					<NavLink to={aim} target={cur.target || ''} >
						{cur.name}
					</NavLink>
					{getUl(cur, children)}
				</cpnt.Li>
			})}
		</cpnt.Ul>
	</cpnt.Nav>
	return theNav;
}
