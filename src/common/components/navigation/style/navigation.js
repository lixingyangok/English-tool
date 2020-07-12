/*
 * @Author: 李星阳
 * @LastEditors: 李星阳
 * @Description: 
 */ 
import styled from "styled-components";

export const Ul = styled.ul`
  height: 40px;
  line-height: 40px;
  background: #24292e;
  margin: 0;
  display: flex;
`;

export const Li = styled.li`
  list-style: none;
  a{
    display: block;
    color: white;
    padding: 0 1.5em;
  }
  .active{
    background: black;
    font-weight: bold;
    /* color: #1890ff; */
    color: yellow;
  }
`;

