import React from "react";
import { NavLink, /* useLocation */ } from "react-router-dom";
import * as cpnt from './style/navigation.js';
import {aNavData} from './js/navigation.js';

export default function () {
	const getUl = function (parent, children) {
		if (!children) return null;
		children = children.filter(cur => !cur.hide_);
		const aLi = children.map((oneLi, idx) => {
			const myPath = oneLi.pathRoot_ || oneLi.path;
			return <li key={idx} >
				<NavLink target={oneLi.target || ''}
					to={parent.path + myPath} 
				>
					{oneLi.name}
				</NavLink>
			</li>
		});
		return <ul> {aLi} </ul>;
	}
	const theNav = <cpnt.Nav className="center-box02">
		<em className="logo" >
			哈哈学习
		</em>
		<cpnt.Ul>
			{aNavData.map((cur, idx) => {
				const { children, path, hide_ } = cur;
				if (hide_) return null;
				// const aim = children ? children[0].path : path;
				const aim = path;
				return <cpnt.Li key={idx}>
					<NavLink to={aim} target={cur.target || ''} >
						{cur.name}
					</NavLink>
					{getUl(cur, children)}
				</cpnt.Li>
			})}
		</cpnt.Ul>
	</cpnt.Nav>
	return theNav;
}
