import React, {Suspense} from 'react';
import { Route, Redirect, Switch, useHistory  } from 'react-router-dom';
import Loading from 'common/components/loading/loading.jsx';
import {aLearningPage} from 'common/components/navigation/navigation.jsx';
import * as cpnt from './style/learning-page.js';
import { Tabs } from 'antd';

function StoryInfo(){
	return <cpnt.storyInfo>
		<h1>故事信息</h1>
	</cpnt.storyInfo>
}

function TabBar(storyId){
	const history = useHistory();
	function callback(idx) {
		const oTarget = aLearningPage[idx];
		const url = `/learning-page/${storyId}${oTarget.path}`;
		history.push(url);
	}
	const aPages = aLearningPage.map((cur, idx) => {
		return <Tabs.TabPane tab={cur.name} key={idx}/>
	});
	return <cpnt.MyTabs defaultActiveKey="1" onChange={callback}
		defaultActiveKey={0}
	>
		{aPages}
	</cpnt.MyTabs>
	// return Demo;
}

function getBody(){
	const getPath = url => `/learning-page/:storyId${url}`;
	const bottom = <Suspense fallback={Loading}>
		<Switch>
			{aLearningPage.map((cur,idx)=>{
				return <Route key={idx} path={getPath(cur.path)} 
					component={cur.component}
				/>
			})}
			<Redirect exact from="/learning-page/:storyId"
				to="/learning-page/:storyId/list" 
			/>
		</Switch>
	</Suspense>
	return bottom;
}

export default function (props){
	console.log("路由的信息：\n", props.match.params);
	const {storyId}=props.match.params;
	const resultHTML = <cpnt.outer>
		<cpnt.header>
			{StoryInfo()}
			{TabBar(storyId)}
		</cpnt.header>
		{getBody()}
	</cpnt.outer>
	return resultHTML
}
