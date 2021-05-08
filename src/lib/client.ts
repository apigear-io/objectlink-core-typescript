import { MsgType, Protocol } from "./protocol"
import { IMessageHandler, IMessageWriter } from "./utils"

export interface IObjectClientHandler {
    onSignal(name: string, value: any): void
    onPropertyChanged(name: string, value: any): void
    onInit(name: string, props: any): void
}

export interface IRemoteResult {
    name: string
    value: any
    // error: string todo
}

export type ReplyHandler = (result:IRemoteResult) => void

export class ObjectLinkClient implements IMessageHandler {
    requestId = 0
    writer: IMessageWriter
    replyHandler: Record<number, ReplyHandler> = {}
    objects: Record<string, IObjectClientHandler> = {}
    constructor(writer: IMessageWriter) {
        console.log('client.constructor')
        this.writer = writer
    }
    addObject(name: string, handler: IObjectClientHandler) {
        this.objects[name] = handler
        this.sendLink(name)
    }
    objectHandler(name: string): IObjectClientHandler {
        console.log('object handler', name)
        const [identifier, path] = name.split('/')
        console.log('object handler', name, identifier, path)
        return this.objects[identifier]
    }
    /**
     * increments and returns the request id
     * @returns next id
     */
    nextId() {
        console.log('client.nextId')
        this.requestId++
        return this.requestId
    }
    /**
     * links the remote object
     * @param name object name as `${module}.${interface}`
     */
    sendLink(name: string): void {
        console.log('client.sendLink', name)
        const msg = Protocol.linkMessage(name)
        this.send(msg)
    }
    /**
     * releases resources from remote object
     * @param name name object name as `${module}.${interface}`
     */
    sendRelease(name: string) {
        console.log('client.sendRelease', name)
        const msg = Protocol.unlinkMessage(name)
        this.send(msg)
    }
    /**
     * async invokes remote operation and returns result
     * @param name operation name as `${module}.${interface}/${operation}`
     * @param args array of operation arguments
     * @returns remote result
     */
    async sendInvoke(name: string, args: any[]) : Promise<IRemoteResult> {
        console.log('client.sendInvoke', name, args)
        const id = this.nextId()
        const msg = Protocol.invokeMessage(id, name, args)
        this.send(msg)
        return this.waitForReply(id)
    }
    handleMessage(msg: any) {
        if(Array.isArray(msg)) {
            this.onMessage(msg)
        }
    }
    /**
     * handles incoming ipc messages
     * @param msg ipc message
     */
    onMessage(msg: any[]) {
        console.log('client.onMessage', msg)
        const msgType = msg[0]
        switch(msgType) {
            case MsgType.INIT: {
                console.log('handle object init')
                const [_, name, value] = msg
                const handler = this.objectHandler(name)
                if(handler) {
                    handler.onInit(name, value)
                }
                break
            }
            case MsgType.INVOKE_REPLY: {
                console.log('handle invoke reply')
                const [_, id, name, value] = msg
                this.handleReply(id, name, value)
                break
            }
            case MsgType.SIGNAL: {
                console.log('handle signal')
                const [_, name, args] = msg
                const handler = this.objectHandler(name)
                if(handler) {
                    handler.onSignal(name, args)
                }
                break
            }
            case MsgType.PROPERTY_CHANGE: {
                console.log('handle property change')
                const [_, name, value] = msg
                const handler = this.objectHandler(name)
                if(handler) {
                    handler.onPropertyChanged(name, value)
                }
                break
            }
            case MsgType.ERROR: {
                console.log('handle error')
                break
            }
        }
    }
    send(msg: any[]) {
        console.log('send', msg)
        this.writer.writeMessage(msg)
    }
    async waitForReply(id: number): Promise<IRemoteResult> {
        console.log('client.waitForReply', id)
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                console.log('wait.timeout')
                delete this.replyHandler[id]
                reject("timeout")
            }, 5000)
            this.replyHandler[id] = (reply) => {
                delete this.replyHandler[id]
                clearTimeout(timeout)
                resolve(reply)
            }
        })
    }
    handleReply(id: number, name: string, value: any) {
        console.log('client.handleReply', id, name, value)
        if(this.replyHandler[id]) {
            // call handler
            const fn = this.replyHandler[id]
            fn({ name, value})
            delete this.replyHandler[id]
        }
    }
}