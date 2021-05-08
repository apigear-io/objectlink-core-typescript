# ObjectLink Protocol

The ObjectLink protocol links an object to a remote object.

* syncs properties between objects linked across different clients
* signals events between objects linked across different client
* asynchronously invokes remote operations

The protocol itself is transport agnostic but it is designed with WebSockets in mind. The protocol supports different JSON serializations, as also MsgPack and CBOR.


