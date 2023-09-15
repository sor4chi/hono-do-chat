import { Hono } from "hono";
import { Env } from "./types";

export class WebSocketDO {
  state: DurableObjectState;
  app: Hono<{
    Bindings: Env;
  }>;
  sessions: Map<string, WebSocket>;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.sessions = new Map();
    this.app = new Hono();
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
