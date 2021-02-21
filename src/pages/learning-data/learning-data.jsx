import React, {Suspense} from 'react';
import { Route, Redirect, Switch } from 'react-router-dom';
import Loading from 'components/loading/loading.jsx';
import {aLearningData} from 'components/navigation/js/navigation.js';

export default function (){
	const getPath = url => `/learning-data${url}`;
	return <Suspense fallback={Loading}>
		<Switch>
			{aLearningData.map((cur,idx)=>{
				return <Route key={idx} path={getPath(cur.path)} 
					component={cur.component}
				/>
			})}
			<Redirect exact from="/learning-data" to="/learning-data/list/-1" />
		</Switch>
	</Suspense>
}
