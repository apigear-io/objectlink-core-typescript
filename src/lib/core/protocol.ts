import { MessageFormat, MsgType, IMessageWriter, Base, WriteMessageFunc } from './types';

export interface IProtocolListener {
    handleLink(name: string): void
    handleUnlink(name: string): void
    handleInit(name: string, props: any): void
    handleSetProperty(name: string, value: any): void
    handlePropertyChange(name: string, value: any): void
    handleInvoke(id: number, name: string, args: any): void
    handleInvokeReply(id: number, name: string, value: any): void
    handleSignal(name: string, args: any): void
    handleError(msgType: number, id: number, error: string): void
}


export class Protocol extends Base {
    listener: IProtocolListener
    constructor(listener: IProtocolListener) {
        super()
        this.listener = listener
    }
        /**
     * links a remote object
     * remote shall reply with an INIT message
     * @param name object name as `${module}.${interface}`
     * @returns ipc message
     */
         static linkMessage(name: string): any[] {
            return [ MsgType.LINK, name ]
        }
        /**
         * message after an LINK message, returns all property values
         * @param id id from link message
         * @param props map of object properties
         * @returns 
         */
        static initMessage(name: string, props: any): any[] {
            return [ MsgType.INIT, name, props]
        }
        
        /**
         * unlinks remote object
         * @param name object name as `${module}.${interface}`
         * @returns ipc message
         */
        static unlinkMessage(name: string): any[] {
            return [MsgType.UNLINK, name]
        }
        /**
         * send when a property change to service
         * @param name property name as `${module}.${interface}/${property}`
         * @param value property value
         * @returns ipc message
         */
        static setPropertyMessage(name: string, value: any) {
            return [ MsgType.SET_PROPERTY, name, value]
        }
    
        /**
         * signals a property change to all linked clients
         * @param name property name as `${module}.${interface}/${property}`
         * @param value property value
         * @returns ipc message
         */
        static propertyChangeMessage(name: string, value: any) {
            return [ MsgType.PROPERTY_CHANGE, name, value]
        }
    
        /**
         * invoke calls to the remote and returns a result
         * remote shall answer with an invoke reply
         * @param id running id unique for client session
         * @param name operation name as `${module}.${interface}/${operation}`
         * @param args array of operation arguments
         * @returns ipc message
         */
        static invokeMessage(id: number, name: string, args: any[]): any[] {
            return [MsgType.INVOKE, id, name, args]
        }
        /**
         * the answer of an invoke message
         * @param id id from invoke message
         * @param value return value of operation
         * @returns ipc message
         */
        static invokeReplyMessage(id: number, name: string, value: any): any[] {        
            return [ MsgType.INVOKE_REPLY, id, name, value]
        }
        /**
         * signal notifies client of remote events
         * @param name signal name as `${module}.${interface}/${signal}`
         * @param args 
         * @returns ipc message
         */
        static signalMessage(name: string, args: any[]): any[] {
            return [MsgType.SIGNAL, name, args]
        }
        /**
         * error message
         * @param msgType type of message
         * @param id only if available, otherwise 0
         * @param error error message as string
         * @returns ipc message
         */
        static errorMessage(msgType: MsgType, id: number, error: string): any[] {
            return [MsgType.ERROR, msgType, id, error]
        }

    handleMessage(msg: any[]): boolean {
        if(!this.listener) {
            console.log("no listener installed")
            return false
        }
        const msgType = msg[0]
        switch(msgType) {
            case MsgType.LINK: {
                const [_, name ] = msg
                console.log('link', name)
                this.listener.handleLink(name)
                break
            }
            case MsgType.INIT: {
                console.log('handle object init')
                const [_, name, props] = msg
                this.listener.handleInit(name, props)
                break
            }
            case MsgType.UNLINK: {
                const [_, name] = msg
                console.log('unlink', name)
                this.listener.handleUnlink(name)
                break
            }
            case MsgType.SET_PROPERTY: {
                console.log('handle set property')
                const [_, name, value] = msg
                this.listener.handleSetProperty(name, value)
                break
            }
            case MsgType.PROPERTY_CHANGE: {
                console.log('handle property change')
                const [_, name, value] = msg
                this.listener.handlePropertyChange(name, value)
                break
            }
            case MsgType.INVOKE: {
                console.log('handle operation invoke')
                const [_, id, name, args ] = msg
                this.listener.handleInvoke(id, name, args)
                break
            }
            case MsgType.INVOKE_REPLY: {
                console.log('handle invoke reply')
                const [_, id, name, value] = msg
                this.listener.handleInvokeReply(id, name, value)
                break
            }
            case MsgType.SIGNAL: {
                console.log('handle signal')
                const [_, name, args] = msg
                this.listener.handleSignal(name, args)
                break
            }
            case MsgType.ERROR: {
                console.log('handle error')
                const [_, msgType, requestId, error] = msg
                this.listener.handleError(msgType, requestId, error)
                break
            }
            default: {
                console.error("not supported message type: ", msg)
                return false
            }
        }
        return true
    }
}