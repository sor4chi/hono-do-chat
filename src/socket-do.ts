import { Hono } from "hono";
import { Env } from "./types";

export class WebSocketDO {
  state: DurableObjectState;
  app = new Hono<{
    Bindings: Env;
  }>().basePath("/chat");
  sessions: Map<string, WebSocket>;
  messages: {
    timestamp: string;
    text: string;
  }[];

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.messages = [];
    this.sessions = new Map();
    this.app.get("/messages", (c) => c.json(this.messages));
    this.app.get("/websocket", async (c) => {
      if (c.req.header("Upgrade") === "websocket") {
        return await this.handleWebSocketUpgrade();
      }
      return c.text("Not found", 404);
    });
  }

  fetch(request: Request) {
    return this.app.fetch(request);
  }

  async handleWebSocketUpgrade() {
    const [client, server] = Object.values(new WebSocketPair());
    const clientId = Math.random().toString(36).slice(2);
    server.accept();

    this.sessions.set(clientId, server);

    server.addEventListener("message", (msg) => {
      if (typeof msg.data !== "string") return;
      this.messages.push(JSON.parse(msg.data));
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
