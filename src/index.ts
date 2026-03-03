import { config } from "./config";
import { BridgeWsServer } from "./ws/server";
import { NfcBridge } from "./nfc/bridge";

let nfcBridge: NfcBridge;

const wsServer = new BridgeWsServer({
  host: config.serviceHost,
  port: config.servicePort,
  getReaders: () => nfcBridge?.getReaders() ?? [],
  onLinkRequested: () => undefined,
  onLinkStopped: () => undefined,
});

nfcBridge = new NfcBridge(wsServer);
nfcBridge.start();

console.log(
  `[NFC] Bridge running at ws://${config.serviceHost}:${config.servicePort}`,
);
