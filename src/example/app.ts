import WebSocket from 'ws'
import { ClientNode, ClientRegistry, IObjectSink, Name, RemoteRegistry } from '..';
import { Client, createClientOptions } from '../lib/net/client';


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

const node = new ClientNode()
node.linkNode('demo.Counter')
const client = new Client(node, createClientOptions())
// link node to sink
// ensure addObjectSink returns a node
const counter = new Counter()
node.linkRemote("demo.Counter")
counter.increment()
client.open('ws://127.0.0.1:8282')
