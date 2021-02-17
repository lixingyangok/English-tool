import styled from 'styled-components';

export const oneLine = styled.p`
	font-size: 16px;
	&[class~=current]{
		background: #eee;
		font-weight: bold;
	}
`;