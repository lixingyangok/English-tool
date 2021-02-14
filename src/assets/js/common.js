/*
 * @Author: 李星阳
 * @Date: 2021-02-14 15:52:51
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-02-14 15:57:51
 * @Description: 
 */


let trainingDB = null;

// 得到数据库，Define your database
export function getTrainingDb(){
    trainingDB = trainingDB || new window.Dexie("trainingDB");
    trainingDB.version(1).stores({story: '++id, ID, name, storyId'});
    trainingDB.version(2).stores({media: '++id, ID, fileId, ownerStoryId'});
    return trainingDB;
}
