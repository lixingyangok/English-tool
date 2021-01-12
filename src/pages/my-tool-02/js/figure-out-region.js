/*
 * @Author: 李星阳
 * @Date: 2020-08-16 18:35:35
 * @LastEditors: 李星阳
 * @LastEditTime: 2020-08-23 17:40:09
 * @Description: 
 */

export default class {
	// ▼提供【波形数组】用于断句
	getWaveArr(fEndSec, iPerSecPx) {
		const { aPeaks } = this.getPeaks(
			this.state.buffer, iPerSecPx, (iPerSecPx * fEndSec), iPerSecPx * 20, // 取当前位置往后x秒
		);
		const myArr = aPeaks.reduce((result, cur, idx, arr) => {
            if (idx % 2) return result; //只处理0、2、4。不处理：1、3、5
            // ▼此处是否需要转整形，待考究
			const iOnePxHeight = Math.round((cur - arr[idx + 1]) * this.state.iHeight);
			return result.concat(iOnePxHeight);
        }, []);
		return myArr;
	}
	// ▼提供断句方法一个【候选区间的数组】
	getCandidateArr(aWaveArr, iPerSecPx, iWaveHeight) {
		const aSection = []; // 用于返回的数据
		for (let idx = 0; idx < aWaveArr.length; idx++) {
			const iCurHeight = aWaveArr[idx];
			if (iCurHeight < iWaveHeight) continue;
			const oLast = aSection.last_;
			if (oLast && (idx - oLast.end) / iPerSecPx < 0.35) { //上一区间存在 && 距离上一区间很近(0.35秒之内)。则视为一段话，累加长度
				const { start, end, fAveHeight } = oLast;
				const pxLong = idx - start + 1;
				oLast.end = idx;
				oLast.long = pxLong / iPerSecPx; //长度（秒）
				oLast.fAveHeight = Math.round(((end - start + 1) * fAveHeight + iCurHeight) / pxLong); //平均高度
				continue;
			}
			aSection.push({ // 视为新句子，新建
				start: idx, end: idx, long: 0, fAveHeight: iCurHeight,
			});
			if (!oLast) continue;
			oLast.iGapToNext = (idx - oLast.end) / iPerSecPx; //到下一步的距离
		}
		return aSection;
	}
	// ▼处理尾部
	fixTail(aWaveArr, iOldEnd, iPerSecPx, iAddition, iGapToNext) {
		const iSupplement = (() => { // 寻找合适的尾部位置
			for (let idx = 0; idx < iPerSecPx * 1; idx++) { //在1秒范围内进行判断
				const iOneStepPx = 10;
				const iSum = aWaveArr.slice(idx, idx + iOneStepPx).reduce((result, cur) => {
					return result + cur;
				});
				if (iSum / iOneStepPx < 1) return idx;
			}
			return false;
		})();
		const iResult = (() => { // 指定新的尾部位置
			if (iSupplement && iSupplement < iPerSecPx * 1) {
				console.log(`%c尾部补充 ${iSupplement} px`, 'background: yellow');
				return iSupplement + iAddition; // iAddition * 0.7 太短
			}
			return iAddition; //默认补偿值
		})();
		const iMaxEnd = iOldEnd + (iGapToNext * iPerSecPx - iAddition * 0.5); // 允许的最大值
		return Math.min(iOldEnd + iResult, iMaxEnd); // 即便补偿，不能越界
	}
	// ▼智能断句：1参是上一步的结尾的秒数， 2参是在取得的区间的理想的长度（秒数）
	figureOut(fEndSec, fLong = 2.5) {
		const [iPerSecPx, iWaveHeight, iAddition] = [100, 12, 20]; // 默认每秒宽度值（px），高度阈值，添加在两头的空隙，
		const aWaveArr = this.getWaveArr(fEndSec, iPerSecPx); //取得波形
        const aSection = this.getCandidateArr(aWaveArr, iPerSecPx, iWaveHeight);
		const { start, end } = (() => {
			const [oFirst, oSecond] = aSection;
			if (!oFirst) return { start: 0, end: aWaveArr.length };
			const start = Math.max(0, oFirst.start - iAddition);
			let { end, iGapToNext=3 } = (() => {
				const isFirstBetter = oFirst.long >= fLong || oFirst.iGapToNext > 1.2 || !oSecond;
				const idx = isFirstBetter ? 0 : 1;
				const [oChosen, oNextOne] = [aSection[idx], aSection[idx + 1]];
                // ▼ 下一段存在 && 很短 && 离它右边的邻居选远 && 离我近
				if (oNextOne && oNextOne.long < 1 && oNextOne.iGapToNext > 1 && oChosen.iGapToNext < 1) {
					console.log(`%c尾部追加临近数据 ${oNextOne.long} 秒`, 'background: pink');
					return oNextOne; //并入下一段
				}
				return oChosen;
			})();
            end = this.fixTail(aWaveArr.slice(end), end, iPerSecPx, iAddition, iGapToNext);
			return { start, end };
		})();
		return this.fixTime({
			start: fEndSec + (start / iPerSecPx),
			end: Math.min(fEndSec + (end / iPerSecPx), this.state.buffer.duration + 0.5),
		});
	}
}
