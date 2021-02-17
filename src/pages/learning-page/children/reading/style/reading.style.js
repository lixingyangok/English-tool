import styled from 'styled-components';

export const outer = styled.div`
	height: 100%;
	overflow-y: auto;
	padding: 20px 8vw 100px;
`;

export const mediaWrap = styled.div`
	border: solid 1px #aaa;
	margin: 20px 0 0;
	padding: 10px;
	text-align: center;
	display: none;
	video{
		max-height: 300px;
	}
`;

export const mediaTitle = styled.h1`
	background: var(--color);
	color: white;
	padding: 5px 1em;
	text-align: center;
	font-size: 22px;
	font-weight: bold;
	margin: 0 0 20px;
`;

export const oneLine = styled.li`
	font-size: 18px;
	cursor: pointer;
	padding: 0.3em 1em;
	display: flex;
	color: #666;
	transition: 0.5s all;
	/* margin: 0 0 0.5em; */
	&:hover,
	&[class~=current]{
		background: #f0f0f0;
		color: #000;
	}
	.idx{
		display: inline-block;
		font-style: normal;
		margin: 0 12px 0 0;
		min-width: 2em;
		text-align: right;
		flex: none;
	}
	.text{
		position: relative; 
	}
	p{
		margin: 0;
		white-space: pre-wrap;
	}
	.support{
		color: transparent;
		/* pointer-events: none; */
	}
	.bg, .up{
		position: absolute;
		top: 0;
		left: 0;
	}
	.bg{
		/* pointer-events: none; */
		::after{
			content: ""attr(text)"";
			display: inline;
			background: rgba(255, 255, 0, 0.55);
			color: transparent;
		}
	}
	.playing{
		::after{
			width: 100%;
			transition: all var(--long);
			transition-timing-function: linear;
		}
	}
`;

