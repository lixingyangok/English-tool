import React from 'react';
import { useLocation } from 'react-router-dom';
import * as cpnt from './style/about.js';
import rabbit from './img/rabbit.jpg';

export default function(){
    const oLocation = useLocation();
    console.log( oLocation );
    return <div className="center-box" >
        <cpnt.myImg src={rabbit} />
        <div className="be-center">
            联系邮箱：176840078@qq.com
        </div>
    </div>
}