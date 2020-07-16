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

export const TimeBar = styled.div`
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
	.second-mark{
		box-sizing: border-box;
		display: inline-block;
		border-left: solid 1px rgba(255,255,255,0.5);
		height: 80%;
		z-index: 3;
		position: absolute;
		bottom: 0;
		color: white;
		font-size: 10px;
		text-size-adjust: none;
		-webkit-text-size-adjust: none;
		line-height: 1;
		padding: 0 0 2px 2px;
		color: #0f0;
	}
`;

export const RegionWrap = styled.section`
	width: 100%;
	position: relative;
	flex: auto;
	border: solid green;
	border-width: 1px 0;
	overflow: hidden;
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
		border: solid rgba(255,255,255,0.6);
		border-width: 0 1px;
		overflow: hidden;
	}
	.cur{
		border-color: transparent blue transparent red;
		border-width: 0 2px;
		background: none;
		box-shadow: 0px 0 0px ${10000 * 100}px rgba(0, 0, 0, 0.4);
	}
	.idx{
		position: absolute;
		left: 5px;
		bottom: 1px;
		font-size: 12px;
		color: white;
	}
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
`;

export const InputWrap = styled.div`
	height: 90px;
	margin: 3px 0 5px;
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

export const Words = styled.div`
	display: flex;
	margin: 0 0 15px;
	min-height: 23px;
	overflow: hidden;
	span{
		margin-right: 15px;
	}
	small{
		display: inline-block;
		width: 15px;
		height: 15px;
		text-align: center;
		line-height: 15px;
		border-radius: 100px;
		background: blue;
		margin-right: 3px;
		color: white;
	}
	em{
		color: black;
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

export const Steps = styled.ul`
	margin: 10px 0 0;
	display: flex;
	flex-flow: wrap row;
	outline: solid 1px #ccc;
	padding: 0;
	li{
		display: inline-block;
		padding: 0 10px;
	}
	.cur{
		background: yellow;
	}
`;

export const TextBox = styled.div`
	padding: 20px 0;
	overflow: hidden;
	span{
		background: yellow;
		padding: 3px 8px;
		margin: 0 5px 0 0;
	}
	.cur{
		background: pink;
	}
`;