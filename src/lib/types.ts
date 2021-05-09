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