/*
 * @Author: 李星阳
 * @LastEditors: 李星阳
 * @Description: 
 */ 
import styled from "styled-components";

export const Ul = styled.ul`
  height: 40px;
  line-height: 40px;
  background: black;
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
    background: yellow;
    color: black;
  }
`;

