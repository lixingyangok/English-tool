/*
 * @Author: 李星阳
 * @Date: 2021-02-15 21:00:05
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-02-15 22:07:01
 * @Description: 
 */

import React from "react";
import {getOneMedia, getSubtitle} from 'common/js/learning-api.js';

export default function(props){
	console.log(props);
	const {match} = props;
	const {params={}} = match;
	const mediaId = params.mediaId * 1;
	const [oMedia, setMedia] = React.useState({});
	const [aSubtitle, setSubtitle] = React.useState([]);

	React.useEffect(()=>{
		(async ()=>{
			const oRes = await getOneMedia(mediaId);
			setMedia(oRes || {});
			if (!oRes.subtitleFileId) return;
			const aSubtitle = await getSubtitle(oRes);
			setSubtitle(aSubtitle || []);
		})();
	}, [mediaId]);
	const HTML = <div className="center-box" >
		<br/>
		<br/>
		<br/>
		阅读：{mediaId}<br/>
		{oMedia.fileName}
		<br/>
		<hr/>
		{aSubtitle.map((cur, idx)=>{
			return <p key={idx} >
				{cur.text}
			</p>
		})}
	</div>
	return HTML;
}
