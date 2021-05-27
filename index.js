const ping = require('ping')
const config = require('./config/config')
const schedule = require("node-schedule");
const y = require("yeelight-awesome");
let triggerFalg = false

log('log', '自动灯控服务开启')
schedule.scheduleJob("*/1 * * * * *", async function () {
    const onoff = await checkOnLine()
    if (triggerFalg != onoff) {
        log('log', '检测到社保状态发生变化')
        await controlLight(config.yeelight, onoff)
        triggerFalg = true
    }
});


async function checkOnLine() {
    for (let host of config.watchIP) {
        const res = await ping.promise.probe(host, {timeout: 1, extra: ['-i', '2'],})
        if (res.alive) {
            return Promise.resolve(true)
        }
    }
    return Promise.resolve(false)
}

async function controlLight(config, onoff) {
    try {
        const _yl = new y.Yeelight({...config})
        let lg = await _yl.connect()
        const pro = await lg.getProperty([y.DevicePropery.BRIGHT, y.DevicePropery.POWER])
        if (pro.result.result[1] === (onoff ? 'off' : 'on')) {
            await lg.toggle()
            await _yl.disconnect()
            let msg = `${onoff ? '开灯成功' : '关灯成功'}`
            log('log', msg)
        }
    } catch (err) {
        log('error', err)
        await Promise.reject(err)
    }
}

function log(type, msg) {
    const datetime = new Date().toLocaleString()
    switch (type) {
        case 'error': {
            console.error(datetime + ' ' + msg)
        }
            break;
        case "log": {
            console.log(datetime + ' ' + msg)
        }
            break;
        default: {
            console.log(datetime + ' ' + msg)
        }
    }

}