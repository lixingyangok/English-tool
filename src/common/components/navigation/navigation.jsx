import React from "react";
import {NavLink, useLocation} from "react-router-dom";
import * as cpnt from './style/navigation.js';

export const aNavData = [{
  name: '首页',
  path: '/index',
  component: React.lazy(() => import('pages/index/index.jsx')),
},{
  name: '工具',
  path: '/practicing',
  target:'_blank',
  component: React.lazy(() => import('pages/my-tool/my-tool.jsx')),
},{
  name: '关于',
  path: '/about',
  component: React.lazy(() => import('pages/about/about.jsx')),
}];

export default function () {
  const oLocation = useLocation();
  const isPracticing = oLocation.pathname.includes('/practicing');
  if (isPracticing) {
    return <div></div>;
  }
  return <nav>
    <cpnt.Ul>
      {aNavData.map((cur,idx)=>{
        return <cpnt.Li key={idx}>
          <NavLink to={cur.path} target={cur.target || ''} >
            {cur.name}
          </NavLink>
        </cpnt.Li>
      })}
    </cpnt.Ul>
  </nav>;
}
