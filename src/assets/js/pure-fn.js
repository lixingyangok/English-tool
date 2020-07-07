/*
 * @Author: 李星阳
 * @LastEditors: 李星阳
 * @Description: 
 */ 

// ▼字符转字幕数据，用于显示
export async function fileToTimeLines(oFile) {
    const text = await fileToStrings(oFile);
    const aLine = [];
    let strArr = text.split('\n');
    strArr = text.split('\n').filter((cur, idx) => {
        const isTime = /\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}/.test(cur);
        if (!isTime) return false;
        aLine.push(strArr[idx + 1]);
        return isTime;
    });
    return strArr.map((cur, idx) => {
        const [aa, bb] = cur.split(' --> ');
        const [start, end] = [getSeconds(aa), getSeconds(bb)];
        const text = aLine[idx].trim();
        return fixTime({start, end, text});
    });
}

export async  function fileToBuffer(oFile){
    console.log('转buffer');
    const reader = new FileReader();
    let resolveFn = xx => xx;
    const promise = new Promise(resolve => resolveFn = resolve);
    reader.onload = async evt => {
        let audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const arrayBuffer = evt.currentTarget.result;
        const buffer = await audioContext.decodeAudioData(arrayBuffer);
        audioContext = null; // 如果不销毁audioContext对象的话，audio标签是无法播放的
        resolveFn(bufferToObj(buffer));
    };
    reader.readAsArrayBuffer(oFile);
    return promise;
}

// ▼秒-转为时间轴的时间
function secToStr(fSecond){
    let iHour = Math.floor(fSecond / 3600) + ''; //时
    let iMinut = Math.floor((fSecond - iHour * 3600) / 60) + ''; //分
    let fSec = fSecond - (iHour*3600 + iMinut*60) + ''; //秒
    let [sec01, sec02='000'] = fSec.split('.');
    const sTime = `${iHour.padStart(2, 0)}:${iMinut.padStart(2, 0)}:${sec01.padStart(2, 0)},${sec02.slice(0, 3).padEnd(3,0)}`;
    return sTime;
}

// ▼时间轴的时间转秒
export function getSeconds(text) {
    const [hour, minute, second, tail] = text.match(/\d+/g);
    let number = (hour * 60 * 60) + (minute * 60) + `${second}.${tail}` * 1;
    return number.toFixed(2) * 1;
};

// ▼修整某一行
export function fixTime(oTarget){
    const {start, end, text} = oTarget;
    oTarget.start_ = secToStr(start);
    oTarget.end_ = secToStr(end);
    oTarget.long = end - start;
    oTarget.text = text || '';
    return oTarget;
}

// ▼文件转字符
function fileToStrings(oFile) {
    let resolveFn = xx => xx;
    const oPromise = new Promise(resolve => resolveFn = resolve);
    const reader = Object.assign(new FileReader(), {
        onload: event => resolveFn(event.target.result), // event.target.result就是文件文本内容,
    });
    reader.readAsText(oFile);
    return oPromise;
}

function bufferToObj(buffer){
    return {
        duration: buffer.duration,
        length: buffer.length,
        sampleRate: buffer.sampleRate,
        numberOfChannels: buffer.numberOfChannels,
        aChannelData: buffer.getChannelData(0),
    };
}