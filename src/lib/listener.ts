export interface IClientProtocolListener {
    handleInit(name: string, props: any): void
    handlePropertyChange(name: string, value: any): void
    handleInvokeReply(id: number, name: string, value: any): void
    handleSignal(name: string, args: any): void
    handleError(msgType: number, id: number, error: string): void
}

export interface IServiceProtocolListener {
    handleLink(name: string): void
    handleUnlink(name: string): void
    handleInvoke(id: number, name: string, args: any): void
    handleSetProperty(name: string, value: any): void
}

