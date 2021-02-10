import React, {Suspense} from 'react';
import { Route, Redirect, Switch, useHistory  } from 'react-router-dom';
import Loading from 'common/components/loading/loading.jsx';
import {aLearningPage} from 'common/components/navigation/navigation.jsx';
import * as cpnt from './style/learning-page.js';
import { Tabs } from 'antd';
const { TabPane } = Tabs;

function StoryInfo(){
	return <cpnt.storyInfo>
		故事信息
	</cpnt.storyInfo>
}

function TabBar(){
	const history = useHistory();
	function callback(idx) {
		const oTarget = aLearningPage[idx];
		const url = `/learning-page${oTarget.path}`;
		history.push(url);
	}
	const aPages = aLearningPage.map((cur, idx) => {
		return <TabPane tab={cur.name} key={idx}/>
	});
	return <Tabs defaultActiveKey="1" onChange={callback}
		defaultActiveKey={0}
	>
		{aPages}
	</Tabs>
	// return Demo;
}

function getBody(){
	const getPath = url => `/learning-page${url}`;
	const bottom = <Suspense fallback={Loading}>
		<Switch>
			{aLearningPage.map((cur,idx)=>{
				return <Route key={idx} path={getPath(cur.path)} 
					component={cur.component}
				/>
			})}
			<Redirect exact from="/learning-page" to="/learning-page/dictation" />
		</Switch>
	</Suspense>
	return bottom;
}

export default function (){
	const resultHTML = <div>
		{StoryInfo()}
		{TabBar()}
		{getBody()}
	</div>
	return resultHTML
}