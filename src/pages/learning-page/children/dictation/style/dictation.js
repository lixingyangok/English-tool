import styled from "styled-components";

export const iMarkWrapHeight = 18;
export const iCanvasHeight = 110;
export const iScrollHeight = 12;

export const Container = styled.div`
	box-sizing: border-box;
	padding: 20px;
	height: 100%;
	overflow-y: auto;
	display: flex;
	flex-flow: column nowrap;
	position: relative;
	z-index: 0;
	.ant-spin-spinning{
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0,0,0,0.5);
		overflow: hidden;
		z-index: 3;
	}
	.ant-spin-dot{
		margin-top: 45vh;
	}
	.ant-spin-dot-item{
		background: white;
	}
`;


export const MediaAndWave = styled.div`
	display: flex;
	justify-content: space-between;
	flex: none;
	overflow: hidden;
	align-items: stretch;
	max-height: 400px;
	.right{
		flex: auto;
		overflow: hidden;
	}
`;

export const VideoWrap = styled.div`
	box-sizing: border-box;
	min-width: 250px;
	max-width: 35%;
	margin-right: 15px;
	background: black;
	flex: none;
	display: flex;
	justify-content: center;
	align-items: center;
	display: none;
	position: relative;
	border: solid 1px #ccc;
	.video{
		max-height: 100%;
		max-width: 100%;
	}
	&[class~=show]{
		display: flex;
	}
	.subtitle{
		position: absolute;
		width: 90%;
		left: 5%;
		bottom: 7%;
		color: white;
		font-weight: bold;
		text-align: center;
		line-height: 1.3;
		word-break: break-word;
		font-size: 17px;
		z-index: 2;
		&::before {
			content: attr(data-text);
			width: 100%;
			display: block;
			position: absolute;
			-webkit-text-stroke: 6px #000;
			z-index: -1;
			color: black;
		}
	}
`;

export const WaveBox = styled.article`
	position: relative;
	background: black;
	overflow: hidden;
	height: ${iMarkWrapHeight + iCanvasHeight + iScrollHeight}px;
	canvas{
		display: block;
		margin-top: ${iMarkWrapHeight}px;
	}
`;

export const WaveWrap = styled.div`
	width: 100%;
	height: 100%;
	overflow-x: auto;
	overflow-y: hidden;
	flex: none;
	position: absolute; /* 用于贴紧父级左上角 */
	top: 0;
	left: 0;
	::-webkit-scrollbar{
		height: ${iScrollHeight}px;
		background: transparent;
	}
	::-webkit-scrollbar-thumb{
		background: #00c800;
	}
`;

export const LongBar = styled.div`
	position: relative;
	height: 100%;
	z-index: 2;
	display: flex;
	flex-flow: column nowrap;
`;

export const MarkWrap = styled.section`
	width: 100%;
	height: ${iMarkWrapHeight}px;
	position: relative;
	flex: none;
	--color: #0f0;
	color: var(--color);
	.one-second{
		box-sizing: border-box;
		position: absolute;
		top: 0;
		height: 100%;
		font-size: 12px;
		padding: 3px 0 0 5px;
		line-height: 1.2;
		&[class~=ten-times] .mark{
			height: 50%;
			width: 2px;
		}
	}
	.mark{
		position: absolute;
		left: 0;
		bottom: 0;
		width: 1px;
		height: 18%;
		background: var(--color);
	}
`;

export const RegionWrap = styled.section`
	width: 100%;
	position: relative;
	flex: auto;
	border: solid green;
	border-width: 1px 0;
	overflow: hidden;
	.pointer{
		position: absolute;
		width: 1px;
		height: 100%;
		background: white;
		top: 0;
		left: 0;
		z-index: 9;
		opacity: 0;
		transition: 0.3s opacity;
		&[class~=playing]{
			opacity: 1;
		}
	}
	.region{
		box-sizing: border-box;
		position: absolute;
		top: 0px;
		height: 100%;
		min-width: 1px;
		background: rgba(0,0,0,0.4);
		z-index: 4;
		margin: 0;
		padding: 0;
		border: solid var(--border-color);
		border-width: 0 1px;
		overflow: hidden;
		--border-color: rgba(255,255,255,0.6);
	}
	.cur{
		--border-color: red;
		border-width: 0 2px;
		background: none;
		box-shadow: 0px 0px 0px ${10000 * 100}px rgba(0, 0, 0, 0.4);
		border-right-color: blue;
		.idx:before, .idx:after{
			--border-color: blue;
		}
	}
	.idx{
		padding: 102px 0 0 5px;
    	display: inline-block;
		font-size: 12px;
		color: rgba(255,255,255, 0.7);
	}
	.region:before,
	.region:after,
	.idx:before,
	.idx:after{
		content: '';
		width: 0px;
		height: 0px;
		position: absolute;
		border: solid 3px;
	}
	.region:before{
		border-color: var(--border-color) transparent transparent var(--border-color);
		top: 0;
		left: 0
	}
	.region:after{
		border-color: transparent transparent var(--border-color) var(--border-color);
		bottom: 0;
		left: 0
	}
	.idx:before{
		border-color: var(--border-color) var(--border-color) transparent transparent;
		top: 0;
		right: 0
	}
	.idx:after{
		border-color: transparent var(--border-color) var(--border-color) transparent;
		bottom: 0;
		right: 0
	}
`;

export const TextareaWrap = styled.div`
	/* height: 90px; */
	margin: 0;
	flex: none;
	textarea{
		display: block;
		box-sizing: border-box;
		width: 100%;
		height: 100%;
		padding: 5px 10px;
		font-size: 22px;
		resize: none;
		color: #333;
		font-weight: 500;
		line-height: 1.4;
	}
`;

// 候选词栏
export const WordsBar = styled.div`
	display: flex;
	flex-flow: row nowrap;
	overflow: hidden;
	overflow: hidden;
	flex: none;
	height: 28px;
	line-height: 28px;
	white-space: nowrap;
	transition: 0.5s;
	transition-delay: 0.5s;
`;

export const oneWord = styled.span`
	margin-right: 15px;
	font-size: 18px;
	padding: 0;
	color: #444;
	&[kind=words],
	&[kind=names]{
		cursor: pointer;
		color: blue;
	}
	&[kind=words]{
		color: #d80000;
	}
	.idx{
		display: inline-block;
		width: 16px;
		height: 16px;
		text-align: center;
		line-height: 13px;
		border-radius: 100px;
		background: blue;
		margin-right: 5px;
		color: white;
		font-size: 16px;
	}
	&:nth-child(n+5) .idx{
		background: deepskyblue;
	}
	.left{
		color: inherit;
		font-weight: bold;
		padding: 0;
	}
`;


export const InfoBar = styled.div`
	padding: 15px 0 2px;
	overflow: hidden;
	white-space: nowrap;
	display: flex;
	justify-content: flex-start;
	align-items: center;
	flex-flow: row nowrap;
	span{
		font-size: 14px;
		margin-right: 1.5em;
		color: #999;
		line-height: 1.2;
	}
	em{
		display: inline-block;
		line-height: inherit;
		vertical-align: bottom;
		color: #333;
	}
	.ellipsis{
		max-width: 8em;
	}
`;

export const SentenceWrap = styled.ol`
	overflow-y: auto;
	list-style: none;
	padding: 0 0 100px;
	margin: 20px 0 0;
	border: solid #aaa;
	border-width: 1px 0;
	.one-line{
		display: flex;
		border: solid #ccc;
		border-width:  0 0 1px;
		font-size: 16px;
		font-weight: 500;
		cursor: pointer;
		&[class~=cur]{
			background: #ceffe7;
		}
		&:hover{
			background: #aef3d1;
		}
	}
	.idx{
		flex: none;
		font-style: normal;
		text-align: center;
		display: flex;
		justify-content: center;
		align-items: center;
		min-width: 2em;
	}
	.time{
		flex: none;
		border: solid #aaa;
		border-width: 0 1px;
		margin: 0 0.6em 0 0;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 0 10px;
		em{
			font-style: normal;
		}
	}
`;


export const oneSentence = styled.p`
	min-height: 1.3em;
	line-height: 1.3;
	margin: 0 10px 0 0;
	padding: 0.4em 0;
	box-sizing: content-box;
	& > span + span{
		margin: 0 0 0 4px;
		/* background: pink; */
	}
	.blue{
		color: blue;
	}
`;

export const HistoryBar = styled.div`
	padding: 0;
	margin: 0;
	display: flex;
	span {
		background: #87c9ff;
		margin: 0;
		width: calc(100% / 30);
		text-align: center;
		letter-spacing: -1px;
		height: 3px;
		+span{
			box-shadow: 1px 0px 0px 0px blue inset;
		}
	}
	.cur{
		background: blue;
	}
`;

export const WordsDialog = styled.div`
	.btn-bar{
		margin: -5px 0 0;
		>*{
			display: inline-block;
			margin-right: 10px;
		}
		.ant-upload-list{
			display: none;
		}
	}
	.words-list{
		padding: 15px 0 15px;
		min-height: 200px;
	}
	.one-word{
		margin: 0 10px 10px 0;
		display: inline-block;
		font-size: 16px;
	}
	.no-words{
		padding: 2em 0 0;
	}
`;

export const matchUl = styled.ul`
	max-height: calc(100vh - 190px);
	overflow-y: auto;
	margin: 10px 0 0;
	border-top: solid 1px #ccc;
`;

export const oneMatchLine = styled.li`
	display: flex;
	flex-flow: row nowrap;
	border-bottom: solid 1px #ccc;
	font-size: 16px;
	&:nth-child(odd){
		background: #f5f5f5;
	}
	&:hover{
		background: #dff0ff !important;
	}
	.idx, .left, .right{
		display: flex; 
		padding: 0.5em 1em;
		align-items: center;
	}
	.idx{
		text-align: center;
		flex: none;
		align-items: center;
		justify-content: center;
	}
	.left,
	.right{
		width: 50%;
		border-left: solid 1px #ccc;
	}
`;
