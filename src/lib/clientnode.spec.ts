import { ClientNode, ClientRegistry, IObjectSink, RemoteNode } from ".."
import { Protocol } from "./core/protocol"


class MockSink implements IObjectSink {
    events: any[] = []
    name: string
    constructor(name: string) {
        this.name = name
    }
    olinkObjectName(): string {
        return this.name
    }
    olinkOnSignal(name: string, args: any): void {
        this.events.push(Protocol.signalMessage(name, args))
    }
    olinkOnPropertyChanged(name: string, value: any): void {
        this.events.push(Protocol.propertyChangeMessage(name, value))
    }
    olinkOnInit(name: string, props: any, node: ClientNode): void {
        this.events.push(Protocol.initMessage(name, props))
    }
    olinkOnRelease(): void {
    }
}

const name = 'demo.Counter'
const sink = new MockSink(name)
const client = new ClientNode()
const r = ClientRegistry.get()


test('add sink', () => {
    // registry sink to be null
    ClientNode.addObjectSink(sink)
    expect(r.getObjectSink(name)).toBe(sink)
    expect(r.getClientNode(name)).toBeNull()
})

test('remove sink', () => {
    ClientNode.removeObjectSink(sink)
    expect(r.getObjectSink(name)).toBeNull()
})

test('link node to sink', () => {
    expect(r.getClientNode(name)).toBeNull()
    client.linkRemote(name)
    expect(r.getClientNode(name)).toBe(client)
})

test('unlink node from sink', () => {
    expect(r.getClientNode(name)).toBe(client)
    client.unlinkRemote(name)
    expect(r.getClientNode(name)).toBeNull()
})


test('detach node from all sinks', () => {
    client.linkRemote(name)
    expect(r.getClientNode(name)).toBe(client)
    client.detach()
    expect(r.getClientNode(name)).toBeNull()
})

