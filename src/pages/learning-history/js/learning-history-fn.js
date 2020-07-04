/*
 * @Author: 李星阳
 * @LastEditors: 李星阳
 * @Description: 
 */ 

export default class{
    sayHello(){
        console.log('hello');
    }
    async startDb(){
        const myDb = window.myDb = new window.Dexie("myDb");
        myDb.version(1).stores({stories: '++id, name'});
        const {stories: oStories} = myDb;
        // 增
        // oStories.add({name:'张三', note: new Date()*1});
        // 删
        // oStories.delete(1); //删除id是1的数据
        // 修
        // oStories.put({id: 2, name: '新名字'}); //note键会丢失
        // 查
        let aStories = await oStories.toArray(); //所有表
        // let aAfterAHalf = await oStories.where('id').above(aAllItems.length/2).toArray(); //id大于9
        // let aAim = await oStories.where('id').equals(99).toArray();
        this.setState({oStories, aStories});
    }
    toDel(id){
        const {oStories, aStories} = this.state;
        this.setState({
            aStories: aStories.filter(cur => cur.id !== id),
        })
        oStories.delete(id);
    }
    setMyDb(){
        // const {oStories, aStories} = this.state;
        // oStories.put({id: 2, name: '新名字'}); //note键会丢失
    }
}

