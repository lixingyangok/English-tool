import React from 'react';
import { Spin } from 'antd';
import styled from 'styled-components';

const Wrap = styled.div`
    padding: 30vh 0 0;
    text-align: center;
`;

export default <Wrap className="center-box" >
  <Spin />
  <h1>Loading...</h1>
</Wrap>;
