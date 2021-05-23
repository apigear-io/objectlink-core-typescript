import { InvokeReplyArg, InvokeReplyFunc } from "../.."
import { Protocol } from "./protocol"
import { MsgType } from "./types"

const name = 'demo.Calc'
const props = { count: 0 }
const value = 1
const args = [1, 2]
let lastValue: any = undefined
const requestId = 1
const msgType = MsgType.INVOKE
const error = 'failed'

const replyFunc = (name: string, arg: InvokeReplyArg) => {
    lastValue = arg.value
}
test('linkMessage', () => {
    const msg = Protocol.linkMessage(name)
    expect(msg).toStrictEqual([MsgType.LINK, name])    
})
test('unlinkMessage', () => {
    const msg = Protocol.unlinkMessage(name)
    expect(msg).toStrictEqual([MsgType.UNLINK, name])    
})
test('initMessage', () => {
    const msg = Protocol.initMessage(name, props)
    expect(msg).toStrictEqual([MsgType.INIT, name, props])
})
test('setProperty', () => {
    const msg = Protocol.setPropertyMessage(name, value)
    expect(msg).toStrictEqual([MsgType.SET_PROPERTY, name, value])
})
test('propertyChange', () => {
    const msg = Protocol.propertyChangeMessage(name, value)
    expect(msg).toStrictEqual([MsgType.PROPERTY_CHANGE, name, value])
})
test('invoke', () => {
    const msg = Protocol.invokeMessage(requestId, name, args)
    expect(msg).toStrictEqual([MsgType.INVOKE, requestId, name, args])
})
test('invoke reply', () => {
    const msg = Protocol.invokeReplyMessage(requestId, name, value)
    expect(msg).toStrictEqual([MsgType.INVOKE_REPLY, requestId, name, value])
})
test('signal', () => {
    const msg = Protocol.signalMessage(name, args)
    expect(msg).toStrictEqual([MsgType.SIGNAL, name, args])
})

test('error', () => {
    const msg = Protocol.errorMessage(msgType, requestId, error)
    expect(msg).toStrictEqual([MsgType.ERROR, msgType, requestId, error])
})