import React from 'react';
import { useLocation } from 'react-router-dom';
import { Result, Button } from 'antd';

export default function(){
    const oLocation = useLocation();
    console.log( oLocation );
    return <div className="center-box" >
        <br/>
        <br/>
        <Result
            title="正在开发"
            subTitle="Sorry, you are not authorized to access this page."
            extra={<Button type="primary">Back Home</Button>}
        />
    </div>
}