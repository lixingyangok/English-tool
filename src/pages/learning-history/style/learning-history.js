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
    margin: 5px 0 0;
    li:last-child{
        border-bottom-width: 1px;
    }
`;

export const OneItem = styled.li`
    padding: 20px 0;
    border: solid #ccc;
    border-width: 1px 0 0;
    position: relative;
    .my-title{
        margin: 0;
    }
    .info-bar{
        color: #aaa;
        margin: 3px 0 20px;
    }
    .btn-wrap{
        position: absolute;
        top: 20px;
        right: 0;
    }
    .ant-btn + .ant-btn{
        margin: 0 0 0 8px;
    }
`;

export const TrackList = styled.ul`
    margin: 5px 0 0;
    line-height: 1.3;
    li{
        cursor: pointer;
        margin: 0 0 15px;
        &:hover{
            background: #eee;
        }
    }
`;