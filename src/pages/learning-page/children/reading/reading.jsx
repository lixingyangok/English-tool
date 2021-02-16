/*
 * @Author: 李星阳
 * @Date: 2021-02-15 21:00:05
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-02-16 10:20:45
 * @Description: 
 */

import React from "react";
import {getOneMedia, getSubtitle} from 'assets/js/learning-api.js';
import {trainingDB} from 'assets/js/common.js';

const {media: mediaTB} = trainingDB;

export default function(props){
	console.log(props);
	const {match} = props;
	const {params={}} = match;
	const mediaId = params.mediaId * 1;
	const [oMedia, setMedia] = React.useState({});
	const [aSubtitle, setSubtitle] = React.useState([]);
	const [fileSrc, setFileSrc] = React.useState(null);
	const [timer, setTimer] = React.useState(null);
	const Audio = React.useRef();
	const toPlay = (oLine)=>{
		clearInterval(timer);
		const oCurrent =  Audio.current;
		const {start, end} = oLine;
		oCurrent.currentTime = start;
		oCurrent.play();
		const newTimer = setInterval(() => {
			const { currentTime: cTime } = oCurrent;
			if (cTime < end) return;
			oCurrent.pause();
			clearInterval(timer);
		}, 1000 / 70); //每秒执行次数70
		setTimer(newTimer);
		console.log("当前：\n", oLine);
	}
	// useRef
	React.useEffect(()=>{
		(async ()=>{
			const [oRes, mediaInTB={}] = await Promise.all([
				getOneMedia(mediaId),
				mediaTB.where('ID').equals(mediaId*1).first(),
			]);
			setMedia(oRes || {});
			if (!oRes.subtitleFileId) return; // 没有字幕信息，返回
			if (mediaInTB.mediaFile_){
				const src = URL.createObjectURL(mediaInTB.mediaFile_);
				setFileSrc(src);
			}
			const [aSubtitle] = await Promise.all([
				getSubtitle(oRes),
			]);
			setSubtitle(aSubtitle || []);
			console.log('mediaInTB', mediaInTB);
		})();
	}, [mediaId]);
	
	const HTML = <div className="center-box" >
		<br/><br/>
		<div>
			<video controls src={fileSrc} ref={Audio} >
				{/* <source /> */}
			</video>
			{/* <p className="subtitle" data-text={oThisLine.text}>
				{oThisLine.text}
			</p> */}
		</div>
		阅读：{mediaId}<br/>
		{oMedia.fileName}
		<br/>
		<hr/>
		{aSubtitle.map((cur, idx)=>{
			return <p key={idx} onClick={()=>toPlay(cur)}>
				{cur.text}
			</p>
		})}
	</div>
	return HTML;
}
