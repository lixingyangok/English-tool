/*
 * @Author: 李星阳
 * @Date: 2021-02-21 16:26:01
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-02-21 16:34:02
 * @Description: 
 */
import {oStoryType} from 'assets/js/data.js';
const {axios} = window;

export async function getAllStory(params){
    const {data} = await axios.get('/story', {
        params,
    });
    if (!data || !data.rows) return;
    data.rows.forEach(cur=>{
        const iType = cur.type || 0;
        cur.time_ = new Date(cur.CreatedAt).toLocaleString();
        cur.info_ = oStoryType[iType];
    });
    return data;
}
