import { KEY_TYPE_A, KEY_TYPE_B, NFC } from "nfc-pcsc";
import * as ndef from "ndef";
import { config } from "../config";
import { generateBadgeToken } from "../token";
import type { BridgeWsServer } from "../ws/server";

type ReaderHandle = {
  name: string;
};

type CardHandle = {
  uid?: string;
  type?: string;
  atr?: Buffer;
};

type ReaderLike = {
  name: string;
  authenticate: (
    blockNumber: number,
    keyType: number,
    key: string,
    obsolete?: boolean,
  ) => Promise<void>;
  read: (
    blockNumber: number,
    length: number,
    blockSize?: number,
    packetSize?: number,
  ) => Promise<Buffer>;
  write: (
    blockNumber: number,
    data: Buffer,
    blockSize?: number,
    packetSize?: number,
  ) => Promise<void>;
  transmit: (data: Buffer, responseMaxLength: number) => Promise<Buffer>;
  on: (event: string, listener: (...args: any[]) => void) => void;
};

export class NfcBridge {
  private nfc = new NFC();
  private readers = new Set<string>();
  private ws: BridgeWsServer;

  constructor(ws: BridgeWsServer) {
    this.ws = ws;
  }

  start() {
    this.nfc.on("reader", (reader: ReaderLike) => {
      this.readers.add(reader.name);

      reader.on("card", async (card: CardHandle) => {
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
          const token = await this.writeToken(reader, card);
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

  private async writeToken(reader: ReaderLike, card: CardHandle) {
    const token = generateBadgeToken();
    const preferClassic = this.shouldPreferClassic(card);

    if (config.classicEnabled && preferClassic) {
      await this.writeClassicToken(reader, token);
      return token;
    }

    try {
      await this.writeNdefToken(reader, token);
    } catch (ndefError) {
      if (!config.classicEnabled) {
        throw ndefError;
      }

      try {
        await this.writeClassicToken(reader, token);
      } catch (classicError) {
        const ndefMessage =
          ndefError instanceof Error ? ndefError.message : "NDEF write failed";
        const classicMessage =
          classicError instanceof Error
            ? classicError.message
            : "Classic write failed";
        throw new Error(
          `NDEF path failed: ${ndefMessage}. Classic path failed: ${classicMessage}`,
        );
      }
    }

    return token;
  }

  private async writeNdefToken(reader: ReaderLike, token: string) {
    const message = [ndef.textRecord(token)];
    const encoded = Buffer.from(ndef.encodeMessage(message));

    if (encoded.length > config.ndefMaxBytes) {
      throw new Error("Token payload too large for configured tag size.");
    }

    const padded = this.padToBlockSize(encoded, config.ndefBlockSize);

    await reader.write(config.ndefStartBlock, padded, config.ndefBlockSize);

    try {
      const readBack = await reader.read(
        config.ndefStartBlock,
        padded.length,
        config.ndefBlockSize,
      );

      if (!readBack.subarray(0, encoded.length).equals(encoded)) {
        throw new Error("NDEF write verification failed.");
      }
    } catch (error) {
      console.warn(
        `[nfc] NDEF verification skipped after write: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async writeClassicToken(reader: ReaderLike, token: string) {
    const keyType =
      config.classicKeyType === "B" ? KEY_TYPE_B : KEY_TYPE_A;
    const probeBlock = config.classicStartBlock;
    const data = this.buildClassicPayload(token);
    let lastError: unknown = new Error("Classic authentication failed.");
    const useOmnikeyClassicPath = this.isOmnikeyReader(reader.name);

    for (const key of config.classicKeys) {
      for (const obsolete of [false, true]) {
        try {
          if (useOmnikeyClassicPath) {
            await this.loadOmnikeyClassicKey(reader, key);
            await this.authenticateOmnikeyClassic(reader, probeBlock, keyType);
          } else {
            await reader.authenticate(probeBlock, keyType, key, obsolete);
          }

          await reader.write(
            config.classicStartBlock,
            data,
            config.classicBlockSize,
          );

          const readBack = await reader.read(
            config.classicStartBlock,
            data.length,
            config.classicBlockSize,
          );
          const verifiedToken = this.decodeClassicPayload(readBack);
          if (verifiedToken !== token) {
            throw new Error("Classic write verification failed.");
          }

          return;
        } catch (error) {
          lastError = error;
        }
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error("Classic write failed.");
  }

  private async loadOmnikeyClassicKey(reader: ReaderLike, key: string) {
    const keyBytes = Buffer.from(key, "hex");

    if (keyBytes.length !== 6) {
      throw new Error("Classic key length must be 6 bytes.");
    }

    const packet = Buffer.from([
      0xff,
      0x82,
      0x20,
      0x00,
      keyBytes.length,
      ...keyBytes,
    ]);
    const response = await reader.transmit(packet, 2);
    this.assertStatusOk(response, "Could not load authentication key into reader.");
  }

  private async authenticateOmnikeyClassic(
    reader: ReaderLike,
    blockNumber: number,
    keyType: number,
  ) {
    const packet = Buffer.from([
      0xff,
      0x88,
      0x00,
      blockNumber,
      keyType,
      0x00,
    ]);
    const response = await reader.transmit(packet, 2);
    this.assertStatusOk(response, "Classic authentication failed.");
  }

  private buildClassicPayload(token: string) {
    const payload = Buffer.from(token, "utf8");
    const capacity = config.classicBlockSize * config.classicBlockCount;

    if (payload.length > capacity) {
      throw new Error("Token payload too large for Classic storage area.");
    }

    const buffer = Buffer.alloc(capacity);
    payload.copy(buffer);
    return buffer;
  }

  private decodeClassicPayload(data: Buffer) {
    const zeroIndex = data.indexOf(0x00);
    const slice = zeroIndex === -1 ? data : data.subarray(0, zeroIndex);
    return slice.toString("utf8").trim();
  }

  private padToBlockSize(data: Buffer, blockSize: number) {
    const remainder = data.length % blockSize;
    if (remainder === 0) {
      return data;
    }

    const padded = Buffer.alloc(data.length + (blockSize - remainder));
    data.copy(padded);
    return padded;
  }

  private shouldPreferClassic(card: CardHandle) {
    if (!card.uid) {
      return false;
    }

    const uidBytes = Math.floor(card.uid.length / 2);
    return uidBytes > 0 && uidBytes <= 4;
  }

  private isOmnikeyReader(readerName: string) {
    return /omnikey|cardman/i.test(readerName);
  }

  private assertStatusOk(response: Buffer, fallbackMessage: string) {
    if (response.length < 2) {
      throw new Error(fallbackMessage);
    }

    const statusCode = response.slice(-2).readUInt16BE(0);
    if (statusCode !== 0x9000) {
      throw new Error(`${fallbackMessage} Status code: 0x${statusCode.toString(16)}`);
    }
  }
}
