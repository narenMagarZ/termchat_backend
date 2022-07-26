import {WebSocketServer} from 'ws'
import http from 'node:http'
import dotenv from 'dotenv'
import {parse} from 'node:url'
dotenv.config()

let clients = {}
const log = console.log
const httpServer = http.createServer((req,res)=>{
    const parsedUrl = parse(req.url as string,true)
    const {id} = parsedUrl.query
    let isUidInUser = clients[id as string] ? 'true' : 'false'
    res.end(isUidInUser)
    }).listen(process.env.PORT as string,()=>{
    log('serveer is running on port',process.env.PORT)
    })

const webSocketServer = new WebSocketServer({
    'noServer' : true
})
httpServer.on('upgrade',(req,socket,head)=>{
    webSocketServer.handleUpgrade(req,socket,head,(ws)=>{
        webSocketServer.emit('connection',ws,req)
    })
})


webSocketServer.on('connection',(socket,req)=>{
    const user = req.url?.slice(1) as string
    clients[user] = socket
    clients[user].on('message',(rawMsg)=>{
        let msg = JSON.parse(rawMsg.toString())
        // console.log(msg)
        if(msg.type === 'cmd'){
            switch(msg.cmd) {
                case "ls" :
                    const allUser = JSON.stringify(Object.keys(clients))
                    socket.send(allUser)
                    break;
                case "send":
                    console.log(msg.name[0])
                    clients[msg.to].send(`hi this is me from ${msg.name[0]}`)
                    break;
                default :
                    break
            } 
        } else if(msg.type === 'msg'){
            socket.send('response from the server')
        }
    })
    clients[user].on('close',(code)=>{
        clients[user].close(code)
        delete clients[user]
    })
    
})