import { EventEmitter } from "eventemitter3"
import WebSocket from 'ws'
import { IncomingMessage} from 'http'
import { RemoteNode } from "../remotenode"

interface IWebSocket extends WebSocket {

}

export class Server extends EventEmitter {
    wss: WebSocket.Server | null
    constructor() {
        super()
        this.wss = null
    }

    listen(options: WebSocket.ServerOptions) {
        this._start(options)
        console.log('server listening on', this.wss?.address)
    }

    _start(options: WebSocket.ServerOptions) {
        this.wss = new WebSocket.Server(options)
        this.wss.on('listening', () => {
            console.log('Server.wss.listening')
            this.emit('listening')
        })
        this.wss.on('connection', (ws: IWebSocket, request: IncomingMessage) => {
            console.log('Server.wss.connection')
            const remote = new RemoteNode()
            remote.onWrite((msg: string) => {
                ws.send(msg)
            })        
            ws.on('error', (err: any) => {
                console.log('Server.ws.error', err)
            })
            ws.on('message', (data: WebSocket.Data) =>  {
                remote.handleMessage(data.toString())
            });                
            ws.on('close', (code: number, reason: string) => {                                
                console.log('Server.ws.close',code, reason)
            })
            this.emit("connection", ws, request)
        });     
        this.wss.on('error', (error: Error) =>  {
            console.log('Server.wss.error',error)
            this.emit("error", error)        
        })
    }
}