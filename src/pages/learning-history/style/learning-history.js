/*
 * @Author: 李星阳
 * @LastEditors: 李星阳
 * @Description: 
 */ 

import styled from 'styled-components';

export const Outter = styled.article`
    padding: 45px 0 60px;
`;

export const H1 = styled.h1`
    font-size: 28px;
    margin: 35px 0 20px;
`;

export const BtnBar = styled.div`
    text-align: right;
    display: flex;
    justify-content: space-between;
    align-items: center;
    em{
        font-size: 20px;
        font-weight: bold;
    }
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
    display: flex;
    flex-flow: row wrap;
    justify-content: space-between;
    li{
        box-sizing: border-box;
        cursor: pointer;
        margin: 0 0 10px;
        width: calc(50% - 5px);
        padding: 15px 20px;
        border: dashed 1px #ccc;
        position: relative;
        &:hover{
            background: #f1f1f1;
            .btns{
                opacity: 1;
            }
        }
    }
    h3{
        margin: 0 0 12px;
        /* font-size: 16px; */
        font-weight: bold;
    }
`;

export const BtnWrapInTrack = styled.div`
    position: absolute;
    top: 13px;
    right: 20px;
    /* opacity: 0; */
    transition: 0.5s;
    .ant-btn{
        padding: 0;
        line-height: 20px;
        height: 20px;
    }
`;

export const InfoWrap = styled.dl`
    line-height: 1.5;
    display: flex;
    flex-flow: row wrap;
    margin: 0;
    dt{
        width: 4em;
    }
    dd{
        width: calc(100% - 4em);
        margin: 0;
    }
`;