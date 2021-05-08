export interface IMessageWriter {
    writeMessage(msg: any): void
}

export interface IMessageHandler {
    handleMessage(msg: any): void
}