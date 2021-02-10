import React, {Suspense} from 'react';
import { Route, Redirect, Switch } from 'react-router-dom';
import Loading from 'common/components/loading/loading.jsx';
import {aLearningPage} from 'common/components/navigation/navigation.jsx';

function StoryInfo(){
	return <div>
		故事
	</div>
}

export default function (){
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
	const resultHTML = <div>
		{StoryInfo()}
		{bottom}
	</div>
	return resultHTML
}
