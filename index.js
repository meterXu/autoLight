const config = require('./config/config')
const schedule = require("node-schedule");
const {checkOnLine,controlLight,log,discover} = require('./devices/index')

let triggerFlag = false

log('log', 'check yeelight in LAN.')
discover().then((devices)=>{
    log('log', `found yeelight,host:${devices.host},port:${devices.port}`)
    schedule.scheduleJob("*/1 * * * * *", async function () {
        const online = await checkOnLine(config.watchIPs)
        if (triggerFlag != online) {
            triggerFlag = online
            log('log', `device's online status is ${online?'up':'down'}`)
            await controlLight(online)
        }
    });
}).catch(err=>{
    log('error', `checked yeelight failed,${err}`)
})




