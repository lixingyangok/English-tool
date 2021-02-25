import styled from "styled-components";
import {iHeaderHeight} from 'pages/learning-page/style/learning-page.style.js';

export const iMarkWrapHeight = 18;
export const iCanvasHeight = 110;
export const iScrollHeight = 12;
export const iLineHeight = 35; // 一行字幕的高度

export const Container = styled.div`
	box-sizing: border-box;
	padding: 20px;
	height: calc(100vh - ${iHeaderHeight});
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
	.name{
		color: blue;
	}
	.new-word{
		color: red;
	}
	.word-group{
		text-decoration: underline;
		/* position: relative;
		&:after{
			content: '';
			position: absolute;
			left: 0;
			bottom: 3px;
			right: 0;
			border-top: solid 1px;
		} */
	}
`;

// ▼视频与波形的大窗口
export const MediaAndWave = styled.div`
	display: flex;
	justify-content: space-between;
	flex: none;
	/* overflow: hidden; */
	align-items: stretch;
	max-height: 400px;
	width: 100%;
	.right{
		flex: auto;
		/* flex-grow: 0;
		flex-shrink: 1; */
		max-width: 100%;
		/* ▼如果 hidden 了，textarea 的投影被剪掉了 */
		/* overflow: hidden; */
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
	flex: none;
	position: relative;
	&, textarea{
		display: block;
		box-sizing: border-box;
		margin: 0;
		width: 100%;
		height: 90px;
		line-height: 1.25;
		padding: 5px 10px;
		font-size: 22px;
		resize: none;
		border-radius: 2px;
		border: none;
		/* vertical-align: bottom; */
		word-break: break-word;
		/* ▼默认的 */
		writing-mode: horizontal-tb !important;
		text-rendering: auto;
		letter-spacing: normal;
		word-spacing: normal;
		text-transform: none;
		text-indent: 0px;
		text-shadow: none;
		text-align: start;
		appearance: textarea;
		-webkit-rtl-ordering: logical;
		flex-direction: column;
		white-space: pre-wrap;
		overflow-wrap: break-word;
		column-count: initial !important;
	}
	textarea{
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		color: rgba(0, 0, 0, 0.3) !important;
		caret-color: red;
		background-color: transparent;
		background-image: none;
		transition: all 0.3s;
		/* border: 1px solid #d9d9d9; */
		box-shadow: 0 0 0 1px #d9d9d9;
		overflow: hidden;
		&:focus,
		&:hover{
			/* border-color: #40a9ff; */
			box-shadow: 0 0 0 1px #40a9ff;
		}
		&:focus{
			outline: 0;
			/* box-shadow: 0 0 0 2px rgb(24 144 255 / 20%); */
			box-shadow: 0 0 3px 1px #40a9ff;
		}
	}
	.word{
		position: relative;
	}
	.hover{
		background: rgba(255, 255, 0, 0.2);
		z-index: 2;
	}
`;

// 候选词栏
export const WordsBar = styled.div`
	display: flex;
	flex-flow: row nowrap;
	overflow: hidden;
	flex: none;
	height: 28px;
	line-height: 28px;
	white-space: nowrap;
	transition: 0.5s;
	transition-delay: 0.5s;
`;

/* BJ: 接收参数 */
/* ${({hasSpace}) => hasSpace && 'text-decoration: underline;'}  */
export const oneWord = styled.span`
	margin-right: 15px;
	font-size: 18px;
	padding: 0;
	color: #444;
	display: flex;
    align-items: center;
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
		/* position: relative; top: 1px; */
	}
	.new-word,
	.name{
		cursor: pointer;
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
	margin: 20px 0 0;
	border: solid #aaa;
	border-width: 1px 0;
	.one-line{
		display: flex;
		border: solid #d1d1d1;
		border-width:  0 0 1px;
		font-size: 16px;
		font-weight: 500;
		height: ${iLineHeight}px;
		cursor: pointer;
		overflow: hidden;
		&:hover{
			height: auto;
		}
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
		font-weight: normal;
		text-align: center;
		display: flex;
		justify-content: center;
		align-items: center;
		min-width: 2em;
		width: var(--width);
	}
	.time{
		flex: none;
		width: 180px;
		border: solid #aaa;
		border-width: 0 1px;
		margin: 0 0.6em 0 0;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 0 10px;
		i{
			margin: 0 2px;
		}
		em{
			font-style: normal;
			font-weight: normal;
		}
	}
`;


export const oneSentence = styled.p`
	min-height: 1.3em;
	line-height: 1.3;
	margin: 0 10px 0 0;
	padding: 0.4em 0;
	box-sizing: content-box;
	/* word-break: break-all; */
	/* white-space: break-spaces; */
	word-break: break-word;
`;

// ▼历史记录
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
