import { IMessageWriter } from "../.."
import WebSocket from 'ws'

export class WebSocketWriter implements IMessageWriter {
    ws: WebSocket
    constructor(ws: WebSocket) {
        this.ws = ws
    }
    writeMessage(msg: any) {
        const data = JSON.stringify(msg)
        this.ws.send(data)
    }
}