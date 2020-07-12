/*
 * @Author: 李星阳
 * @LastEditors: 李星阳
 * @Description: 
 */ 
import styled from "styled-components";

export const Nav = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 55px;
  line-height: 55px;
  background: #24292e;
  color: white;
  .logo{
    font-size: 18px;
    font-weight: bold;
  }
`;

export const Ul = styled.ul`
  margin: 0;
  display: flex;
`;

export const Li = styled.li`
  list-style: none;
  a{
    color: white;
    padding: 0.5em 1.5em;
  }
  .active{
    background: black;
    font-weight: bold;
    /* color: #1890ff; */
    color: yellow;
  }
`;

