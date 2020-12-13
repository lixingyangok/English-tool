import React from "react";
import {NavLink, /* useLocation */} from "react-router-dom";
import * as cpnt from './style/navigation.js';

export const aNavData = [{
  name: '首页',
  path: '/index',
  component: React.lazy(() => import('pages/index/index.jsx')),
},{
  name: '书柜',
  path: '/learning-history',
  component: React.lazy(() => import('pages/learning-history/learning-history.jsx')),
},{
  name: '学习资料',
  path: '/learning-data',
  component: React.lazy(() => import('pages/learning-data/learning-data.jsx')),
},{
  name: '自习室',
  path: '/practicing',
  // target:'_blank',
  component: React.lazy(() => import('pages/my-tool/my-tool.jsx')),
},{
  name: '关于',
  path: '/about',
  component: React.lazy(() => import('pages/about/about.jsx')),
},{
  name: '关于11',
  path: '/about22',
  component: () => <div>123</div>,
  children: [{
    name: '二级1',
  },{
    name: '二级1',
  }],
}];

export default function () {
  // const oLocation = useLocation();
  // const isPracticing = oLocation.pathname.includes('/practicing');
  // if (isPracticing) {
  //   return <div></div>;
  // }

  return <cpnt.Nav className="center-box02">
    <em className="logo" >
      哈哈学习 Hahaxuexi.com
    </em>
    <cpnt.Ul  >
      {aNavData.map((cur,idx)=>{
        return <cpnt.Li key={idx}>
          <NavLink to={cur.path} target={cur.target || ''} >
            {cur.name}
          </NavLink>
        </cpnt.Li>
      })}
    </cpnt.Ul>
  </cpnt.Nav>;
}
