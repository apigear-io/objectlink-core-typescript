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

// should be moved to tests
class EmptyProtocolListener implements IProtocolListener {
    handleLink(name: string): void {
        console.error('not implemented')
    }
    handleUnlink(name: string): void {
        console.error('not implemented')
    }
    handleInit(name: string, props: any): void {
        console.error('not implemented')
    }
    handleSetProperty(name: string, value: any): void {
        console.error('not implemented')
    }
    handlePropertyChange(name: string, value: any): void {
        console.error('not implemented')
    }
    handleInvoke(id: number, name: string, args: any): void {
        console.error('not implemented')
    }
    handleInvokeReply(id: number, name: string, value: any): void {
        console.error('not implemented')
    }
    handleSignal(name: string, args: any): void {
        console.error('not implemented')
    }
    handleError(msgType: number, id: number, error: string): void {
        console.error('not implemented')
    }
}
