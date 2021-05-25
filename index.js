const ping = require('ping')
const config = require('./config/config')
const schedule = require("node-schedule");
const y = require("yeelight-awesome");


let lights= {
    lg1:{lg:null,status:false,reInit:0}
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
        if(lgObj.status !== onoff){
            await lgObj.lg.toggle()
            lgObj.status = onoff
            let msg = `${onoff ? '开灯成功' : '关灯成功'}`
            log('log',msg)
        }
    }
    catch (err){
        if(lights.lg1.reInit<3){
            switch (err.code){
                case -111:
                case -113:{
                    lights.lg1 = await initLight()
                    log('log',`重试连接灯次数：${lights.lg1.reInit+1}`)
                    lights.lg1.reInit++;
                    await controlLight(lights.lg1,onoff)
                }default:{
                    log('error',err)
                    await Promise.reject(err)
                }
            }
        }else {
            log('log',`超过重连次数3次`)
            log('error',err)
            await Promise.reject(err)
        }

    }
}

async function initLight(config){
    try{
        if(!lights.lg1.lg){
            const _yl =  new y.Yeelight({...config})
            _yl.autoReconnect=true
            let lg = await _yl.connect()
            const pro = await lg.getProperty([y.DevicePropery.BRIGHT, y.DevicePropery.POWER])
            let status = pro.result.result[1]==='on'
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