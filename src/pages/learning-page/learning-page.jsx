/*
 * @Author: 李星阳
 * @Date: 2021-02-10 11:46:34
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-02-11 12:39:19
 * @Description: 
 */

import React, {Suspense, useState} from 'react';
import { Redirect, useHistory} from 'react-router-dom';
import Loading from 'common/components/loading/loading.jsx';
import {aLearningPage} from 'common/components/navigation/navigation.jsx';
import * as cpnt from './style/learning-page.js';
import { Tabs } from 'antd';
import {getStoryInfo} from 'common/js/learning-api.js';
import CacheRoute, { CacheSwitch } from 'react-router-cache-route'

export const MyContext = React.createContext('');

function StoryInfoBar(props){
	const {oStoryInfo={}} = props;
	return <cpnt.storyInfo>
		<h1>{oStoryInfo.storyName}</h1>
	</cpnt.storyInfo>
}

function TabBar(props){
	const history = useHistory();
	const {storyId, pathname} = props;
	// TODO ▼不准确，应找好办法
	const curIdx = aLearningPage.findIndex(cur=>{
		return pathname.includes(cur.pathRoot || cur.path);
	});
	// console.log('新值：', curIdx);
	function callback(idx) {
		const oTarget = aLearningPage[idx];
		const url = `/learning-page/${storyId}${oTarget.path}`;
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
	const HTML = <cpnt.bodyWrap>
		<MyContext.Provider value={{oStoryInfo}}>
			{bottom}
		</MyContext.Provider>
	</cpnt.bodyWrap>
	return HTML;
}

export default function (props){
	const {pathname} = props.location;
	const {storyId} = props.match.params;
	const  [oStoryInfo, setStoryInfo] =  useState({});
	React.useEffect(()=>{
		getStoryInfo(storyId).then(res=>{
			console.log('查询故事信息★')
			setStoryInfo(res.data || {})
		});
	}, [storyId]); // storyId
	const resultHTML = <cpnt.outer>
		<cpnt.header>
			<StoryInfoBar oStoryInfo={oStoryInfo} />
			<TabBar {...{storyId, pathname}} />
		</cpnt.header>
		<ChildrenPages oStoryInfo={oStoryInfo}/>
	</cpnt.outer>
	return resultHTML
}
