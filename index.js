const ping = require('ping')
const config = require('./config/config')
const schedule = require("node-schedule");
const y = require("yeelight-awesome");
const yeelight = new y.Yeelight({...config.yeelight});

let my,lightStatus = null
const  duration = 2000, brightness = 29

yeelight.connect().then(async res => {
    my = res
    const pro = await my.getProperty([y.DevicePropery.BRIGHT, y.DevicePropery.POWER])
    lightStatus = pro.result.result[1] ==='on'
    schedule.scheduleJob("*/1 * * * * *", async function () {
        const isOnline = await checkOnLine()
        await controlLight(isOnline)
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

async function controlLight(status) {
    try {
        if (!my || !my.connected) {
            my = await yeelight.connect()
        }
        if(status !== lightStatus)
        {
            const pro = await my.getProperty([y.DevicePropery.BRIGHT, y.DevicePropery.POWER])
            if (pro.result.result[1] === (status ? 'off' : 'on')) {
                await my.toggle()
                let log = `${status ? '开灯成功' : '关灯成功'}`
                lightStatus = status
                console.log(new Date().toLocaleString())
                console.log(log)
            }
        }
    } catch (err) {
        console.error(err)
    }
}