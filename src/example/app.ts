import WebSocket from 'ws'
import { ClientNode, ClientRegistry, IObjectSink, Name, RemoteRegistry } from '..';


class Counter implements IObjectSink {
    count = 0
    client: ClientNode | null    
    constructor() {
        this.client = ClientNode.addObjectSink(this)
    }
    async increment() {
        console.log('counter.increment', this.client)
        this.client?.invokeRemote('demo.Counter/increment', [], null)
    }

    olinkObjectName(): string {
        return 'demo.Counter'
    }
    olinkOnSignal(name: string, value: any): void {
        const path = Name.pathFromName(name)
        console.log('Counter.onSignal', path, value)

    }
    olinkOnPropertyChanged(name: string, value: any): void {
        console.log('olinkOnPropertyChanged', name, value)
        const [ _, path ] = name.split('/')
        console.log('Counter.onPropertyChanged', path, value)
    }
    olinkOnInit(name: string, props: any): void {
        console.log('Counter.onInit', name, props)
        this.applyProperties(props)
    }
    olinkOnRelease(): void {
        console.log('release sink')
    }

    applyProperties(props: any): void {
        console.log('Counter.applyProperties', props)
    }
}

const client = new ClientNode()
// link node to sink
// ensure addObjectSink returns a node
client.linkNode('demo.Counter')
const counter = new Counter()

function start() {
    const ws = new WebSocket('ws://127.0.0.1:8282', {});
    client.onWrite((msg: string) => {
        ws.send(msg)
    })
    ws.on('open',async  () => {
        client.linkRemote("demo.Counter")
        counter.increment()
    })


    ws.on('message', (data) => {
        console.log('data', data)
        client.handleMessage(data.toString())
    })
}

setTimeout(start, 500)