/*
 * @Author: 李星阳
 * @LastEditors: 李星阳
 * @Description: 
 */ 

export const fileName = '伊索寓言';
export const mp3Src  = `./static/${fileName}.mp3`;

export async function getMp3() {
  const res = await fetch(mp3Src);
  // console.log('音频文件', res);
  const arrayBuffer = await res.arrayBuffer();
  let audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const buffer = await audioContext.decodeAudioData(arrayBuffer);
  audioContext = null; // 如果不销毁audioContext对象的话，audio标签是无法播放的
  return buffer; 
};

export async function getText() {
  let res = await fetch(`./static/${fileName}.srt`, {
    method: "get",
    headers: {"Content-Type": "application/json"},
    credentials: "same-origin",
  });
  return await res.text();
};


