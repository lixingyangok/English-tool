/*
 * @Author: 李星阳
 * @Date: 2021-02-10 11:46:34
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-02-21 11:50:39
 * @Description: 
 */

import React, {Suspense, useState} from 'react';
import { Redirect, useHistory} from 'react-router-dom';
import Loading from 'components/loading/loading.jsx';
import {aLearningPage} from 'components/navigation/js/navigation.js';
import * as cpnt from './style/learning-page.style.js';
import {Tabs} from 'antd';
import {getStoryInfo} from 'assets/js/learning-api.js';
import CacheRoute, { CacheSwitch } from 'react-router-cache-route'
import { NavLink, /* useLocation */ } from "react-router-dom";

export const MyContext = React.createContext('');

function StoryInfoBar(props){
	const {oStoryInfo={}} = props;
	const left = <div className="left" >
		<NavLink to="/learning-data/list">
			<i className="fas fa-arrow-alt-circle-left"/>
		</NavLink>
		<h1>
			{oStoryInfo.storyName}
		</h1>
	</div>
	const right = <div></div>
	return <cpnt.storyInfo>
		{left}{right}
	</cpnt.storyInfo>
}

function TabBar(props){
	const history = useHistory();
	const {storyId, pathname, oMedia} = props;
	// TODO ▼不准确，应找好办法
	const curIdx = aLearningPage.findIndex(cur=>{
		return pathname.includes(cur.pathRoot_ || cur.path);
	});
	function callback(idx) {
		const {pathRoot_, path, isDictationPage_} = aLearningPage[idx];
		let url = `/learning-page/${storyId}${pathRoot_ || path}`;
		if (isDictationPage_)  url += `/${oMedia.ID}`;
		history.push(url);
	}
	const HTML = <cpnt.MyTabs activeKey={String(curIdx)}
		onChange={callback} defaultActiveKey={"0"}
	>
		{aLearningPage.map((cur, idx) => {
			return <Tabs.TabPane tab={cur.name} key={String(idx)}/>
		})}
	</cpnt.MyTabs>
	return HTML;
}

function ChildrenPages(props){
	// console.log('收到故事信息：\n', oStoryInfo);
	const {
		oStoryInfo={}, updateStoryInfo, setMedia,
	}  = props;
	const getPath = url => `/learning-page/:storyId${url}`;
	const bottom = <Suspense fallback={Loading}>
		<CacheSwitch>
			{aLearningPage.map((cur,idx)=>{
				return <CacheRoute key={idx} path={getPath(cur.path)} 
					component={cur.component}
				/>
			})}
			<Redirect exact from="/learning-page/:storyId"
				to="/learning-page/:storyId/list" 
			/>
		</CacheSwitch>
	</Suspense>
	const HTML = <cpnt.bodyWrap>
		<MyContext.Provider 
			value={{oStoryInfo, updateStoryInfo, setMedia}}
		>
			{bottom}
		</MyContext.Provider>
	</cpnt.bodyWrap>
	return HTML;
}

export default function (props){
	const {pathname} = props.location;
	const {storyId} = props.match.params;
	const  [oStoryInfo, setStoryInfo] =  useState({});
	const [oMedia, setMedia] = useState({});
	const updateStoryInfo = (newId)=>{
		getStoryInfo(newId || storyId).then(res=>{
			setStoryInfo(res.data || {})
		});
	};
	React.useEffect(()=>{
		getStoryInfo(storyId).then(res=>{
			setStoryInfo(res.data || {})
		});
	}, [storyId]);
	const resultHTML = <cpnt.outer>
		<cpnt.header>
			<StoryInfoBar oStoryInfo={oStoryInfo} />
			<TabBar {...{storyId, pathname, oMedia}} />
		</cpnt.header>
		<ChildrenPages
			{...{oStoryInfo, updateStoryInfo, setMedia}}
		/>
	</cpnt.outer>
	return resultHTML
}
