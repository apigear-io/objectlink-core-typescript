import { IProtocolListener } from "./listener"
import { Messages } from "./messages"
import { Protocol } from "./protocol"
import { MessageFormat, MsgType } from "./types"
import { IMessageHandler, IMessageWriter } from "./utils"

export interface IObjectRemoteAdapter {
    getObjectName(): string
    invoke(name: string, args: any[]): any
    setProperty(name: string, value: any): void
    linked(name: string, notifier: IObjectRemoteNotifier): void
    unlinked(name: string): void
    collectProperties(): any
}

export interface IObjectRemoteLink {
    adapter: IObjectRemoteAdapter 
    conns: ObjectLinkService[]
}

export interface IObjectRemoteNotifier {
    notifyPropertyChange(name: string, value: any): void
    notifySignal(name: string, args: any[]): void
}

export class ObjectLinkRemoteRegistry implements IObjectRemoteNotifier {
    objects: Record<string, IObjectRemoteLink> = {}
    addObject(adapter: IObjectRemoteAdapter) {
        const name = adapter.getObjectName()
        this.objects[name] = {adapter, conns: []}
    }
    removeObject(name: string) {
        delete this.objects[name]
    }
    objectAdapter(name: string): IObjectRemoteAdapter | undefined {
        const resource = name.split('/')[0]
        if(this.objects[resource]) {
            return this.objects[resource].adapter
        }
    }
    objectConnections(name: string): ObjectLinkService[] {
        const resource = name.split('/')[0]
        if(this.objects[resource]) {
            return this.objects[resource].conns
        }
        return []
    }
    linkConnection(name: string, conn: ObjectLinkService) {
        console.log('linkConnection', name)
        if(this.objects[name]) {
            const link = this.objects[name]
            if(link.conns.indexOf(conn) === -1) {
                link.conns.push(conn)
            }
        }
    }
    unlinkConnection(name: string, conn: ObjectLinkService) {
        console.log('unlinkConnection', name)
        if(this.objects[name]) {
            const link = this.objects[name]
            const index = link.conns.indexOf(conn)
            if(index != -1) {
                link.conns.splice(index, 1)
            }
        }
    }
    notifyPropertyChange(name: string, value: any) {
        const conns = this.objectConnections(name)
        for(const conn of conns) {
            conn.writePropertyChange(name, value)
        }
    }
    notifySignal(name: string, args: any[]) {
        const conns = this.objectConnections(name)
        for(const conn of conns) {
            conn.writeSignal(name, args)
        }
    }
}

export class ObjectLinkService implements IProtocolListener, IMessageHandler {
    registry: ObjectLinkRemoteRegistry
    protocol: Protocol
    constructor(r: ObjectLinkRemoteRegistry, w: IMessageWriter) {
        console.log('connection.constructor')
        this.registry = r
        this.protocol = new Protocol(this, w, MessageFormat.JSON)
    }    
    handleMessage(data: string): void {
        this.protocol.handleMessage(data)
    }
    handleLink(name: string) {
        this.registry.linkConnection(name, this)
        const adapter = this.registry.objectAdapter(name)
        if(adapter) {
            adapter.linked(name, this.registry)
            const props = adapter.collectProperties()
            this.writeInit(name, props)
        }
    }
    handleUnlink(name: string) {
        this.registry.unlinkConnection(name, this)
    }
    handleInvoke(id: number, name: string, args: any) {
        const adapter = this.registry.objectAdapter(name)
        if(adapter) {
            const value = adapter.invoke(name, args)
            this.writeInvokeReply(id, name, value)
        }
    }
    handleSetProperty(name: string, value: any) {
        const adapter = this.registry.objectAdapter(name)
        if(adapter) {
            adapter.setProperty(name, value)
        }
    }
    handleInit(name: string, props: any) {
        console.log('not implemented')
    }
    handleInvokeReply(id: number, name: string, value: any) {
        console.log('not implemented')
    }
    handlePropertyChange(name: string, value: any) {
        console.log('not implemented')
    }
    handleSignal(name: string, args: any) {
        console.log('not implemented')
    }
    handleError(msgType: number, id: number, error: string) {
        console.log('not implemented')
    }

    writeInit(name: string, props: any) {
        console.log('connection.writeInit', name, props)
        const msg = Messages.initMessage(name, props)
        this.write(msg)
    }
    writeInvokeReply(id: number, name: string, value: any) {
        console.log('connection.writeInvokeReply', id, value)
        const msg = Messages.invokeReplyMessage(id, name, value)
        this.write(msg)
    }
    writeSignal(name: string, args: any[]) {
        console.log('connection.writeSignal', name, args)
        const msg = Messages.signalMessage(name, args)
        this.write(msg)
    }
    writeError(w: IMessageWriter, msgType: MsgType, id: number, error: string) {
        console.log('connection.writeError', msgType, error)
        const msg = Messages.errorMessage(msgType, id, error)
        this.write(msg)
    }
    writePropertyChange(name: string, value: any) {
        console.log('connection.writePropertyChange', name, value)
        const msg = Messages.setPropertyMessage(name, value)
        this.write(msg)
    }
    write(msg: any) {
        this.protocol.writeMessage(msg)
    }
}