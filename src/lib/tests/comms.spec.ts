import { ClientNode, IObjectSink, RemoteNode } from "../.."
import { MockSink } from "../mocks/mocksink"
import { MockSource } from "../mocks/mocksource"

const name = 'demo.Calc'
const propName = 'demo.Calc/count'
const propValue = 1
const invokeName = 'demo.Calc/add'
const invokeArgs = [1]
const sigName = 'demo.Calc/down'
const sigArgs = [5]
const client = new ClientNode()
const remote = new RemoteNode()
client.onWrite((msg: string) => {
    console.log('client -> ', msg)
    remote.handleMessage(msg)
})
remote.onWrite((msg: string) => {
    console.log('<- remote ', msg)
    client.handleMessage(msg)
})
const sink = new MockSink(name)
const source = new MockSource(name)


function reset() {
    sink.clear()
    source.clear()
}
test('client.link', () => {
    client.detach()
    expect(client.registry().getClientNode(name)).toBeNull()
    client.linkRemote(name)
    expect(client.registry().getClientNode(name)).toBe(client)
    expect(sink.events).toHaveLength(1)
    expect(sink.events[0]).toEqual(expect.objectContaining({type: 'init', name }))
})

test('client.setProperty', () => {
    reset()
    client.linkRemote(name)
    expect(sink.events).toHaveLength(1)
    client.setRemoteProperty(propName, propValue)
    expect(sink.events).toHaveLength(2)
    expect(sink.events[1]).toEqual(expect.objectContaining({type: 'propertyChange', name: propName }))
})

test('client.invoke', () => {
    reset()
    client.linkRemote(name)
    expect(sink.events).toHaveLength(1)
    sink.invoke(invokeName, invokeArgs)
    expect(sink.events).toHaveLength(2)
    expect(sink.events[1]).toEqual(expect.objectContaining({type: 'invokeReply', name: invokeName }))
})


test('remote.signal', () => {
    reset()
    client.linkRemote(name)
    expect(sink.events).toHaveLength(1)
    source.notifySignal(sigName, sigArgs)
    expect(sink.events).toHaveLength(2)
    expect(sink.events[1]).toEqual(expect.objectContaining({type: 'signal', name: sigName }))
})

test('remote.setProperty', () => {
    reset()
    client.linkRemote(name)
    expect(sink.events).toHaveLength(1)
    source.setProperty(propName, propValue)
    expect(sink.events).toHaveLength(2)
    expect(sink.events[1]).toEqual(expect.objectContaining({type: 'propertyChange', name: propName }))
})