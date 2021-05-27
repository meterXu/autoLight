const ping = require('ping')
const config = require('./config/config')
const schedule = require("node-schedule");
const y = require("yeelight-awesome");


let lights= {
    lg1:{lg:null,status:false,reInit:0,lock:null}
}

log('log','自动灯控服务开启')
initLight(config.yeelight).then(res=>{
    log('log','初始化灯对象成功')
    lights.lg1=res
    schedule.scheduleJob("*/1 * * * * *", async function () {
        const onoff = await checkOnLine()
        await controlLight(lights.lg1,onoff)
    });
})

async function checkOnLine() {
    for (let host of config.watchIP) {
        const res = await ping.promise.probe(host, {timeout: 1, extra: ['-i', '2'],})
        if (res.alive) {
            return Promise.resolve(true)
        }
    }
    return Promise.resolve(false)
}

async function controlLight(lgObj,onoff) {
    try{
        if(lgObj.status !== onoff && !lights.lg1.lock){
            const _yl =  new y.Yeelight({...config})
            let lg = await _yl.connect()
            lights.lg1 = lg
            lights.lg1.lock = true
            log('log','检测到设备状态发生变化')
            await lgObj.lg.toggle()
            lights.lg1.lock = false
            lgObj.status = onoff
            lg.disconnect()
            let msg = `${onoff ? '开灯成功' : '关灯成功'}`
            log('log',msg)
        }
    }
    catch (err){
        log('error',err)
        await Promise.reject(err)
    }
}

async function initLight(config){
    try{
        if(!lights.lg1.lg){
            const _yl =  new y.Yeelight({...config})
            let lg = await _yl.connect()
            const pro = await lg.getProperty([y.DevicePropery.BRIGHT, y.DevicePropery.POWER])
            let status = pro.result.result[1]==='on'
            lg.disconnect()
            return  Promise.resolve({lg, status})
        }
    }
    catch (err){
        log('error',err)
        await Promise.reject(err)
    }
}

function log(type,msg){
    const datetime = new Date().toLocaleString()
    switch (type){
        case 'error':{
            console.error(datetime+' ' +msg)
        }break;
        case "log":{
            console.log(datetime+' ' +msg)
        }break;
        default:{
            console.log(datetime+' ' +msg)
        }
    }

}