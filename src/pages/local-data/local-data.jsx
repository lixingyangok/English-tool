import React, {Suspense} from 'react';
import { Route, Redirect, Switch } from 'react-router-dom';
import Loading from 'components/loading/loading.jsx';
import {aLocalData} from 'components/navigation/js/navigation.js';

export default function (){
	const getPath = url => `/local-data${url}`;
	return <Suspense fallback={Loading}>
		<Switch>
			{aLocalData.map((cur,idx)=>{
				return <Route key={idx} path={getPath(cur.path)} 
					component={cur.component}
				/>
			})}
			<Redirect exact from="/local-data" to="/local-data/list" />
		</Switch>
	</Suspense>
}
