export interface IMessageWriter {
    writeMessage(msg: any): void
}

export interface IMessageHandler {
    handleMessage(data: string): void
}