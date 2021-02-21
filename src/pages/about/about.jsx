import React, {useState} from 'react';
import { useLocation } from 'react-router-dom';
import * as cpnt from './style/about.js';
import rabbit from './img/rabbit.jpg';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
// import { createFFmpegCore } from '@ffmpeg/core';

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

export function TextFn (){
	const [videoSrc, setVideoSrc] = useState('');
	const [message, setMessage] = useState('Click Start to transcode');
	const ffmpeg = createFFmpeg({
		log: true,
	});
	// console.log(typeof )
	const doTranscode = async () => {
		setMessage('Loading ffmpeg-core.js');
		await ffmpeg.load();
		setMessage('Start transcoding');
		// const mp3Data = await fetchFile('./51转格式.mp3');
		const mp3Data = await fetchFile('./51原.mp3');
		console.log('格式');
		console.log(mp3Data);
		ffmpeg.FS('writeFile', 'test.mp3', mp3Data);
		await ffmpeg.run('-i', 'test.mp3', 'test.mp4');
		setMessage('Complete transcoding');
		const data = ffmpeg.FS('readFile', 'test.mp4');
		setVideoSrc(URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' })));
	};
	return (
		<div className="App">
			<p>51原</p>
			<video src={videoSrc} controls></video>
			<br/>
			<button onClick={doTranscode}>Start</button>
			<p>{message}</p>
		</div>
	);
}