/*
 * @Author: 李星阳
 * @LastEditors: 李星阳
 * @Description: 
 */ 
import React, {Suspense} from 'react';
import { BrowserRouter, Route, Redirect, Switch, withRouter} from 'react-router-dom';
import Loading from 'common/components/loading/loading.jsx';
import Navigation from 'common/components/navigation/navigation.jsx';
import {aNavData} from 'common/components/navigation/js/navigation.js';

const MyNav = withRouter(function (props){
	const {pathname} = props.location;
	const [visible, setVisible] = React.useState(false);
	React.useEffect(()=>{
		const newVal = (()=>{
			return !pathname.startsWith('/learning-page');
		})();
		setVisible(newVal);
	}, [pathname])
	if (visible) return <Navigation/>;
	return null;
});

function App() {
	const oBody = <Suspense fallback={Loading}>
		<Switch>
			<Redirect exact from="/" to="/index" ></Redirect>
			{aNavData.map((cur,idx)=>{
				return <Route key={idx} path={cur.path} 
						component={cur.component}
				/>
			})}
		</Switch>
	</Suspense>;
	// ▼ 
	const resultHTML = <BrowserRouter>
		<MyNav/>
		{oBody}
	</BrowserRouter>
	return resultHTML;
}

export default App;

