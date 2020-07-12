import React from 'react';
import { Result, Button } from 'antd';

export default function(){
    return <div className="center-box" >
        <br/>
        <br/>
        <Result status="403"
            title="这是首页"
            subTitle="欢迎来到“哈哈学习”，你能来这里，说明你智商蛮可以！"
            extra={<Button type="primary">Back Home</Button>}
        />
    </div>
}