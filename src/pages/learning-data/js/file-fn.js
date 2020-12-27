/*
 * @Author: 李星阳
 * @LastEditors: 李星阳
 * @Description: 
 */
import {fileToTimeLines, fileToBuffer, getFaleBuffer, downloadString} from 'assets/js/pure-fn.js';
const axios = window.axios;

export default class FileList {
	// ▼input导入文件到某个故事（通过第3个参数判断是新增还是修改
	async toImport(ev, oStory) {
		const { target } = ev;
		const showError = this.message.error;
		const file = target.files[0];
		if (!file || !/^(video\/|audio\/).+/.test(file.type) ) {
			target.value = '';
			return showError('只能上传音频/视频');
		}
		this.setState({loading: true});
		const tokenRes = await axios.get('/test/gettoken');
		if (!tokenRes) {
			this.setState({loading: false});
			return showError('查询token未成功');
		}
		const fileRes = await axios.post('http://upload-z2.qiniup.com', {
			file,
			fname: file.name,
			token: tokenRes.token,
		});
		this.setState({loading: false});
		target.value = '';
		if (!fileRes) return showError('保存文件未成功');
		const uploadRes = await axios.post('/media', {
			storyId: oStory.ID,
			fileId: fileRes.key,
			fileName: file.name,
			fileSize: file.size,
		});
		if (!uploadRes) return showError('保存文件id未成功');
		console.log('uploadRes', uploadRes);
	}
	// ▼查询故事下的文件
	async getMediaForOneStory(oStory){
		const res = await axios.get('/media/' + oStory.ID);
		if (!res) return;
		const aStory = this.state.aStory.map(cur=>{
			if (cur.ID === oStory.ID) cur.aMedia_ = res;
			return cur;
		});
		this.setState({aStory});
	}
	// ▼删除一个文件
	async delOneMedia(oneMedia){
		const res = await axios.delete('/media/' + oneMedia.ID);
		if (!res) return;
		this.message.success("删除成功");
	}
	// 新旧分界------------------
	
	// ▼过滤出正确的文件
	getCorrectFile(oFiles) {
		const aTwoTypeFiles = [...oFiles].reduce((aResult, curFile)=>{
			const {type, name} = curFile;
			if (name.includes('.') && (type.startsWith('audio/') || type.startsWith('video/'))) {
				aResult[0].push(curFile);
			}else if (name.endsWith('.srt')) {
				aResult[1].push(curFile);
			}
			return aResult;
		}, [[], []]);
		console.log('文件：', aTwoTypeFiles[0], aTwoTypeFiles[1]);
		return aTwoTypeFiles;
	}
	// ▼保存章节
	async saveSection(oStory, aFiles) {
		const [audioFile, srtFile] = aFiles;
		const aMakeSections = audioFile.map(async curFile=>{
			const aLines = await (async () => {
				const sCurFileName = curFile.name.split('.').slice(0,-1).join('.');
				const matchedSrtFile = srtFile.find(cur => cur.name.startsWith(sCurFileName));
				if (!matchedSrtFile) return [];
				return await fileToTimeLines(matchedSrtFile);
			})();
			return {
				idx: 0,
				aLines,
				parent: oStory.id,
				audioFile: curFile,
				buffer: undefined,
				srtFile: undefined, //字幕文件好像没用
			};
		});
		const aSections = await Promise.all(aMakeSections);
		const idArr = [];
		for (const curSct of aSections) {
			const id = await this.state.oSectionTB.add(curSct);
			idArr.push(id);
		}
		await this.getSctToStory(oStory.id); //更新故事下的章节
		idArr.forEach((id, idx)=>{
			this.getSectionBuffer({...aSections[idx], id});
		});
		this.message.success('保存完成，正在解析波形数据'); //放在最后？
	}
	// ▼【更新】章节
	async upDateSection(oSct, aFiles) {
		const [audioFile, srtFile] = aFiles;
		if (audioFile) {
			const aStories = this.state.aStories.map(cur => {
				if (cur.id !== oSct.parent) return cur;
				const oTarget = cur.aSections.find(item => item.id === oSct.id);
				oTarget.audioFile = audioFile;
				oTarget.buffer = undefined;
				return cur;
			});
			this.setState({aStories}); // 先更新视图，即把旧文件清除掉
		}
		const {srtFile: srtFileOld, audioFile: audioFileOld} = oSct;
		const aLines = srtFile ? await fileToTimeLines(srtFile) : oSct.aLines;
		const oSection = {
			aLines,
			srtFile: srtFile || srtFileOld,
			audioFile: audioFile || audioFileOld,
		};
		await this.state.oSectionTB.update(oSct.id, oSection);
		await this.getSctToStory(oSct.parent);
		audioFile && this.getSectionBuffer(oSct);
		this.message.success('保存完成' + (audioFile ? '，正在解析波形数据' : '')); //放在最后
	}
	// 给章节添加buffer
	async getSectionBuffer(oSct){
		if (!oSct.audioFile) return this.message.error('没有音频文件，无法初始化');
		const getStories = (isLoading, buffer) => this.state.aStories.map(cur=>{
			if (cur.id === oSct.parent)  Object.assign(
				cur.aSections.find(item=>item.id === oSct.id),
				{isLoading, buffer},
			);
			return cur;
		});
		this.setState({aStories: getStories(true, {})});
		let buffer = await fileToBuffer(oSct.audioFile);
		this.message.success('解析完成，正在保存波形数据');
		await new Promise(resolve=>setTimeout(resolve, 700));
		buffer = getFaleBuffer(buffer);
		this.setState({aStories: getStories(false, buffer)});
		await this.state.oSectionTB.update(oSct.id, {buffer});
		this.message.success('波形数据保存完成');
	}
	// ▼删除某章节
	toDelSection(oSct){
		const onOk = ()=>{
			this.state.oSectionTB.delete(oSct.id);
			this.getSctToStory();
		};
		this.Modal.confirm({
			title: `是否确认删除?`,
			content: `正在删除：${oSct.audioFile.name}`,
			cancelText: '取消',
			okText: '确认',
			onOk,
		});
	}
	// ▼导出字幕文件
	toExport(oSct) {
		const aStr = oSct.aLines.map(({start_, end_, text}, idx) => {
			return `${idx + 1}\n${start_} --> ${end_}\n${text}\n`;
		});
		const fileName = oSct.audioFile.name.split('.').slice(0, -1).join('.');
		downloadString(aStr.join('\n'), fileName, 'srt');
	}
};

