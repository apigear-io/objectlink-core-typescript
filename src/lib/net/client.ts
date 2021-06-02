import { EventEmitter } from "eventemitter3"
import WebSocket from 'ws'
import { ClientNode } from "../clientnode"

interface IWebSocket extends WebSocket {
}

interface IClientOptions {
    reconnect: boolean,
    reconnectInterval: number,
    maxReconnectRetries: number
}

export function createClientOptions() {
    return {
        reconnect: true,
        reconnectInterval: 3000, // ms
        maxReconnectRetries: 5,
    }
}

export class Client extends EventEmitter {
    ws: WebSocket | null
    address: string | undefined
    options: IClientOptions
    isReady = false
    currentRetries = 0
    node: ClientNode
    queue: string[] = []

    constructor(node: ClientNode, options: IClientOptions) {
        super()
        this.ws = null
        this.options = options
        this.node = node
        this.node.onWrite((msg: string) => {
            this.enqueueMsg(msg)
        })
    }    
    open(address: string): void {
        this.address = address
        this._open(address, this.options)
    }

    close(code: number, data?: string): void {
        console.log("Client.close: ", code)
        this.ws?.close(code || 1000, data)
    }

    _open(address: string, options: IClientOptions): void {
        console.log("Client.open: ", address)
        this.ws = new WebSocket(address)
        this.ws.on('open', (ws: WebSocket) => {
            console.log("Client.ws.onOpen")            
            this.isReady = true
            this.currentRetries = 0
            this.process()
            this.emit('open', ws)            
        })
        this.ws.on('message', (data: WebSocket.Data) => {
            console.log("Client.ws.onMessage", data.toString())            
            this.emit('message', data)
            const msg = data.toString()
            this.node.handleMessage(msg)
        })
        this.ws.on('close', (code: number, reason: string) => {
            console.log("Client.ws.onClose", code)            
            this.emit('close', code, reason)
            if (this.isReady) { // delay close signal
                setTimeout(() => {
                    this.emit("close", code, reason)
                }, 0)
            }
            this.queue = []
            this.isReady = false
            this.ws = null
            if(code === 1000) { // normal close
                return
            }
            if(this.options.reconnect) {
                this.currentRetries++
                if(this.currentRetries < this.options.maxReconnectRetries) {
                    setTimeout(() => this._open(address, options), this.options.reconnectInterval)
                }
            }
        })
        this.ws.on('error', (err: Error) => {
            console.log("Client.ws.onError", err)            
            this.emit("error", err)
            this.isReady = false
            this.ws = null
        })
    }    
    enqueueMsg(msg: string) {
        console.log("Client.enqueueMsg", msg)
        this.queue.push(msg)
        this.process()

    }
    process() {
        console.log('Client.process', this.isReady)
        if(!this.isReady) {
            return
        }
        while(this.queue.length > 0) {
            const msg = this.queue.shift()
            console.log('Client.send:', msg)
            this.ws?.send(msg)
        }
    }


        

}