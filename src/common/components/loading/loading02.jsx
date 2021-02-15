import React from 'react';
import { Spin } from 'antd';
import styled from 'styled-components';

const Wrap = styled.div`
	padding: 30vh 0 0;
	text-align: center;
	position: fixed;
	z-index: 2;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0,0,0,0.15);
`;

export function MyLoading(props) {
	const {sLoadingAction} = props;
	if (!sLoadingAction) return null;
	const HTML = <Wrap>
		<Spin />
		<h1>{sLoadingAction}</h1>
	</Wrap>;
	return HTML;
}