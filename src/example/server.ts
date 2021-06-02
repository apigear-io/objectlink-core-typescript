import { IncomingMessage} from 'http';
import { IObjectSource, Name, RemoteNode, RemoteRegistry } from '../';
import { Server } from '../lib/net/server';


class CounterAdapter implements IObjectSource {
    node: RemoteNode | null = null
    count = 0
    constructor() {
        RemoteNode.addObjectSource(this)
    }
    olinkObjectName(): string {
        return 'demo.Counter'
    }
    olinkInvoke(name: string, args: any[]): any {
        console.log('CounterAdapter.olinkInvoke', name, args)
        const path = Name.pathFromName(name)
        switch(path) {
            case 'increment':
                this.count++
                this.node?.notifyPropertyChange(name, this.count)
        }
        this.notifyShutdown(7)
        return {v: "Hello2", x: -10}
    }
    olinkSetProperty(name: string, value: any): void {
        console.log('CounterAdapter.olinkSetProperty', name, value)
        const [ _, path ] = name.split('/')
        if(path === 'count' && this.count !== value) {
            this.count = value
            this.node?.notifyPropertyChange(name, value)
        }
    }
    olinkCollectProperties(): any {
        console.log('CounterAdapter.olinkCollectProperties')
        const count = this.count
        return { count }
    }
    olinkLinked(name: string, node: RemoteNode): any {
        console.log('CounterAdapter.olinkLinked', name)
        this.node = node
    }    
    olinkUnlinked() {
        console.log('CounterAdapter.olinkUnlinked')
        this.node = null
    }
    notifyShutdown(timeout: number) {
        const name = `${this.olinkObjectName()}/shutdown`
        this.node?.notifySignal(name, [timeout])
    }
}

const adapter = new CounterAdapter()


const server = new Server()
server.listen({ port: 8282 })

