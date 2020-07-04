/*
 * @Author: 李星阳
 * @LastEditors: 李星阳
 * @Description: 
 */ 

import styled from 'styled-components';

export const H1 = styled.h1`
    font-size: 28px;
    margin: 35px 0 20px
`;

export const BtnBar = styled.div`
    text-align: right;
`;

export const Ul = styled.ul`
    margin: 25px 0;
    li{
        padding: 20px 0;
        border: solid #ccc;
        border-width: 1px 0 0;
        position: relative;
    }
    li:last-child{
        border-bottom-width: 1px;
    }
`;

export const OneItem = styled.li`
   .to-del{
       position: absolute;
       top: 20px;
       right: 0;
   }
`;