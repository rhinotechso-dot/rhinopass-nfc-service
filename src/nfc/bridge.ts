import { NFC } from "nfc-pcsc";
import * as ndef from "ndef";
import { config } from "../config";
import { generateBadgeToken } from "../token";
import type { BridgeWsServer } from "../ws/server";

type ReaderHandle = {
  name: string;
};

export class NfcBridge {
  private nfc = new NFC();
  private readers = new Set<string>();
  private ws: BridgeWsServer;

  constructor(ws: BridgeWsServer) {
    this.ws = ws;
  }

  start() {
    this.nfc.on("reader", (reader: any) => {
      this.readers.add(reader.name);

      reader.on("card", async (card: { uid?: string }) => {
        const uid = card.uid ?? "unknown";
        const timestamp = new Date().toISOString();

        this.ws.broadcast({
          type: "badge:detected",
          payload: { uid, reader: reader.name, timestamp },
        });

        const linkClient = this.ws.popNextLinkClient();
        if (!linkClient) return;

        if (!config.writeEnabled) {
          this.ws.send(linkClient, {
            type: "badge:error",
            payload: {
              reader: reader.name,
              message: "Write mode is disabled on this bridge.",
            },
          });
          return;
        }

        try {
          const token = await this.writeToken(reader, uid);
          this.ws.send(linkClient, {
            type: "badge:written",
            payload: {
              uid,
              token,
              reader: reader.name,
              timestamp: new Date().toISOString(),
            },
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unable to write token";
          this.ws.send(linkClient, {
            type: "badge:error",
            payload: { reader: reader.name, message },
          });
        }
      });

      reader.on("error", (err: Error) => {
        this.ws.broadcast({
          type: "badge:error",
          payload: { reader: reader.name, message: err.message },
        });
      });

      reader.on("end", () => {
        this.readers.delete(reader.name);
      });
    });

    this.nfc.on("error", (err: Error) => {
      this.ws.broadcast({
        type: "badge:error",
        payload: { reader: "system", message: err.message },
      });
    });
  }

  getReaders() {
    return Array.from(this.readers.values());
  }

  private async writeToken(reader: any, uid: string) {
    const token = generateBadgeToken();
    const message = [ndef.textRecord(token)];
    const encoded = Buffer.from(ndef.encodeMessage(message));

    if (encoded.length > config.ndefMaxBytes) {
      throw new Error("Token payload too large for configured tag size.");
    }

    await this.writeInBlocks(reader, encoded);
    return token;
  }

  private async writeInBlocks(reader: any, data: Buffer) {
    const { ndefStartBlock, ndefBlockSize } = config;
    let offset = 0;
    let block = ndefStartBlock;

    while (offset < data.length) {
      const chunk = data.slice(offset, offset + ndefBlockSize);
      await reader.write(block, chunk, ndefBlockSize);
      offset += ndefBlockSize;
      block += 1;
    }
  }
}
