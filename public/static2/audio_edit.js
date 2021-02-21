/* eslint-disable */
/*
 * @Author: 李星阳
 * @Date: 2021-02-20 21:05:13
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-02-21 10:32:25
 * @Description: 
 */

export default function () {
	//	外部调用
	//	音频编辑 edit()
	//		 outformat:"mp3",	 //选填，输出格式 mp3, ogg, aac, wma, wav，默认mp3
	//		 outchannel:2,			//选填，输出音频声道数1,2，默认2
	//		 files:[{
	//			 name:"asd.mp3",	//必填，音频文件名，原名
	//			 buffer:buffer,	 //必填，音频buffer
	//			 stoptime:[30,50],//选填，截取-时间s，默认全部
	//			 inserttime:0,		//选填，插入到-时间s，默认顺延拼接
	//			 insertchannel:['0,0','1,1'] //选填，通道操作 '0,0','1,1','0,1','1,0' 多选 ex:'0,1'左=>右
	//		 }]
	//	格式转换 format()
	//			 name:"asd.mp3",		//必填，音频文件名，原名
	//			 buffer:buffer,		 //必填，音频buffer
	//			 outformat:"mp3",	 //选填，输出格式 mp3, ogg, aac, wma, wav，默认mp3
	//			 outchannel:2,			//选填，输出音频声道数1,2
	//			 outsample:44100,	 //选填，导出采样率 采样率 11025电话音质 22050广播音质 44100音频CD 48000 96000高清晰度DVD
	//			 outbitrate:"128k", //选填，导出比特率 96k、128k、192k、320k
	//	停止工作 stop()
	return {
		editworker: null,
		state: 1,//状态 1等待任务，2正在编译，3正在停止
		progress:0,//进度
		default_data: {
			//默认数据
			outformat: "mp3",//导出格式
			outchannel: 2,//导出声道数
		},
		audioContext: new (window.AudioContext || window.webkitAudioContext)(),
		encoderarr: {
			//格式对应编码器
			"mp3": "libmp3lame",
			"ogg": "libvorbis",
			"aac": "libfdk_aac",
			"wma": "wmav1",
		},
		postfixarr: {
			//格式对应编码器
			"mp3": "mp3",
			"ogg": "ogg",
			"aac": "mp4",
			"wma": "asf",
		},
		edit(option) {//音频编辑
			return new Promise(async (resolve, reject) => {
				console.log('收到文件');
				if (this.state != 1) {
					return resolve({ code: 400, message: '已有编译任务正在执行，请稍后重试' });
				}
				if(!option.files||option.files.length<=0){
					return resolve({ code: 400, message: '请插入音频文件' });
				}
				option.files.forEach((item)=>{
					if(!new RegExp(/\.mp3|\.ogg|\.mp4|\.asf|\.wav/ig).test(item.name)){
						return resolve({ code: 400, message: '无法识别文件'+item.name+'，请选择格式为.mp3/.ogg/.mp4/.wav的音频文件' });
					}
				});

				this.state = 2;
				this.progress = 1;//更新进度
				this.closeworker();
				// this.editworker = new Worker('./static/worker.js');
				// this.editworker = new Worker('static2/worker.js');
				this.editworker = new Worker(window.location.origin + '/static2/worker.js');

				let outformat = option.outformat || this.default_data.outformat;
				let outchannel = option.outchannel || this.default_data.outchannel;

				//音频文件截取，并转为mp3
				option.files.forEach((item, index) => {
					let arr = ["-i", item.name];
					if (typeof item.stoptime == 'object' && item.stoptime[1] - item.stoptime[0] != item.duration) {
						arr = arr.concat(["-ss", item.stoptime[0], "-t", item.stoptime[1] - item.stoptime[0]])
					}
					arr = arr.concat(["-ac", 2, "-acodec", "libmp3lame", "out.mp3"]);

					this.editworker.postMessage({
						type: "ffmpeg",
						index: index,
						files: item.buffer ? [{name: item.name, buffer: item.buffer}] : [],
						arguments: arr
					});
				});
				//接收worker处理后的音频，并将buffer转为audiobuffer
				let files = await this.awaitmassage(option.files.length, true, 65).catch(err=>{
					console.log('出错了哦=======');
					console.log(err);
				});
				if (!files) {
					// debugger	;
					return;
				}
				if (files.code == 400) {
					this.state = 1;
					return resolve({ 'code': 400, 'message': files.message })
				}
				files.forEach((item, index) => {
					option.files[index].name = item.name;
					option.files[index].audiobuffer = item.audiobuffer;
				});

				//计算时长
				let duration = 0;//时长
				option.files.forEach((item, key) => {//计算导出音频时长
					let starttime = item.inserttime =	Number( ( item.inserttime || item.inserttime === '0' || item.inserttime === 0 ) ? item.inserttime : duration ); //插入时间
					let endtime = starttime + item.audiobuffer.duration;//插入后结束时间
					duration = endtime > duration ? endtime : duration;//更新时长
				});

				let sampleRate = option.files[0].audiobuffer.sampleRate;
				//音频混合拼接
				let channels = 2;
				let sourceNodebuffer = this.audioContext.createBuffer(channels, Math.ceil(sampleRate * duration), sampleRate);
				for (var channel = 0; channel < channels; channel++) {//循环通道
					var newbuffer = sourceNodebuffer.getChannelData(channel);
					for (var key = 0; key < option.files.length; key++) {
						this.progress += parseInt((67+channel*3-this.progress)/(option.files.length-key))//进度到70
						if (typeof option.files[key].insertchannel != 'object') {
							option.files[key].insertchannel=[[0,0],[1,1]]
						}
						option.files[key].insertchannel.forEach((item, index) => {
							if (this.state == 3) {
								this.state = 1;
								return resolve({'code': 400,'message': '编译已停止'});
							};//停止点
							if (typeof item == 'string') {
								item = item.split(",");
							}
							if (item[1] == channel) {//插入目标通道是正在处理的通道
								let buffer = option.files[key].audiobuffer.getChannelData(item[0]);//提取通道
								// audio needs to be in [-1.0; 1.0]
								let i_start = parseInt(sampleRate * option.files[key].inserttime)
								for (var i = 0; i < buffer.length; i++) {
									newbuffer[i_start + i] += buffer[i];//插入目标通道
								}
							}
						})
					}
				}

				if (this.state == 3) {this.state = 1;return resolve({'code': 400,'message': '编译已停止'})};//停止点

				//转码成要求格式，返回处理后音频文件buffer
				let wavfile = this.getFullWavData(sourceNodebuffer);//生成wav
				// console.log(wavfile)
				if (outformat == "wav") {
					this.state = 1;
					this.progress = 100;//更新进度
					this.closeworker();
					resolve({
						'code': 200,//输出文件
						'name': "out.wav",
						'buffer': wavfile.buffer
					});
				} else {
					if (this.state == 3) {this.state = 1;return resolve({'code': 400,'message': '编译已停止'})};//停止点
					let arr = ["-i", "out.wav", "-ac", outchannel, "-ar", sampleRate, "-acodec", this.encoderarr[outformat], "out." + this.postfixarr[outformat]];
					this.editworker.postMessage({
						type: "ffmpeg",
						index: 0,
						files: [{
							name: "out.wav",
							buffer: wavfile.buffer
						}],
						arguments: arr
					});
					//接收worker处理后的音频
					let files = await this.awaitmassage(1,false,100);
					this.state = 1;
					this.closeworker();
					if (files.code == 400) {
						return resolve({
							'code': 400,//失败
							'message': files.message
						})
					}
					resolve({
						'code': 200,//输出文件
						'name': files[0].name,
						'buffer': files[0].buffer
					})
				}
			});
		},

		// 大分界 ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
		// 大分界 ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
		// 大分界 ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
		// 大分界 ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
		// 大分界 ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
		// 大分界 ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
		// 大分界 ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
		// 大分界 ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
		// 大分界 ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
		// 大分界 ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
		
		format(option){//格式转换
			return new Promise(async (resolve, reject) => {
				if (this.state != 1) {
					return resolve({
						code: 400,
						message: '已有编译任务正在执行，请稍后重试'
					})
				}
				if (!option.name||!option.buffer) {
					return resolve({
						code: 400,
						message: '请插入音频文件，并传入名称'
					})
				}
				if (!new RegExp(/\.mp3|\.ogg|\.mp4|\.asf|\.wav/ig).test(option.name)) {
					return resolve({
						code: 400,
						message: '无法识别文件' + option.name + '，请选择格式为.mp3/.ogg/.mp4/.asf/.wav的音频文件'
					})
				}

				this.state = 2;
				this.progress = 1;//更新进度
				this.closeworker();
				this.editworker = new Worker('./static/worker.js');

				let outformat = option.outformat || this.default_data.outformat;

				let arr = ["-i", option.name];
				if(option.outchannel){
					arr = arr.concat(["-ac", option.outchannel]);
				}
				if(option.outsample){
					arr = arr.concat(["-ar", option.outsample]);
				}
				if(option.outbitrate){
					arr = arr.concat(["-b:a", option.outbitrate]);
				}
				arr = arr.concat(["-acodec", this.encoderarr[outformat], "out." + this.postfixarr[outformat]]);

				this.editworker.postMessage({
					type: "ffmpeg",
					index: 0,
					files: option.buffer ? [{name: option.name, buffer: option.buffer}] : [],
					arguments: arr
				});

				//接收worker处理后的音频
				let files = await this.awaitmassage(1, false, 100);
				this.state = 1;
				this.closeworker();
				if (files.code == 400) {
					return resolve({
						'code': 400,//失败
						'message': files.message
					})
				}
				resolve({
					'code': 200,//输出文件
					'name': files[0].name,
					'buffer': files[0].buffer
				})

			})
		},
		stop() {//停止任务
			if( this.state == 2 ){
				this.state = 3;
				this.closeworker();
			}
		},
		closeworker(){//关闭worker
			if (this.editworker) {
				// //通知worker关闭,内部因ffmpeg阻碍无法及时停止
				// this.editworker.postMessage({
				//	 type: "close"
				// });
				this.editworker.terminate();
				this.editworker = null;
			}
		},
		toaudiobuffer(arraybuffer) {
			return new Promise((resolve, reject) => {
				this.audioContext.decodeAudioData(arraybuffer, buffer => {
					if (buffer) {
						resolve({
							code: 200,
							buffer: buffer
						})
					} else {
						resolve({
							code: 400,
							message: '音频转码失败'
						});
					}
				});
			})
		},
		awaitmassage(length, toaudiobuffer, progress) {
			//length文件数量，toaudiobuffer是否转为audiobuffer，progress更新进度到多少
			return new Promise((resolve, reject) => {
				let durationRegexp = /Duration: (.*?), /;
				let timeRegexp = /time=(.*?) /;
				let duration = 0;
				let time = 0;
				let progress_c = progress - this.progress;
				let files = [];
				let getmessage = (event) => {
					var message = event.data;
					if (message.type == "stdout") {//接收到数据
						// console.log(message.data);
					} else if (message.type == "stderr") {//接收到信息与错误
						// console.log(message.data);
						if (progress&&durationRegexp.exec(message.data)) {//总时长
							duration = this.timeToSeconds(durationRegexp.exec(message.data)[1]);
							time = 0;
						}
						if (progress&&timeRegexp.exec(message.data)) {//更新进度
							let short = this.timeToSeconds(timeRegexp.exec(message.data)[1]);
							this.progress = ( this.progress - 0 + (((short-time)/duration)*(progress_c/length))).toFixed(2);
							time = short
						}
					} else if (message.type == "outfile") {//结束
						files[message.index] = {};
						files[message.index].name = message.name;
						if(progress&&length==files.length){ this.progress = progress }//更新进度
						if (toaudiobuffer) {
							this.toaudiobuffer(message.buffer).then((res) => {
								if (res.code == 200) {
									files[message.index].audiobuffer = res.buffer;
									if (files.length == length) {
										this.editworker&&this.editworker.removeEventListener('message', getmessage);//停止监听
										files.code == 200;
										// debugger	;
										resolve(files)
									}
								}
							});
						} else {
							files[message.index].buffer = message.buffer;
							if (files.length == length) {
								this.editworker&&this.editworker.removeEventListener('message', getmessage);//停止监听
								files.code == 200;
								// debugger	;
								resolve(files)
							}
						}
					}else{
						console.log('message.type: ', message.type);
					}
				};
				if (window.getmessageFn) console.log('相等吗？', window.getmessageFn === getmessage);
				window.getmessageFn = getmessage;
				// debugger	;
				let step = (timestamp) => {
					if (this.state==3) {
						this.editworker&&this.editworker.removeEventListener('message', getmessage);//停止监听
						resolve({ code: 400, message: "编译已停止" });
					}else if(this.state==2){
						window.requestAnimationFrame(step);
					}
				}
				window.requestAnimationFrame(step);
				this.editworker.addEventListener('message', getmessage, false);
				// resolve();
			});
		},
		getFullWavData(audiobuffer) {
			var sampleRate = audiobuffer.sampleRate;
			var sampleBits = 16;
			var bytes = audiobuffer.getChannelData(0);
			var bytes2 = audiobuffer.getChannelData(1);
			var dataLength = (bytes.length + bytes2.length) * (sampleBits / 8);

			var buffer = new ArrayBuffer(44 + dataLength);
			var data = new DataView(buffer);
			var offset = 0;
			var writeString = function (str) {
				for (var i = 0; i < str.length; i++) {
					data.setUint8(offset + i, str.charCodeAt(i));
				}
			};
			// 资源交换文件标识符
			writeString('RIFF');
			offset += 4;
			// 下个地址开始到文件尾总字节数,即文件大小-8
			data.setUint32(offset, 36 + dataLength, true);
			offset += 4;
			// WAV文件标志
			writeString('WAVE');
			offset += 4;
			// 波形格式标志
			writeString('fmt ');
			offset += 4;
			// 过滤字节,一般为 0x10 = 16
			data.setUint32(offset, 16, true);
			offset += 4;
			// 格式类别 (PCM形式采样数据)
			data.setUint16(offset, 1, true);
			offset += 2;
			// 通道数
			data.setUint16(offset, audiobuffer.numberOfChannels, true);
			offset += 2;
			// 采样率,每秒样本数,表示每个通道的播放速度
			data.setUint32(offset, sampleRate, true);
			offset += 4;
			// 波形数据传输率 (每秒平均字节数) 单声道×每秒数据位数×每样本数据位/8
			data.setUint32(offset, audiobuffer.numberOfChannels * sampleRate * (sampleBits / 8), true);
			offset += 4;
			// 快数据调整数 采样一次占用字节数 单声道×每样本的数据位数/8
			data.setUint16(offset, audiobuffer.numberOfChannels * (sampleBits / 8), true);
			offset += 2;
			// 每样本数据位数
			data.setUint16(offset, sampleBits, true);
			offset += 2;
			// 数据标识符
			writeString('data');
			offset += 4;
			// 采样数据总数,即数据总大小-44
			data.setUint32(offset, dataLength, true);
			offset += 4;
			// 写入采样数据
			data = this.reshapeWavData(sampleBits, offset, bytes, bytes2, data);
			return data
		},

		reshapeWavData(sampleBits, offset, iBytes, iBytes2, oData) {
			if (sampleBits === 8) {
				for (var i = 0; i < iBytes.length; i++, offset++) {
					var s = Math.max(-1, Math.min(1, iBytes[i]));
					var val = s < 0 ? s * 0x8000 : s * 0x7FFF;
					val = parseInt(255 / (65535 / (val + 32768)));
					oData.setInt8(offset, val, true);
				}
			} else {
				for (var i = 0; i < iBytes.length; i++, offset += 4) {
					var s = Math.max(-1, Math.min(1, iBytes[i]));
					oData.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);

					var s = Math.max(-1, Math.min(1, iBytes2[i]));
					oData.setInt16(offset + 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
				}
			}
			return oData;
		},
		
		timeToSeconds(time) {
			var parts = time.split(":");
			return parseFloat(parts[0]) * 60 * 60 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]) + parseFloat("0." + parts[3]);
		},
	}
}
