import { IMessageWriter } from ".."
import WebSocket from 'ws'

export class WebSocketWriter implements IMessageWriter {
    ws: WebSocket
    constructor(ws: WebSocket) {
        this.ws = ws
    }
    writeMessage(data: string) {
        this.ws.send(data)
    }
}