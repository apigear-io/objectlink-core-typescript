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
const client2 = new ClientNode()
const r = ClientRegistry.get()

test('empty registry', () => {
    // registry sink to be null
    expect(r.getObjectSink(name)).toBeNull()
    expect(r.getClientNode(name)).toBeNull()
})

test('add object sink', () => {
    ClientNode.addObjectSink(sink)
    expect(r.getObjectSink(name)).toEqual(sink)
})


test('remove object sink', () => {
    r.removeObjectSink(sink)
    expect(r.getObjectSink(name)).toBeNull()
})

test('link node to sink', () => {
    client.linkNode(name)
    expect(r.getClientNode(name)).toEqual(client)
})

test('unlink node from sink', () => {
    client.unlinkNode(name)
    expect(r.getClientNode(name)).toBeNull()
})

test('detach node from sink', () => {
    client.detach()
    expect(r.getClientNode(name)).toBeNull()
})

test('link 2nd client to object', () => {
    client.linkNode(name)
    expect(r.getClientNode(name)).toBe(client)
    client2.linkNode(name)
    // you can not re-link a client
    expect(r.getClientNode(name)).toEqual(client)
    // unlink client
    client.unlinkNode(name)
    expect(r.getClientNode(name)).toBeNull()
    // relink with client2
    client2.linkNode(name)
    expect(r.getClientNode(name)).toEqual(client2)
})




