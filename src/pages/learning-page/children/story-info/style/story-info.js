/*
 * @Author: 李星阳
 * @Date: 2021-01-31 18:43:26
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-02-12 14:41:33
 * @Description: 
 */

import styled from 'styled-components';

export const outer = styled.section`
	margin: 0 auto;
	box-sizing: border-box;
	height: 100%;
	padding: 20px 10vw 50px;
	overflow-y: auto;
`;

export const infoBox = styled.div`
	margin: 0 0 20px;
	padding: 20px;
	border: solid 1px #ddd;
	h1{
		font-size: 20px;
		font-weight: bold;
	}
	.story-info{
		color: #666;
		margin: 5px 0 0;
	}
	.btn{
		color: blue;
		cursor: pointer;
	}
`;

export const wordsBar = styled.div`
	text-align: left;
	margin: 6px 0;
	span{
		display: inline-block;
		margin: 0 5px 0 0;
	}
`;

export const fileList = styled.ul`
	display: flex;
	justify-content: space-between;
	flex-flow: row wrap;
	margin: 0 auto 15px;
	li{
		width: calc(100% / 2 - 0.5px);
		margin: 0 0 0;
		padding: 15px 22px;
		box-shadow: 0px 0px 0px 1px #ddd;
	}
	.title{
		font-size: 14px;
		margin: 0 0 3px;
	}
	.media-btn-wrap{
		margin: 8px 0 0;
	}
`;
