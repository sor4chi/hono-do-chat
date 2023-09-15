import { Env } from "./types";

export class WebSocketDO {
  state: DurableObjectState;
  env: Env;
  sessions: Map<string, WebSocket>;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;

    this.sessions = new Map();
  }

  async fetch(request: Request) {
    const path = new URL(request.url).pathname;

    if (
      path !== "/websocket" ||
      request.headers.get("Upgrade") !== "websocket"
    ) {
      return new Response("Not found", {
        status: 404,
        headers: {
          pathname: path,
          upgrade: request.headers.get("Upgrade") || "",
        },
      });
    }

    return await this.handleWebSocketUpgrade(request);
  }

  async handleWebSocketUpgrade(request: Request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      throw new Error(`Upgrade header not 'websocket' or not present.`);
    }

    const [client, server] = Object.values(new WebSocketPair());
    const clientId = Math.random().toString(36).slice(2);
    server.accept();

    this.sessions.set(clientId, server);

    server.addEventListener("message", (msg) => {
      if (typeof msg.data !== "string") return;
      this.broadcast(msg.data, clientId);
    });

    return new Response(null, { status: 101, webSocket: client });
  }

  broadcast(message: string, senderClientId?: string) {
    for (const [clientId, webSocket] of this.sessions.entries()) {
      if (clientId === senderClientId) {
        continue;
      }

      try {
        webSocket.send(message);
      } catch (error) {
        this.sessions.delete(clientId);
      }
    }
  }
}
