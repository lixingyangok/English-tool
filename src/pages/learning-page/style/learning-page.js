import styled from 'styled-components'
import { Tabs } from 'antd';

export const outer = styled.article`
	
`;

const sDeepBlue = `#056bca`;
export const header = styled.header`
	/* background: var(--color); */
	/* background: #999; */
	background: linear-gradient(to bottom, #1890ff 0%,#99cfff 100%); 
`;

export const storyInfo = styled.div`
	/* border-bottom: solid 1px #aaa; */
	padding: 15px 20px 10px;
	h1{
		line-height: 1.1;
		color: white;
		font-size: 22px;
		font-weight: bold;
		margin: 0;
	}
`;

export const MyTabs = styled(Tabs)`
	.ant-tabs-nav{
		margin-bottom: 0 !important;
		&::before{
			border-bottom: 2px solid ${sDeepBlue};
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
		.ant-tabs-tab-active{
			background: ${sDeepBlue};
			color: white;
		}
	}
`;


