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
	padding: 6px 15px;
`;

export const BtnBar = styled.section`
	display: flex;
`;

export const Btn = styled.span`
	vertical-align: middle;
	cursor: pointer;
	margin-right: 18px;
	color: #aaa;
	font-size: 12px;
	&:Hover{
		color: #333;
	}
	.fas{
		margin: 0 0.4em 0 0;
	}
`;

