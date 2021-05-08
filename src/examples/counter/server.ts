import WebSocket from 'ws'
import { IObjectRemoteNotifier, IObjectRemoteAdapter, ObjectLinkRemoteRegistry } from '../../'
import { WebSocketWriter } from './shared';



class CounterAdapter implements IObjectRemoteAdapter {
    notifier: IObjectRemoteNotifier | null = null
    count = 0
    getObjectName(): string {
        return 'demo.Counter'
    }
    invoke(name: string, args: any[]): any {
        console.log('invoke', name, args)
        const [_, operation] = name.split('/')
        switch(operation) {
            case 'increment':
                this.count++
                this.notifier?.notifyPropertyChange(name, this.count)
        }
        this.notifyShutdown(7)
        return {v: "Hello2", x: -10}
    }
    setProperty(name: string, value: any): void {
        console.log('property change', name, value)
        const [ _, path ] = name.split('/')
        if(path === 'count' && this.count !== value) {
            this.count = value
            this.notifier?.notifyPropertyChange(name, value)
        }
    }
    collectProperties(): any {
        const count = this.count
        return { count }
    }
    linked(name: string, notifier: IObjectRemoteNotifier): any {
        console.log('adapter.linked', name)
        this.notifier = notifier
        return this.collectProperties()
    }    
    unlinked() {
        this.notifier = null
    }
    notifyShutdown(timeout: number) {
        const name = `${this.getObjectName()}/shutdown`
        this.notifier?.notifySignal(name, [timeout])
    }
}

const manager = new ObjectLinkRemoteRegistry()
const adapter = new CounterAdapter()
manager.addObject(adapter)

const wss = new WebSocket.Server({
    port: 8282,
})

wss.on('connection', (ws) => {
    console.log('connection')
    const writer = new WebSocketWriter(ws)
    const conn = manager.createConnection(writer)

ws.on('message', (data) => {
        console.log('message', data.toString())
        const msg = JSON.parse(data.toString())
        conn.handleMessage(msg)
    })
})
