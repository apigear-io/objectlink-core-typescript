import WebSocket from 'ws'
import { ObjectLinkClient, IClientObjectHandler } from '..';
import { WebSocketWriter } from './shared';


class Counter implements IClientObjectHandler {
    count = 0
    client: ObjectLinkClient | undefined    
    async increment() {
        console.log('counter.increment')
        const result = await this.client?.invoke('demo.Counter/increment', [])
        console.log('result of increment', result)
    }

    onSignal(name: string, value: any): void {
        const [ _, path ] = name.split('/')
        console.log('Counter.onSignal', path, value)

    }
    onPropertyChanged(name: string, value: any): void {
        const [ _, path ] = name.split('/')
        console.log('Counter.onPropertyChanged', path, value)
    }
    onInit(name: string, props: any): void {
        console.log('Counter.onInit', name, props)
        this.applyProperties(props)
    }
    applyProperties(props: any): void {
        console.log('Counter.applyProperties', props)
    }
}

const counter = new Counter()

function start() {
    const ws = new WebSocket('ws://127.0.0.1:8282', {});
    const writer = new WebSocketWriter(ws)
    const client = new ObjectLinkClient(writer)
    ws.on('open',async  () => {
        client.addObject('demo.Counter', counter)
        counter.client = client
        await counter.increment()
    })


    ws.on('message', (data) => {
        console.log('data', data)
        client.handleMessage(data.toString())
    })
}

setTimeout(start, 500)