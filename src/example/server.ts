import { IObjectSource, Name, RemoteNode } from '../';
import { Server } from '../lib/net/server';


class BaseSink {
    [k: string]: any
    _objectName: string
    _propNames: string[]
    constructor(objectName: string, propNames: string[]) {
        this._objectName = objectName
        this._propNames = propNames
    }
    _notifyPropertyChange(path: string, value: any) {
        RemoteNode.notifyPropertyChange(`{this._objectName}/{path}`, value)
    }
    _notifySignal(path: string, args: any[]) {
        RemoteNode.notifySignal(`{this._objectName}/{path}`, args)
    }
    _collectProperties() {
        const props: Record<string, any> = {}
        this._propNames.forEach(element => {
            props[element] = this[element]
        });
        return props
    }

}

class CounterImpl extends BaseSink {
    count = 0;
    constructor() {
        super('demo.Counter', ['count'])
    }
    increment() {
        this.count++
        this._notifyPropertyChange('count', this.count)
    }
    fireShutdown(timeout: number) {
        this._notifySignal('shutdown', [timeout])
    }
}

class ObjectSource implements IObjectSource {
    impl: BaseSink
    constructor(impl: BaseSink) {
        this.impl = impl
    }

    olinkObjectName(): string {
        return this.impl._objectName
    }

    olinkLinked(name: string, node: RemoteNode): any {
    }    
    olinkUnlinked() {
    }
    olinkInvoke(name: string, args: any[]): any {
        console.log('invoke ', name)
        const path = Name.pathFromName(name)
        this.impl[path](...args)
    }
    olinkSetProperty(name: string, value: any): void {
        const path = Name.pathFromName(name)
        if(this.impl[path] !== value) {
            this.impl[path] = value
            RemoteNode.notifyPropertyChange(name, value)
        }
    }
    olinkCollectProperties(): any {
        return this.impl._collectProperties()
    }

}
const impl = new CounterImpl()
const source = new ObjectSource(impl)
RemoteNode.addObjectSource(source)

const server = new Server()
server.listen({ port: 8282 })

