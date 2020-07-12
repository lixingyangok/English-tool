/*
 * @Author: 李星阳
 * @LastEditors: 李星阳
 * @Description: 
 */ 
import React, {Suspense} from 'react';
import { BrowserRouter, Route, Redirect, Switch } from 'react-router-dom';
import Navigation, {aNavData} from './common/components/navigation/navigation.jsx';
import Loading from 'common/components/loading/loading.jsx';

function App() {
  return <BrowserRouter>
    <Navigation/>
    {/* ▼异步组件父级必须有 Suspense */}
    <Suspense fallback={Loading}>
      <Switch>
        <Redirect exact from="/" to="/index" ></Redirect>
        {aNavData.map((cur,idx)=>{
          return <Route key={idx}
            path={cur.path} component={cur.component}
          />
        })}
      </Switch>
    </Suspense>
  </BrowserRouter>
}

export default App;

