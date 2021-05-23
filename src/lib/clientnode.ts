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
        const resource = Name.resourceFromName(name)
        this.initEntry(name)
        if(!this.entries[resource].node) {
            this.entries[resource].node = node
        } else {
            console.log("link node failed: sink has already a node: ", resource)
        }
    }
    unlinkClientNode(name: string, node: ClientNode) {
        const resource = Name.resourceFromName(name)
        if(this.hasEntry(resource)) {
            if(this.entries[resource].node === node) {
                this.entries[resource].node = null
            } else {
                console.log("unlink node failed, not the same node")
            }
        }
    }
    addObjectSink(sink: IObjectSink): ClientNode | null {
        const resource = Name.resourceFromName(sink.olinkObjectName())
        this.initEntry(resource)
        console.log("link sink: ", resource)
        if(!this.entries[resource].sink) {
            this.entries[resource].sink = sink
        } else {
            console.log("add object sink failed: sink already added: ", resource);
        }
        return this.entries[resource].node
    }
    removeObjectSink(sink: IObjectSink) {
        const resource = Name.resourceFromName(sink.olinkObjectName())
        if(this.entries[resource].sink) {
            delete this.entries[resource]
        } else {
            console.log("remove object sink failed: no sink to remove", resource)
        }
    }
    getObjectSink(name: string): IObjectSink | null {
        const resource = Name.resourceFromName(name)
        if(this.entries[resource]) {
            const sink = this.entries[resource].sink
            if(!sink) {
                console.log("no sink attached: ", resource)
            }
            return sink
        } else {
            console.log("no resource: ", resource)
        }
        return null
    }
    getClientNode(name: string): ClientNode | null {
        const resource = Name.resourceFromName(name)
        if(this.entries[resource]) {
            const node = this.entries[resource].node
            if(!node) {
                console.log("no node attached: ", resource)
            }
            return node
        } else {
            console.log("no resource: ", resource)
        }
        return null
    }
    entry(name: string): SinkToClientEntry {
        const resource = Name.resourceFromName(name)
        return this.entries[resource]
    }
    hasEntry(name: string): boolean {
        const resource = Name.resourceFromName(name)
        return this.entries[resource] !== undefined
    }
    initEntry(name: string) {
        const resource = Name.resourceFromName(name)
        if(!this.entries[resource]) {
            this.entries[resource] = { node: null, sink: null }
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