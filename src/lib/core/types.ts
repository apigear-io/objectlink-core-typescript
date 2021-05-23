export enum MsgType {
    LINK = 10,
    INIT = 11,
    UNLINK = 12,
    SET_PROPERTY = 20,
    PROPERTY_CHANGE = 21,
    INVOKE = 30,
    INVOKE_REPLY = 31,
    SIGNAL = 40,
    ERROR = 90,
}

export enum MessageFormat {
    JSON = 1,
    BSON = 2,
    MSGPACK = 3,
    CBOR = 4,
};

export class Name {
    static resourceFromName(name: string): string {
        return name.split('/')[0]
    }
    static pathFromName(name: string): string {
        return name.split('/').slice(-1)[0]
    }
    static hasPath(name: string): boolean {
        return name.indexOf('/') !== -1;
    }
    static createName(resource: string, path: string) {
        return `${resource}/${path}`
    }
}


export class MessageConverter {
    format: MessageFormat = MessageFormat.JSON;
    constructor(format: MessageFormat) {
        this.format = format
    }
    fromString(message: string): any[] {
        return JSON.parse(message)
    }
    toString(data: any[]): string {
        return JSON.stringify(data)
    }
}

export type WriteMessageFunc = (msg: string) => void

export interface IMessageWriter {
    writeMessage(msg: any): void
}

export interface IMessageHandler {
    handleMessage(data: string): void
}


export enum LogLevel {
    Debug,
    Info,
    Warning,
    Error,
}

export type WriteLogFunc = (level: LogLevel, msg: string) => void;

export interface ILogger {
    log(level: LogLevel, msg: string): void        
}


export class Base {
    logFunc?: WriteLogFunc
    onLog(func: WriteLogFunc) {
        this.logFunc = func
    }
    emitLog(level: LogLevel, msg: string) {
        if(this.logFunc) {
            this.logFunc(level, msg)
        }
    }
}