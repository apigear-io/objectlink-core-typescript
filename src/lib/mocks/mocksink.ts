import { ClientNode, ClientRegistry, InvokeReplyArg, IObjectSink, Name } from "../.."

export class MockSink implements IObjectSink {
    name: string
    events: any[] = []
    node: ClientNode | null
    properties: Record<string, unknown> = {}
    constructor(name: string) {
        this.name = name
        this.node = ClientNode.addObjectSink(this)
    }
    invoke(name: string, args: any[]): void {
        this.node?.invokeRemote(name, args, (arg: InvokeReplyArg) => {
            this.events.push({ type: 'invokeReply', name: arg.name, value: arg.value})
        })
    }
    invokeAsync(name: string, args: any[]): Promise<any> {
        return new Promise((resolve, reject) => {
            // create a timeout, which rejects
            const wait = setTimeout(() => {
                reject(new Error("timeout"))
            }, 100)
            this.node?.invokeRemote(name, args, (arg: InvokeReplyArg) => {
                // on reply, clear timeout and resolve
                clearTimeout(wait)
                this.events.push({ type: 'invokeReply', name: arg.name, value: arg.value})
                resolve(arg.value)
            })
        })
    }
    olinkObjectName(): string {
        return this.name
    }
    olinkOnSignal(name: string, args: any): void {
        this.events.push({type: 'signal', name, args})
    }
    olinkOnPropertyChanged(name: string, value: any): void {
        const path = Name.pathFromName(name)
        this.events.push({ type: 'propertyChange', name, value})
        this.properties[path] = value
    }
    olinkOnInit(name: string, props: any, node: ClientNode): void {
        this.events.push({ type: 'init', name, props, node})
        this.node = node
        this.properties = props
    }
    olinkOnRelease(): void {
        this.events.push({ type: 'release'})
        this.node = null
    }
    clear() {
        this.events = []
        this.properties = {}
        this.node = null
    }
}