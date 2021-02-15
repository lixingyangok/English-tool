/*
 * @Author: 李星阳
 * @Date: 2021-02-15 21:00:05
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-02-15 21:16:40
 * @Description: 
 */

import React from "react";
import {getOneMedia} from 'common/js/learning-api.js';

export default function(props){
    console.log(props);
    const {match} = props;
    const {params={}} = match;
    const mediaId = params.mediaId * 1;
    getOneMedia(mediaId).then(res=>{
        if (!res) return;
        console.log('媒体id-', res);
    });
    const HTML = <div className="center-box" >
        <br/>
        <br/>
        <br/>
        阅读：{mediaId}
    </div>
    return HTML;
}
