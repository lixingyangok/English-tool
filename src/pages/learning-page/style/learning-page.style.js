import styled from 'styled-components'
import { Tabs } from 'antd';

export const outer = styled.article`

`;

const sDeepBlue = `#056bca`;
export const iHeaderHeight = '90px';

export const header = styled.header`
	/* background: var(--color); */
	/* background: #999; */
	width: 100%;
	position: fixed;
	top: 0;
	left: 0;
	z-index: 2;
	height: ${iHeaderHeight};
	background: linear-gradient(to bottom, #1890ff 0%,#99cfff 100%); 
	display: flex;
	flex-flow: column nowrap;
	justify-content: space-between;
`;

export const storyInfo = styled.div`
	padding: 20px 20px 0;
	display: flex;
	justify-content: space-between;
	align-items: center;
	.left {
		display: flex;
		h1, a{
			font-size: 22px;
			height: 26px;
			line-height: 26px;
			color: white;
			font-weight: bold;
			margin: 0;
		}
		a{
			margin: 0 6px 0 0;
			&:hover{
				color: blue;
			}
		}
	}
`;

export const MyTabs = styled(Tabs)`
	.ant-tabs-nav{
		margin-bottom: 0 !important;
		&::before{
			border-bottom: 2px solid ${sDeepBlue} !important;
			z-index: 2;
		}
	}
	.ant-tabs-nav-wrap{
		padding: 0 20px;
		.ant-tabs-tab{
			padding: 5px 42px;
			margin: 0;
			background: white;
		}
		.ant-tabs-tab + .ant-tabs-tab{
			border-left: solid 1px #ddd;
		}
	}
	.ant-tabs-tab-active{
		background: ${sDeepBlue} !important;
		.ant-tabs-tab-btn{
			color: white !important;
		}
	}
`;

export const bodyWrap = styled.section`
	padding-top: ${iHeaderHeight};
`;

