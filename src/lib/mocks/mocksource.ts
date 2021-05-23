import { IObjectSource, Name } from "../..";
import { RemoteNode, RemoteRegistry } from "../remotenode";

export class MockSource implements IObjectSource {
    name: string
    events: any[] = []
    properties: Record<string, unknown> = {}
    node: RemoteNode | null = null
    constructor(name: string) {
        this.name = name
        RemoteNode.addObjectSource(this)
    }

    clear() {
        this.events = []
        this.properties = {}
        this.node = null
    }

    setProperty(name: string, value: any) {
        this.node?.notifyPropertyChange(name, value)
    }

    notifySignal(name: string, args: any[]) {
        this.node?.notifySignal(name, args)
    }

    olinkObjectName(): string {
        return this.name
    }
    olinkInvoke(name: string, args: any): any {
        this.events.push({ type: "invoke", name, args })
        return name
    }
    olinkSetProperty(name: string, value: any): void {
        const path = Name.pathFromName(name)
        this.events.push({ type: 'setProperty', name, value })
        if(this.properties[path] !== value) {
            this.properties[name] = value
            this.node?.notifyPropertyChange(name, value)
        }
    }
    olinkLinked(name: string, node: RemoteNode): void {
        this.events.push({ type: 'link', name, node})
        this.node = node
    }
    olinkCollectProperties() {
        this.events.push({ type: 'collectProperties'})
        return this.properties
    }
    
}