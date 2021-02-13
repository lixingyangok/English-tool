import styled from 'styled-components';

export const titleBar = styled.div`
	display: flex;
	align-items: center;
	border-bottom: solid 1px #aaa;
	margin: -5px auto 5px;
`;

export const wordName = styled.em`
	font-size: 24px;
	font-weight: bold;
	margin: 0 1em 0 0;
	text-transform: capitalize;
	max-width: 45vw;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

export const MyIframe = styled.iframe`
	width: 100%;
	height: calc(100vh - 120px);
	border: none;
	margin: 0 auto -10px;
`;
