export type BridgeClientMessage =
  | { type: "link:start"; token?: string }
  | { type: "link:stop" }
  | { type: "ping" };

export type BridgeServerMessage =
  | {
      type: "bridge:ready";
      payload: { version: string; readers: string[] };
    }
  | {
      type: "badge:detected";
      payload: { uid: string; reader: string; timestamp: string };
    }
  | {
      type: "badge:written";
      payload: { uid: string; token: string; reader: string; timestamp: string };
    }
  | {
      type: "badge:error";
      payload: { reader: string; message: string };
    }
  | { type: "pong" };
