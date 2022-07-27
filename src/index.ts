import {WebSocketServer} from 'ws'
import http from 'node:http'
import dotenv from 'dotenv'
import {parse} from 'node:url'
dotenv.config()

let clients = {}
const log = console.log
const httpServer = http.createServer((req,res)=>{
    if(req.url === '/test'){
        return res.end("done ")
    } else {

        const parsedUrl = parse(req.url as string,true)
        const {id} = parsedUrl.query
        let isUidInUser = clients[id as string] ? 'true' : 'false'
        res.end(isUidInUser)
    }

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
        console.log(rawMsg.toString())
        let clientMsg = JSON.parse(rawMsg.toString())
        if(clientMsg.type === 'cmd'){
            const {msg} = clientMsg
            if(msg === 'ls'){
                const msgToClient = {
                    'type' : 'cmd',
                    'msg' : JSON.stringify(Object.keys(clients))
                }
                clients[user].send(JSON.stringify(msgToClient))
            }
        } else if(clientMsg.type === 'msg'){
            const {msg,uid,to} = clientMsg
            const msgToClient = {
                'type' : 'msg',
                'msg' : msg,
                'from' : uid,
                'to' : to,
            }
            if(clients[to]){
                clients[to].send(JSON.stringify(msgToClient))
            }
        } else {

        }
    })
    clients[user].on('close',(code)=>{
        clients[user].close(code)
        delete clients[user]
    })
    
})