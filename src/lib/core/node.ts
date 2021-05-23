import { IProtocolListener, Protocol } from './protocol';
import { Base, IMessageHandler, WriteMessageFunc, MessageConverter, MessageFormat } from './types';

export class BaseNode extends Base implements IProtocolListener, IMessageHandler {
    writeFunc?: WriteMessageFunc
    converter: MessageConverter
    protocol: Protocol
    constructor() {        
        super();
        this.protocol = new Protocol(this)
        this.converter = new MessageConverter(MessageFormat.JSON)
    }
    onWrite(func: WriteMessageFunc): void {
        this.writeFunc = func;
    }
    emitWrite(msg: any[]) {        
        const data = this.converter.toString(msg)
        if(this.writeFunc) {
            this.writeFunc(data)
        } else {
            console.log("write not set on protocol")
        }
    }
    handleMessage(data: string): void {
        console.log("handleMessage: ", data)
        const msg = this.converter.fromString(data)
        this.protocol.handleMessage(msg)
    }
    handleLink(name: string): void {
        throw new Error('Method not implemented.');
    }
    handleUnlink(name: string): void {
        throw new Error('Method not implemented.');
    }
    handleInit(name: string, props: any): void {
        throw new Error('Method not implemented.');
    }
    handleSetProperty(name: string, value: any): void {
        throw new Error('Method not implemented: handleSetProperty: ' +  name + value);
    }
    handlePropertyChange(name: string, value: any): void {
        throw new Error('Method not implemented: handlePropertyChange' + name + value);
    }
    handleInvoke(id: number, name: string, args: any): void {
        throw new Error('Method not implemented.');
    }
    handleInvokeReply(id: number, name: string, value: any): void {
        throw new Error('Method not implemented.');
    }
    handleSignal(name: string, args: any): void {
        throw new Error('Method not implemented.');
    }
    handleError(msgType: number, id: number, error: string): void {
        throw new Error('Method not implemented.');
    }
}