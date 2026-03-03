import { WebSocketServer, type WebSocket } from "ws";
import crypto from "crypto";
import { config } from "../config";
import type { BridgeClientMessage, BridgeServerMessage } from "../types";

type ClientState = {
  id: string;
  socket: WebSocket;
  awaitingLink: boolean;
};

type WsServerOptions = {
  host: string;
  port: number;
  getReaders: () => string[];
  onLinkRequested: (clientId: string) => void;
  onLinkStopped: (clientId: string) => void;
};

export class BridgeWsServer {
  private wss: WebSocketServer;
  private clients = new Map<string, ClientState>();
  private options: WsServerOptions;

  constructor(options: WsServerOptions) {
    this.options = options;
    this.wss = new WebSocketServer({ host: options.host, port: options.port });
    this.attach();
  }

  private attach() {
    this.wss.on("connection", (socket) => {
      const clientId = crypto.randomUUID();
      const state: ClientState = { id: clientId, socket, awaitingLink: false };
      this.clients.set(clientId, state);

      this.send(state, {
        type: "bridge:ready",
        payload: {
          version: "0.1.0",
          readers: this.options.getReaders(),
        },
      });

      socket.on("message", (raw) => {
        try {
          const parsed = JSON.parse(raw.toString()) as BridgeClientMessage;
          this.handleClientMessage(state, parsed);
        } catch (error) {
          this.send(state, {
            type: "badge:error",
            payload: { reader: "system", message: "Invalid message payload" },
          });
        }
      });

      socket.on("close", () => {
        this.clients.delete(clientId);
      });
    });
  }

  private handleClientMessage(state: ClientState, message: BridgeClientMessage) {
    switch (message.type) {
      case "link:start":
        if (!this.isAuthorized(message)) {
          this.send(state, {
            type: "badge:error",
            payload: { reader: "system", message: "Unauthorized device token." },
          });
          return;
        }
        state.awaitingLink = true;
        this.options.onLinkRequested(state.id);
        break;
      case "link:stop":
        state.awaitingLink = false;
        this.options.onLinkStopped(state.id);
        break;
      case "ping":
        this.send(state, { type: "pong" });
        break;
      default:
        break;
    }
  }

  private isAuthorized(message: BridgeClientMessage) {
    if (!config.bridgeToken) return true;
    if (message.type !== "link:start") return true;
    return message.token === config.bridgeToken;
  }

  send(client: ClientState, message: BridgeServerMessage) {
    if (client.socket.readyState === client.socket.OPEN) {
      client.socket.send(JSON.stringify(message));
    }
  }

  broadcast(message: BridgeServerMessage) {
    this.clients.forEach((client) => this.send(client, message));
  }

  popNextLinkClient() {
    for (const client of this.clients.values()) {
      if (client.awaitingLink) {
        client.awaitingLink = false;
        return client;
      }
    }
    return null;
  }

  stop() {
    this.wss.close();
  }
}
