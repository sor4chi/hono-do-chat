import { WebSocketDO } from "./socket-do";
import { HTML } from "./html";
import { Env } from "./types";
import { Hono } from "hono";
export { WebSocketDO };

const app = new Hono<{
  Bindings: Env;
}>();

app.get("/", (c) => c.html(HTML));
app.get("/websocket", (c) => {
  const id = c.env.WEBSOCKETDO.idFromName("A");
  const obj = c.env.WEBSOCKETDO.get(id);
  return obj.fetch(c.req.raw);
});
app.onError((err, c) => {
  if (c.req.header("Upgrade") == "websocket") {
    const [client, server] = Object.values(new WebSocketPair());
    server.accept();
    server.send(JSON.stringify({ error: err.stack, message: err.message }));
    server.close(1011, "Uncaught exception during session setup");
    return new Response(null, { status: 101, webSocket: client });
  }
  return new Response(err.stack, { status: 500 });
});

export default app;
