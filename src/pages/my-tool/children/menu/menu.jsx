import React from "react";
import * as cpnt from './style/menu.js';

/* 
文件：导入、导出、暂存、最近打开
编辑：撤销、恢复、查找/替换
字幕：拆分、合并、时间调整

关于
*/
export default class Menu extends React.Component{
    render(){
        return <cpnt.Header>
            <cpnt.Nav>
                <cpnt.Ul>
                    <li>文件</li>
                    <li>编辑</li>
                    <li>字幕</li>
                    <li>关于</li>
                </cpnt.Ul>
            </cpnt.Nav>
            {/* 分界 */}
            <section>
                {/* <Icon type="link" /> */}
                <br/>
            </section>
        </cpnt.Header>
    }
}