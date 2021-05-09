import { MsgType } from "./types"


export class Messages {
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
        return [ MsgType.SET_PROPERTY, name, value]
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
}