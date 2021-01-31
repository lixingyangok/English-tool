import React from "react";
import {NavLink, /* useLocation */} from "react-router-dom";
import * as cpnt from './style/navigation.js';

export const aLearningData = [{
	name: '列表',
	path: '/list',
	component: React.lazy(() => import('pages/learning-data/story-list.jsx')),
},{
	name: '自习室',
	path: '/practicing',
	component: React.lazy(() => import('pages/my-tool-02/my-tool.jsx')),
}];

export const aLocalData = [{
	name: '列表',
	path: '/list',
	component: React.lazy(() => import('pages/local-data/children/learning-history/learning-history.jsx')),
},{
	name: '自习室',
	path: '/practicing',
	component: React.lazy(() => import('pages/local-data/children/my-tool/my-tool.jsx')),
}];

export const aNavData = [{
	name: '首页',
	path: '/index',
	component: React.lazy(() => import('pages/index/index.jsx')),
},{
	name: '学习资料',
	path: '/learning-data',
	component: React.lazy(() => import('pages/learning-data/learning-data.jsx')),
	children: aLearningData,
},{
	name: '本地数据',
	path: '/local-data',
	component: React.lazy(() => import('pages/local-data/local-data.jsx')),
	children: aLocalData,
},
// {
//	 name: '书柜',
//	 path: '/learning-history',
//	 component: React.lazy(() => import('pages/learning-history/learning-history.jsx')),
// },{
//	 name: '自习室',
//	 path: '/practicing',
//	 // target:'_blank',
//	 component: React.lazy(() => import('pages/my-tool/my-tool.jsx')),
// },
{
	name: '关于',
	path: '/about',
	component: React.lazy(() => import('pages/about/about.jsx')),
},{
	name: '关于11',
	path: '/about22',
	component: () => <div>123</div>,
	children: [{
		name: '二级1',
		path: '/about',
	},{
		name: '二级2',
		path: '/about',
	}],
}];

export default function () {
	// const oLocation = useLocation();
	// const isPracticing = oLocation.pathname.includes('/practicing');
	// if (isPracticing) {
	//	 return <div></div>;
	// }
	const getUl = function (parent, children){
		if (!children) return null;
		return <ul>
			{children.map((oneLi, idx)=>{
				return <li key={idx} >
					<NavLink to={parent.path + oneLi.path} target={oneLi.target || ''} >
						{oneLi.name}
					</NavLink>
				</li>
			})}
		</ul>
	}
	return <cpnt.Nav className="center-box02">
		<em className="logo" >
			哈哈学习 Hahaxuexi.com
		</em>
		<cpnt.Ul	>
			{aNavData.map((cur,idx)=>{
				const {children, path} = cur;
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
	</cpnt.Nav>;
}
