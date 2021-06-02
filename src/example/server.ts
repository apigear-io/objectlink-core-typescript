import { IncomingMessage} from 'http';
import { IObjectSource, Name, RemoteNode, RemoteRegistry } from '../';
import { Server } from '../lib/net/server';


class CounterImpl {
    count = 0;
    increment() {
        this.count++
        RemoteNode.notifyPropertyChange('demo.Counter/count', this.count)
    }
    notifyShutdown(timeout: number) {
        RemoteNode.notifySignal('demo.Counter/shutdown', [timeout])
    }
}
class CounterAdapter implements IObjectSource {
    node: RemoteNode | null = null
    count = 0
    impl: CounterImpl
    constructor(impl: CounterImpl) {
        this.impl = impl
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
                this.impl.increment()
                RemoteNode.notifyPropertyChange(name, this.count)
        }
    }
    olinkSetProperty(name: string, value: any): void {
        console.log('CounterAdapter.olinkSetProperty', name, value)
        const path = Name.pathFromName(name)
        if(path === 'count' && this.impl.count !== value) {
            this.impl.count = value
            RemoteNode.notifyPropertyChange(name, value)
        }
    }
    olinkCollectProperties(): any {
        console.log('CounterAdapter.olinkCollectProperties')
        const count = this.impl.count
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
}
const impl = new CounterImpl()
const adapter = new CounterAdapter(impl)


const server = new Server()
server.listen({ port: 8282 })

