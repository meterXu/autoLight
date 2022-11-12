const config = require('../config/config')
const y = require("yeelight-awesome");
const yl = new y.Yeelight({...config.yeelight})


function discover(){
    const discover = new y.Discover({
        port: 1982,
        debug: true
    });

    discover.once("deviceAdded", (device) => {
        const yeelight = new y.Yeelight({
            lightIp: device.host,
            lightPort: device.port
        });

        yeelight.on("connected", async () => {
            yeelight.setRGB(new y.Color(123, 99, 65), "smooth", 5000).then(res=>{
                debugger
            }).catch(err=>{
                debugger
            })
        });
        yeelight.connect();
    });

    discover.start();
}



async function turnOn(){
    const discover = new y.Discover({
        port: 1982,
        debug: true
    });
    discover.once("deviceAdded", (device) => {
        const yeelight = new y.Yeelight({
            lightIp: device.host,
            lightPort: device.port
        });
        yeelight.on("connected", async () => {
            const pro = await yeelight.getProperty([y.DevicePropery.BRIGHT, y.DevicePropery.POWER])
            console.log(pro)
        });
        yeelight.connect();
    })
    discover.start();
}

turnOn()