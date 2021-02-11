/*
 * @Author: 李星阳
 * @LastEditors: 李星阳
 * @Description: 
 */ 
import styled from 'styled-components';

export const Header = styled.header`
	background: white;
	box-shadow: 0px 1px 3px rgba(0,0,0,0.2);
	background: #f0f0f0;
`;

export const Nav = styled.nav`
	background: white;
	box-shadow: 0px -2px 0px #f2f2f2;
	border-bottom: solid 1px #a0a0a0;
`;

export const Ul = styled.ul`
	display: flex;
	margin: 0;
	li{
		line-height: 2;
		margin-right: 15px;
		cursor: pointer;
	}
`;

export const BtnBar = styled.section`
	padding: 10px 0;
	display: flex;
	.btn{
		width: 40px;
		text-align: center;
		cursor: pointer;
		&:Hover{
			color: blue;
		}
	}
	.fas{
		font-size: 18px;
		vertical-align: middle;
	}
`;