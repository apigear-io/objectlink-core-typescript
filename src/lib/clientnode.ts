import { BaseNode } from './core/node';
import { Protocol } from "./core/protocol";
import { Base, LogLevel, Name } from './core/types';

export interface InvokeReplyArg {
    name: string
    value: any
}

export type InvokeReplyFunc = (arg: InvokeReplyArg) => void

export interface IObjectSink {
    olinkObjectName(): string;
    olinkOnSignal(name: string, args: any): void
    olinkOnPropertyChanged(name: string, value: any): void
    olinkOnInit(name: string, props: any, node: ClientNode): void
    olinkOnRelease(): void
}

interface SinkToClientEntry {
    sink: IObjectSink | null
    node: ClientNode | null
}

export class ClientRegistry extends Base {
    entries: Record<string, SinkToClientEntry> = {};
    private static instance: ClientRegistry;
    private constructor() {
        super()
    }

    static get(): ClientRegistry {
        if(!ClientRegistry.instance) {
            ClientRegistry.instance = new ClientRegistry()
        }
        return ClientRegistry.instance
    }
    attachClientNode(node: ClientNode) {
        console.log('client.attachClientNode')
        // nothing
    }
    detachClientNode(node: ClientNode) {
        console.log('client.detachClientNode')
        for(const entry of Object.values(this.entries)) {
            if(entry.node === node) {
                entry.node = null
            }
        }
    }
    linkClientNode(name: string, node: ClientNode) {
        this.entry(name).node = node
    }
    unlinkClientNode(name: string, node: ClientNode) {
        this.entry(name).node = null
    }
    addObjectSink(sink: IObjectSink): ClientNode | null {
        const name = sink.olinkObjectName()
        const e = this.entry(name)
        e.sink = sink
        return e.node
    }
    removeObjectSink(sink: IObjectSink) {
        const name = sink.olinkObjectName()
        this.removeEntry(name)
    }
    getObjectSink(name: string): IObjectSink | null {
        return this.entry(name).sink
    }
    getClientNode(name: string): ClientNode | null {
        return this.entry(name).node
    }
    entry(name: string): SinkToClientEntry {
        const resource = Name.resourceFromName(name)
        if(!this.entries[resource]) {
            this.entries[resource] = { node: null, sink: null }
        }
        return this.entries[resource]
    }
    removeEntry(name: string): void {
        const resource = Name.resourceFromName(name)
        if(this.entries[resource]) {
            delete this.entries[resource]
        }

    }
}

export class ClientNode extends BaseNode {
    invokesPending: Record<number, InvokeReplyFunc> = {}
    requestId = 0
    constructor() {
        super()
        this.registry().attachClientNode(this)
    }
    detach() {
        this.registry().detachClientNode(this)
    }

    nextRequestId() {
        this.requestId++
        return this.requestId
    }
    invokeRemote(name: string, args: any, func: InvokeReplyFunc|null) {
        console.log("ClientNode.invokeRemote: ", name, args)
        const requestId = this.nextRequestId()        
        if(func) {
            this.invokesPending[requestId] = func
        }
        this.emitWrite(Protocol.invokeMessage(requestId, name, args))
    }
    setRemoteProperty(name: string, value: any) {
        console.log("ClientNode.setRemoteProperty: ", name)
        this.emitWrite(Protocol.setPropertyMessage(name, value))
    }
    registry(): ClientRegistry {
        return ClientRegistry.get()
    }
    linkNode(name: string) {
        ClientRegistry.get().linkClientNode(name, this)
    }
    unlinkNode(name: string) {
        ClientRegistry.get().unlinkClientNode(name, this)
    }
    static addObjectSink(sink: IObjectSink): ClientNode | null {
        console.log("ClientNode.addObjectSink")
        return ClientRegistry.get().addObjectSink(sink)
    }
    static removeObjectSink(sink: IObjectSink): void {
        console.log("ClientNode.removeObjectSink")
        return ClientRegistry.get().removeObjectSink(sink)
    }    
    getObjectSink(name: string): IObjectSink | null {
        return this.registry().getObjectSink(name)
    }
    linkRemote(name: string): void {
        console.log("ClientNode.linkRemote: " + name)
        this.registry().linkClientNode(name, this)
        this.emitWrite(Protocol.linkMessage(name))
    }
    unlinkRemote(name: string) {
        console.log("ClientNode.unlinkRemote: " + name)
        this.emitWrite(Protocol.unlinkMessage(name))
        this.registry().unlinkClientNode(name, this)
    }
    handleInit(name: string, props: any): void {
        console.log("ClientNode.handleInit: " + name)
        const sink = this.getObjectSink(name)
        if(sink) {
            sink.olinkOnInit(name, props, this)
        }
    }
    handlePropertyChange(name: string, value: any) {
        console.log("ClientNode.handlePropertyChange: " + name)
        const sink = this.getObjectSink(name)
        if(sink) {
            sink.olinkOnPropertyChanged(name, value)
        }
    }
    handleInvokeReply(id: number, name: string, value: any) {
        console.log("ClientNode.handleInvokeReply", id, name, value)
        if(this.invokesPending[id]) {
            const func = this.invokesPending[id]
            if(func) {
                func({name, value})
            }
            delete this.invokesPending[id]
        } else {
            console.log("no pending invoke: " + id + " " + name)
        }
    }
    handleSignal(name: string, args: any) {
        this.emitLog(LogLevel.Info, "ClientNode.handleSignal: " + name)
        const sink = this.getObjectSink(name)
        if(sink) {
            sink.olinkOnSignal(name, args)
        }
    }
    handleError(msgType: number, id: number, error: string) {
        console.log("ClientNode.handleError: " + arguments)
    }
}