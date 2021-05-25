const ping = require('ping')
const config = require('./config/config')
const schedule = require("node-schedule");
const y = require("yeelight-awesome");


let lights= {
    lg1:{lg:null,status:false}
}



const  duration = 2000, brightness = 29

initLight(config.yeelight).then(res=>{
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
            let log = `${onoff ? '开灯成功' : '关灯成功'}`
            console.log(new Date().toLocaleString())
            console.log(log)
        }
    }
    catch (err){
        switch (err.code){
            case -111:
            case -113:{
                lights.lg1 = await initLight()
                await controlLight(lights.lg1,onoff)
            }default:{
                console.error(err)
                await Promise.reject(err)
            }
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
        console.error(err)
        await Promise.reject(err)
    }
}
