import { Env } from "./types";

export class WebSocketDO {
  state: DurableObjectState;
  env: Env;
  client?: WebSocket;
  server?: WebSocket;
  sessions: {
    clientId: string;
    webSocket: WebSocket;
    quit?: boolean;
  }[];

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;

    this.sessions = [];
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

    const clientId = Math.random().toString(36).slice(2);
    return await this.handleWebSocketUpgrade(request, clientId);
  }

  async handleWebSocketUpgrade(request: Request, clientId: string) {
    if (request.headers.get("Upgrade") !== "websocket") {
      throw new Error(`Upgrade header not 'websocket' or not present.`);
    }

    const [client, server] = Object.values(new WebSocketPair());
    this.client = client;
    this.server = server;
    this.server.accept();

    const session = { webSocket: server, clientId };
    this.sessions.push(session);

    server.addEventListener("message", async (msg) => {
      if (typeof msg.data !== "string") return;
      const data = JSON.parse(msg.data);
      if (data.clientId) {
        session.clientId = data.clientId;
      }
      this.broadcast(JSON.stringify(data), data.clientId);
    });

    return new Response(null, { status: 101, webSocket: client });
  }

  broadcast(message: string, senderClientId?: string) {
    this.sessions = this.sessions.filter((session) => {
      if (session.quit) {
        return false;
      }

      if (session.clientId === senderClientId) {
        return true;
      }

      try {
        session.webSocket.send(message);
        return true;
      } catch (error) {
        session.quit = true;
        return false;
      }
    });
  }
}
