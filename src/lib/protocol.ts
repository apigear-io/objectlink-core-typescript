import { IClientProtocolListener, IServiceProtocolListener } from './listener';
import { MessageFormat, MsgType } from './types';
import { IMessageWriter, IMessageHandler } from './utils';

abstract class AbstractProtocol implements IMessageHandler {
    w: IMessageWriter    
    f: MessageFormat
    constructor(w: IMessageWriter, f: MessageFormat) {
        this.w = w
        this.f = f
    }

    fromString(data: string): any {
        const msg = JSON.parse(data)
        return msg
    }

    toString(msg: any): string {
        return JSON.stringify(msg)
    }

    writeMessage(msg: any) {        
        if(this.w) {
            const data = this.toString(msg)
            this.w.writeMessage(data)
        }
    }

    handleMessage(data: string) {
        const msg = this.fromString(data) as any[]
        if(!Array.isArray(msg)) {
            console.error('message must be array')
            return
        }
        this.onMessage(msg)
    }
    abstract onMessage(msg: any[]): void
}

export class ClientProtocol extends AbstractProtocol {
    l: IClientProtocolListener
    constructor(w: IMessageWriter, l: IClientProtocolListener) {
        super(w, MessageFormat.JSON)
        this.l = l
    }
    onMessage(msg: any[]): void {
        const msgType = msg[0]
        switch(msgType) {
            case MsgType.INIT: {
                console.log('handle object init')
                const [_, name, props] = msg
                this.l.handleInit(name, props)
                break
            }
            case MsgType.INVOKE_REPLY: {
                console.log('handle invoke reply')
                const [_, id, name, value] = msg
                this.l.handleInvokeReply(id, name, value)
                break
            }
            case MsgType.SIGNAL: {
                console.log('handle signal')
                const [_, name, args] = msg
                this.l.handleSignal(name, args)
                break
            }
            case MsgType.ERROR: {
                console.log('handle error')
                const [_, msgType, id, error] = msg
                this.l.handleError(msgType, id, error)
                break
            }
            case MsgType.PROPERTY_CHANGE: {
                console.log('handle property change')
                const [_, name, value] = msg
                this.l.handlePropertyChange(name, value)
                break
            }
        }
    }
}

export class ServiceProtocol extends AbstractProtocol {
    l: IServiceProtocolListener

    constructor(w: IMessageWriter, l: IServiceProtocolListener) {
        super(w, MessageFormat.JSON)
        this.l = l
    }

    onMessage(msg: any[]): void {
        console.log('004', msg)
        const msgType = msg[0]
        console.log('004.1', msgType)
        switch(msgType) {
            case MsgType.LINK: {
                const [_, name ] = msg
                console.log('link', name)
                this.l.handleLink(name)
                break
            }
            case MsgType.UNLINK: {
                const [_, name] = msg
                console.log('unlink', name)
                this.l.handleUnlink(name)
                break
            }
            case MsgType.INVOKE: {
                console.log('handle operation invoke')
                const [_, id, name, args ] = msg
                this.l.handleInvoke(id, name, args)
                break
            }
            case MsgType.SET_PROPERTY: {
                console.log('handle property change')
                const [_, name, value] = msg
                this.l.handleSetProperty(name, value)
                break
            }
        }
    }
}