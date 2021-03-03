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
	font-size: 20px;
	cursor: pointer;
	padding: 0.3em 1em;
	display: flex;
	color: #333;
	transition: 0.5s all;
	/* margin: 0 0 0.5em; */
	&:hover,
	&[class~=current]{
		background: #e9ebff;
		color: #000;
	}
	&[class~=done] .bg::after{
		background: rgba(0, 255, 0, 0.35);
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
		width: 100%;
		/* &, & *{ white-space: pre-wrap; } */
	}
	p{
		margin: 0;
		white-space: pre-wrap;
	}
	.support{
		/* opacity: 0; */
		/* opacity还会触发事件，visibility 不会 */
		visibility: hidden;
	}
	.bg, .cover{
		position: absolute;
		top: 0;
		left: 0;
	}
	.bg{
		pointer-events: none;
		::after{
			content: ""attr(text)"";
			display: inline;
			background: rgba(255, 255, 0, 0.45);
			color: transparent;
			transition: all 0.5s;
		}
	}
	.cover{
		.word{
			&:Hover{
				background: yellow;
			}
		}
		.name{
			color: blue;
			font-weight: bold;
		}
		.new-word{
			color: red;
			font-weight: bold;
		}
		.word-group{
			text-decoration: underline;
		}
	}
`;

