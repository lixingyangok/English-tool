/*
 * @Author: 李星阳
 * @Date: 2021-01-31 18:43:26
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-01-31 19:32:52
 * @Description: 
 */

import styled from 'styled-components';

export const infoBox = styled.div`
    margin: 30px 0 20px;
`;

export const fileList = styled.ul`
	display: flex;
	justify-content: space-between;
	flex-flow: row wrap;
	margin: 0;
	li{
		width: calc(100% / 3 - 0.5px);
		margin: 0 0 0;
		padding: 1em;
		box-shadow: 0px 0px 0px 1px red;
	}
	.title{
		font-size: 14px;
		margin: 0 0 3px;
	}
	.media-btn-wrap{
		margin: 8px 0 0;
	}
`;

export const filesWaitToUpload = styled(fileList)`
	border-top: solid 1px #ccc;
	padding-top: 15px;
`;