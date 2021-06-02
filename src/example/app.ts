import { EventEmitter } from 'eventemitter3';
import WebSocket from 'ws'
import { ClientNode, ClientRegistry, IObjectSink, Name, RemoteRegistry } from '..';
import { Client, createClientOptions } from '../lib/net/client';

class BaseClient extends EventEmitter implements IObjectSink  {
    [k: string]: any
    _objectName: string
    _node: ClientNode | null
    constructor(objectName: string) {
        super()
        this._objectName = objectName
        this._node = ClientNode.addObjectSink(this)        
    }
    olinkObjectName(): string {
        return  this._objectName
    } 
    olinkOnSignal(name: string, value: any): void {
        const path = Name.pathFromName(name)
        this.emit(path, value)
    }
    _setRemoteProperty(path: string, value: any) {
        const resource = this.olinkObjectName()
        this._node?.setRemoteProperty(Name.createName(resource, path), value)
    }
    _setProperty(path: string, value: any) {
        if(this[path] !== value) {
            this[path] = value
            this.emit(`{path}Changed`, value)
        }
    }
    async _invokeAsync(path: string, args: any[]): Promise<any> {
        const resource = this.olinkObjectName()
        return await this._node?.invokeRemoteAsync(Name.createName(resource, path), args)
    }
    _invoke(path: string, args: any) {
        const resource = this.olinkObjectName()
        this._node?.invokeRemote(Name.createName(resource, path), args, null)        
    }
    olinkOnPropertyChanged(name: string, value: any): void {
        const path = Name.pathFromName(name)
        this._setProperty(path, value)
    }
    olinkOnInit(name: string, props: any): void {
        console.log('Counter.onInit', name, props)
        for(const k in props) {
            this._setProperty(k, props[k])
        }
        this.emit('init')
    }
    olinkOnRelease(): void {
        console.log('release sink')
        this.emit('release')
    }
}

class Counter extends BaseClient {
    _count = 0
    constructor() {
        super('demo.Counter')
    }
    get count(): number {
        return this._count
    }
    set count(value: number) {
        this._setRemoteProperty('count', value)
    }
    increment() {
        this._invoke('increment', [])
    }
    async incrementAsync(): Promise<void> {
        await this._invokeAsync('increment', [])
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
