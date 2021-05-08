import { MsgType, Protocol } from "./protocol"
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
    conns: ObjectLinkConnection[]
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
    objectConnections(name: string): ObjectLinkConnection[] {
        const resource = name.split('/')[0]
        if(this.objects[resource]) {
            return this.objects[resource].conns
        }
        return []
    }
    linkConnection(name: string, conn: ObjectLinkConnection) {
        console.log('linkConnection', name)
        if(this.objects[name]) {
            const link = this.objects[name]
            if(link.conns.indexOf(conn) === -1) {
                link.conns.push(conn)
            }
        }
    }
    unlinkConnection(name: string, conn: ObjectLinkConnection) {
        console.log('unlinkConnection', name)
        if(this.objects[name]) {
            const link = this.objects[name]
            const index = link.conns.indexOf(conn)
            if(index != -1) {
                link.conns.splice(index, 1)
            }
        }
    }
    createConnection(w: IMessageWriter): ObjectLinkConnection {
        return new ObjectLinkConnection(this, w)
    }
    notifyPropertyChange(name: string, value: any) {
        const conns = this.objectConnections(name)
        for(const conn of conns) {
            conn.sendPropertyChange(name, value)
        }
    }
    notifySignal(name: string, args: any[]) {
        const conns = this.objectConnections(name)
        for(const conn of conns) {
            conn.sendSignal(name, args)
        }
    }
}

export class ObjectLinkConnection implements IMessageHandler {
    manager: ObjectLinkRemoteRegistry
    writer: IMessageWriter
    constructor(m: ObjectLinkRemoteRegistry, w: IMessageWriter) {
        console.log('connection.constructor')
        this.manager = m
        this.writer = w
    }    
    handleMessage(msg: any): void {
        console.log('connection.handleMessage', msg)
        const msgType = msg[0]        
        switch(msgType) {
            case MsgType.LINK: {
                const [_, name ] = msg
                console.log('link', name)
                this.manager.linkConnection(name, this)
                const adapter = this.manager.objectAdapter(name)
                if(adapter) {
                    adapter.linked(name, this.manager)
                    const props = adapter.collectProperties()
                    this.sendInit(name, props)
                }
                break
            }
            case MsgType.UNLINK: {
                const [_, name] = msg
                console.log('release', name)
                this.manager.unlinkConnection(name, this)
                break
            }
            case MsgType.INVOKE: {
                console.log('handle operation invoke')
                const [_, id, name, args ] = msg
                const adapter = this.manager.objectAdapter(name)
                if(adapter) {
                    const value = adapter.invoke(name, args)
                    this.sendInvokeReply(id, name, value)
                }
                break
            }
            case MsgType.PROPERTY_CHANGE: {
                console.log('handle property change')
                const [_, name, value] = msg
                const adapter = this.manager.objectAdapter(name)
                if(adapter) {
                    adapter.setProperty(name, value)
                }
                break
            }

        }
    }
    sendInit(name: string, props: any) {
        console.log('connection.sendInit', name, props)
        const msg = Protocol.initMessage(name, props)
        this.writer.writeMessage(msg)
    }
    sendInvokeReply(id: number, name: string, value: any) {
        console.log('connection.sendInvokeReply', id, value)
        const msg = Protocol.invokeReplyMessage(id, name, value)
        this.writer.writeMessage(msg)
    }
    sendSignal(name: string, args: any[]) {
        console.log('connection.sendSignal', name, args)
        const msg = Protocol.signalMessage(name, args)
        this.writer.writeMessage(msg)
    }
    sendError(w: IMessageWriter, msgType: MsgType, id: number, error: string) {
        console.log('connection.sendError', msgType, error)
        const msg = Protocol.errorMessage(msgType, id, error)
        this.writer.writeMessage(msg)
    }
    sendPropertyChange(name: string, value: any) {
        console.log('connection.sendPropertyChange', name, value)
        const msg = Protocol.propertyChangeMessage(name, value)
        this.writer.writeMessage(msg)
    }
    broadcastPropertyChange(name: string, value: any) {
        const conns = this.manager.objectConnections(name)
        for(const conn of conns) {
            conn.sendPropertyChange(name, value)
        }
    }
    broadcastSignal(name: string, args: any[]) {
        const conns = this.manager.objectConnections(name)
        for(const conn of conns) {
            conn.sendSignal(name, args)
        }
    }
}