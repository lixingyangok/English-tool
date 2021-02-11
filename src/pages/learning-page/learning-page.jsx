import React, {Suspense, useState} from 'react';
import { Redirect, useHistory} from 'react-router-dom';
import Loading from 'common/components/loading/loading.jsx';
import {aLearningPage} from 'common/components/navigation/navigation.jsx';
import * as cpnt from './style/learning-page.js';
import { Tabs } from 'antd';
import {getStoryInfo} from 'common/js/learning-api.js';
import CacheRoute, { CacheSwitch } from 'react-router-cache-route'

export const MyContext = React.createContext('');

function StoryInfo(oStoryInfo){
	return <cpnt.storyInfo>
		<h1>{oStoryInfo.storyName}</h1>
	</cpnt.storyInfo>
}

function TabBar(props){
	const {storyId, curIdx = 0} = props;
	const history = useHistory();
	function callback(idx) {
		const oTarget = aLearningPage[idx];
		const url = `/learning-page/${storyId}${oTarget.path}`;
		history.push(url);
	}
	const aPages = aLearningPage.map((cur, idx) => {
		return <Tabs.TabPane tab={cur.name} key={String(idx)}/>
	});
	return <cpnt.MyTabs onChange={callback} defaultActiveKey={curIdx}>
		{aPages}
	</cpnt.MyTabs>
}

function ChildrenPages(props){
	// console.log('收到故事信息：\n', oStoryInfo);
	const {oStoryInfo={}}  = props;
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
	const HTML = <MyContext.Provider value={{oStoryInfo}}>
		{bottom}
	</MyContext.Provider>
	return HTML;
}

export default function (props){
	const  [oStoryInfo, setStoryInfo] =  useState({});
	const {storyId} = props.match.params;
	const curIdx = (()=>{ // TODO 不准备，应找好办法
		const iVal = aLearningPage.findIndex(cur=>{
			return props.location.pathname.includes(cur.path);
		});
		return String(iVal);
	})();
	React.useEffect(()=>{
		getStoryInfo(storyId).then(res=>{
			setStoryInfo(res.data || {})
		});
		//return; // xx => console.log('组件卸载了');
	}, [storyId]);
	const resultHTML = <cpnt.outer>
		<cpnt.header>
			{StoryInfo(oStoryInfo)}
			<TabBar {...{storyId, curIdx}} />
		</cpnt.header>
		<ChildrenPages oStoryInfo={oStoryInfo}/>
	</cpnt.outer>
	return resultHTML
}
