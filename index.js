const ping = require('ping')
const config = require('./config/config')
const schedule = require("node-schedule");
const y = require("yeelight-awesome");
const yeelight = new y.Yeelight({...config.yeelight});

schedule.scheduleJob("*/3 * * * * *",async function () {
    const isOnline = await checkOnLine()
    await controlLight(isOnline)
});

async function checkOnLine(){
    for (let host of  config.watchIP){
        const res =await ping.promise.probe(host,{timeout:10,extra: ['-i', '2'],})
        if(res.alive){
            return Promise.resolve(true)
        }
    }
    return Promise.resolve(false)
}

async function controlLight(status) {
    try {
        const my = await yeelight.connect()
        const pro = await my.getProperty([y.DevicePropery.BRIGHT, y.DevicePropery.POWER])
        if (pro.result.result[1] === (status ? 'off' : 'on')) {
            await my.toggle()
            await my.disconnect()
            let log = `${status ? '开灯成功' : '关灯成功'}`
            console.log(new Date().toLocaleString())
            console.log(log)
        } else {
            let log = `${status ? '灯已打开' : '灯已关闭'}`
            console.log(new Date().toLocaleString())
            console.log(log)
        }
    } catch (err) {
        console.error(err.message)
    }
}