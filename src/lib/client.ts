import { IProtocolListener } from "./listener"
import { Messages } from "./messages"
import { Protocol } from "./protocol"
import { MessageFormat } from "./types"
import { IMessageHandler, IMessageWriter } from "./utils"

export interface IClientObjectHandler {
    onSignal(name: string, args: any): void
    onPropertyChanged(name: string, value: any): void
    onInit(name: string, props: any): void
}

export interface IRemoteResult {
    name: string
    value: any
    // error: string todo
}

export type ReplyHandler = (result:IRemoteResult) => void

class ClientObjectRegistry  {
    objects: Record<string, IClientObjectHandler> = {}
    addObject(name: string, handler: IClientObjectHandler) {
        this.objects[name] = handler
    }
    removeObject(name: string) {
        delete this.objects[name]
    }
    objectHandler(name: string): IClientObjectHandler {
        console.log('object handler', name)
        const [identifier, path] = name.split('/')
        console.log('object handler', name, identifier, path)
        return this.objects[identifier]
    }
}

export class ObjectLinkClient implements IProtocolListener, IMessageHandler {
    requestId = 0
    replyHandler: Record<number, ReplyHandler> = {}
    registry: ClientObjectRegistry
    protocol: Protocol
    constructor(writer: IMessageWriter) {
        console.log('client.constructor')
        this.registry = new ClientObjectRegistry()
        this.protocol = new Protocol(this, writer, MessageFormat.JSON)
    }
    addObject(name: string, handler: IClientObjectHandler) {
        this.registry.addObject(name, handler)
        this.writeLink(name)
    }
    objectHandler(name: string): IClientObjectHandler {
        return this.registry.objectHandler(name)
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
    writeLink(name: string): void {
        console.log('client.writeLink', name)
        const msg = Messages.linkMessage(name)
        this.write(msg)
    }
    /**
     * releases resources from remote object
     * @param name name object name as `${module}.${interface}`
     */
    writeRelease(name: string) {
        console.log('client.writeRelease', name)
        const msg = Messages.unlinkMessage(name)
        this.write(msg)
    }
    /**
     * async invokes remote operation and returns result
     * @param name operation name as `${module}.${interface}/${operation}`
     * @param args array of operation arguments
     * @returns remote result
     */
    async invoke(name: string, args: any[]) : Promise<IRemoteResult> {
        console.log('client.sendInvoke', name, args)
        const id = this.nextId()
        const msg = Messages.invokeMessage(id, name, args)
        this.write(msg)
        return this.waitForReply(id)
    }
    handleMessage(data: string) {
        this.protocol.handleMessage(data)
    }
    handleInit(name: string, props: any) {
        const handler = this.objectHandler(name)
        if(handler) {
            handler.onInit(name, props)
        }
    }
    handleInvokeReply(id: number, name: string, value: any) {
        if(this.replyHandler[id]) {
            // call handler
            const fn = this.replyHandler[id]
            fn({ name, value})
            delete this.replyHandler[id]
        }
    }
    handleSignal(name: string, args: any[]) {
        const handler = this.objectHandler(name)
        if(handler) {
            handler.onSignal(name, args)
        }
    }
    handlePropertyChange(name: string, value: any) {
        const handler = this.objectHandler(name)
        if(handler) {
            handler.onPropertyChanged(name, value)
        }
    }
    handleError(msgType: number, id: number, error: string) {
        console.log('handle error', msgType, id, error)
    }
    handleLink(name: string) {
        console.error('not implemented')
    }
    handleUnlink(name: string) {
        console.error('not implemented')
    }
    handleInvoke(id: number, name: string, args: any) {
        console.error('not implemented')
    }
    handleSetProperty(name: string, value: any) {
        console.error('not implemented')
    }
    write(msg: any) {
        this.protocol?.writeMessage(msg)
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
}