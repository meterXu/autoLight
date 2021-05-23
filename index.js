const ping = require('ping')
const config = require('./config/config')

checkOnLine().then(xx=>{
    console.log(xx)
})



async function checkOnLine(){
    for (let host of  config.watchIP){
        const res =await ping.promise.probe(host,{timeout:10})
        if(res.alive){
            return Promise.resolve(true)
        }
    }
    return Promise.resolve(false)
}