import styled from "styled-components";

export const iMarkWrapHeight = 20;
export const iCanvasHeight = 125;
export const iScrollHeight = 15;

export const Div = styled.div`
	box-sizing: border-box;
	padding: 20px 20px 0px;
	height: calc(100vh - 80px);
	display: flex;
	flex-flow: column nowrap;
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

export const WaveBox = styled.article`
	position: relative;
	background: black;
	overflow: hidden;
	height: ${iMarkWrapHeight + iCanvasHeight + iScrollHeight}px;
	flex: none;
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
		font-size: 10px;
		text-size-adjust: none;
		padding: 3px 0 0 5px;
		line-height: 1.2;
	}
	.mark{
		position: absolute;
		left: 0;
		bottom: 0;
		width: 1px;
		height: 18%;
		background: var(--color);
	}
	.one-second:nth-child(10n+1) .mark{
		height: 50%;
		width: 2px;
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
	height: 90px;
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
	}
`;

// 候选词
export const Words = styled.div`
	display: flex;
	flex-flow: row wrap;
	margin: 0 0 18px;
	min-height: 30px;
	overflow: hidden;
	flex: none;
	line-height: 1.4;
	span{
		margin-right: 15px;
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
	.word{
		color: black;
		font-size: 18px;
		padding: 0;
	}
	mark{
		background: yellow;
	}
`;

export const InfoBar = styled.div`
	font-size: 14px;
	padding: 15px 0 0;
	span{
		margin-right: 1.8em;
	}
`;

export const SentenceWrap = styled.ol`
	overflow-y: auto;
	list-style: none;
	padding: 0 0 100px;
	margin: 0;
	border: solid #aaa;
	border-width: 1px 0;
	.one-line{
		border: solid #aaa;
		border-width: 1px 0 0;
		display: flex;
		font-size: 16px;
		cursor: pointer;
		&[class~=cur]{
			background: #ceffe7;
		}
		&:hover{
			background: #9de3c1;
		}
		&:last-child{
			border-width: 1px 0;
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
	.the-text{
		min-height: 1.3em;
		line-height: 1.3;
		margin: 0 10px 0 0;
		padding: 0.6em 0;
		box-sizing: content-box;
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