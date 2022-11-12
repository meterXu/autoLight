const ping = require('ping')
const yeelib = require("yeelight-awesome");

let yeelight = null

async function checkOnLine(ips) {
    for (let host of ips) {
        const res = await ping.promise.probe(host, {timeout: 1, extra: ['-i', '2'],})
        if (res.alive) {
            return Promise.resolve(true)
        }
    }
    return Promise.resolve(false)
}


async function discover(){
    return new Promise(((resolve, reject) => {
        const discover = new yeelib.Discover({
            port: 1982,
        });
        discover.start().then(devices=>{
            yeelight = new yeelib.Yeelight({
                lightIp: devices[0].host,
                lightPort: devices[0].port
            });
            resolve(devices[0])
        }).catch((e) => {
            reject(e)
        }).finally(()=>{
            discover.destroy();
        })
    }))

}

async function controlLight(isOn) {
    return new Promise((resolve, reject) => {
        if(yeelight){
            log('log', `${isOn ? 'ready to turn on the lights' : 'ready to turn off the lights'}`)
            yeelight.connect().then(l=>{
                log('log', 'Device connected successfully')

                l.getProperty([yeelib.DevicePropery.POWER]).then(pro=>{
                    if (pro.result.result[0] === (isOn ? 'off' : 'on')) {
                        log('log', `${isOn ? 'start turning on the lights' : 'start turning off the lights'}`)
                        l.toggle().then(()=>{
                            log('log', `${isOn ? 'Turn on the light successfully' : 'Turn off the lights successfully'}`)
                            if(isOn){
                                l.startColorFlow(
                                    [
                                        new yeelib.FlowState(4000, 1, 16766208, 50),
                                        new yeelib.FlowState(4000, 1, 65280, 50),
                                        new yeelib.FlowState(4000, 1, 16744192, 50),
                                        new yeelib.FlowState(4000, 1, 255, 50)
                                    ],
                                    yeelib.StartFlowAction.LED_RECOVER
                                ).then(()=>{
                                    resolve()
                                    log('log', 'light startColorFlow successfully')
                                }).finally(()=>{
                                    yeelight.disconnect()
                                    log('log', 'Device disconnected successfully')
                                })
                            }else{
                                resolve()
                                yeelight.disconnect()
                                log('log', 'Device disconnected successfully')
                            }
                        }).catch(err=>{
                            log('toggle light err', err)
                            reject(err)
                        })
                    }else {
                        resolve()
                        log('log', `${isOn ? 'light is on' : 'lights are off'}`)
                    }
                }).catch(err=>{
                    log('getProperty err', err)
                    reject(err)
                })
            }).catch(err=>{
                log('connect err', err)
                reject(err)
            })
        }else {
            log('err', 'yeelight is null')
            reject('yeelight is null')
        }
    })
}

function log(type, msg) {
    let options = { hour12: false };
    const datetime = new Date().toLocaleString('zh-CN',options)
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

module.exports =  {
    discover,
    checkOnLine,
    controlLight,
    log
}