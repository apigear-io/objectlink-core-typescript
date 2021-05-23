import { BaseNode } from "./core/node"
import { Protocol } from "./core/protocol"
import { Base, Name } from "./core/types"

export interface IObjectSource {
    olinkObjectName(): string
    olinkInvoke(name: string, args: any): any
    olinkSetProperty(name: string, value: any): void
    olinkLinked(name: string, node: RemoteNode): void
    olinkCollectProperties(): any
}


interface SourceToNodeEntry {
    source: IObjectSource,
    nodes: Set<RemoteNode>
}

export class RemoteRegistry extends Base {
    private static instance: RemoteRegistry
    entries: Record<string, SourceToNodeEntry> = {}
    private constructor() {
        super()
    }
    static get(): RemoteRegistry {
        if(!RemoteRegistry.instance) {
            RemoteRegistry.instance = new RemoteRegistry()
        }
        return RemoteRegistry.instance
    }
    addObjectSource(source: IObjectSource): void {        
        const resource = Name.resourceFromName(source.olinkObjectName())
        console.log("RemoteRegistry.addObjectSource: " + resource)
        if(!this.entries[resource]) {
            this.entries[resource] = { source, nodes: new Set() }
        } else {
            console.log("a source already added: " + resource)
        }
    }
    removeObjectSource(source: IObjectSource): void {
        const resource = Name.resourceFromName(source.olinkObjectName())
        console.log("RemoteRegistry.removeObjectSource: " + resource)
        if(this.entries[resource]) {
            delete this.entries[resource]
        } else {
            console.log("remove object source failed, no source exists: " + resource)
        }
    }
    getObjectSource(name: string): IObjectSource | null {
        const resource = Name.resourceFromName(name)
        if(this.entries[resource]) {
            const source = this.entries[resource].source
            if(!source) {
                console.log("no source at: " + resource)
            }
            return source
        } else {
            console.log("no source registered: " + resource)
        }
        return null
    }
    getRemoteNodes(name: string): Set<RemoteNode> {
        const resource = Name.resourceFromName(name)
        if(this.entries[resource]) {
            const nodes = this.entries[resource].nodes
            return nodes
        } else {
            console.log("no source registered: " + resource)
        }
        return new Set<RemoteNode>()
    }
    attachRemoteNode(node: RemoteNode): void {
        console.log("RemoteRegistry.attachRemoteNode")
    }
    detachRemoteNode(node: RemoteNode): void {
        console.log("RemoteRegistry.detachRemoteNode")
        for(const entry of Object.values(this.entries)) {
            if(entry.nodes.has(node)) {
                entry.nodes.delete(node)
            }
        }
    }
    linkRemoteNode(name: string, node: RemoteNode): void {
        const resource = Name.resourceFromName(name)
        console.log("RemoteRegistry.linkRemoteNode: " + name)
        if(this.entries[resource]) {
            this.entries[resource].nodes.add(node)
        } else {
            console.log("no source registered: " + resource)
        }
    }
    unlinkRemoteNode(name: string, node: RemoteNode): void {
        const resource = Name.resourceFromName(name)
        console.log("RemoteRegistry.linkRemoteNode: " + name)
        if(this.entries[resource]) {
            this.entries[resource].nodes.delete(node)
        } else {
            console.log("no source registered: " + resource)
        }
    }

}

export class RemoteNode extends BaseNode {
    constructor() {
        super()
        RemoteRegistry.get().attachRemoteNode(this)
    }
    detach() {
        RemoteRegistry.get().detachRemoteNode(this)
    }
    registry(): RemoteRegistry {
        return RemoteRegistry.get()
    }
    getObjectSource(name: string) {
        console.log("RemoteNode.getObjectSource: " + name)
        return this.registry().getObjectSource(name)
    }
    static addObjectSource(source: IObjectSource): void {
        console.log("RemoteNode.addObjectSource: " + source.olinkObjectName())        
        return RemoteRegistry.get().addObjectSource(source)
    }
    static removeObjectSource(source: IObjectSource): void {
        console.log("RemoteNode.removeObjectSource")
        return RemoteRegistry.get().removeObjectSource(source)
    }
    handleLink(name: string) {
        console.log("RemoteNode.handleLink: " + name)
        const source = this.getObjectSource(name)
        if(source) {
            this.registry().linkRemoteNode(name, this)
            source.olinkLinked(name, this)
            const props = source.olinkCollectProperties()
            this.emitWrite(Protocol.initMessage(name, props))
        } else {
            console.log("no source registered for " + name)
        }
    }
    handleUnlink(name: string) {
        console.log("RemoteNode.handleUnlink: " + name)
        const source = this.getObjectSource(name)
        if(source) {
            this.registry().unlinkRemoteNode(name, this)
        } else {
            console.log("no source registered for: " + name)
        }
    }
    handleSetProperty(name: string, value: any) {
        console.log("RemoteNode.handleSetProperty: " + name)
        const source = this.getObjectSource(name)
        if(source) {
            source.olinkSetProperty(name, value)
        } else {
            console.log("no source registered for: " + name)
        }
    }
    handleInvoke(id: number, name: string, args: any) {
        console.log("RemoteNode.handleInvoke: " + id + " : " + name)
        const source = this.getObjectSource(name)
        if(source) {
            const value = source.olinkInvoke(name, args)
            this.emitWrite(Protocol.invokeReplyMessage(id, name, value))
        } else {
            console.log("no source registered for: " + name)
        }
    }
    notifyPropertyChange(name: string, value: any) {
        for(const node of this.registry().getRemoteNodes(name)) {
            node.emitWrite(Protocol.propertyChangeMessage(name, value))
        }
    }
    notifySignal(name: string, args: any) {
        for(const node of this.registry().getRemoteNodes(name)) {
            node.emitWrite(Protocol.signalMessage(name, args))
        }
    }
}