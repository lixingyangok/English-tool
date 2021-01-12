/*
 * @Author: 李星阳
 * @LastEditors: 李星阳
 * @Description: 
 */ 
import styled from "styled-components";

const navHeight = '55px';
export const Nav = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: ${navHeight};
  line-height: 55px;
  background: #24292e;
  color: white;
  position: relative;
  z-index: 2;
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
  position: relative;
  &:hover{
    ul{
      display: block;
    }
  }
  & > a{
    color: white;
    padding: 0.5em 1.5em;
  }
  a.active{
    background: black;
    font-weight: bold;
    /* color: #1890ff; */
    color: yellow;
  }
  ul{
    width: 100%;
    background: #24292e;
    position: absolute;
    top: ${navHeight};
    left: 0;
    display: none;
    z-index: 2;
  }
  li{
    padding: 0 1em;
    line-height: 43px;
    a{
      display: block;
    }
  }
  li:hover{
    background: #072d54;
    color: yellow;
  }
`;

