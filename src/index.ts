import { WebSocketDO } from "./socket-do";
import { HTML } from "./html";
import { Env } from "./types";
export { WebSocketDO };

async function handleErrors(request: Request, func: () => Promise<Response>) {
  try {
    return await func();
  } catch (err) {
    if (request.headers.get("Upgrade") == "websocket") {
      const [client, server] = Object.values(new WebSocketPair());
      server.accept();
      server.send(JSON.stringify({ error: err.stack, message: err.message }));
      server.close(1011, "Uncaught exception during session setup");
      return new Response(null, { status: 101, webSocket: client });
    } else {
      return new Response(err.stack, { status: 500 });
    }
  }
}

async function handleRequest(request: Request, env: Env) {
  const path = new URL(request.url).pathname;
  console.log("path", path);

  if (path === "/") {
    return new Response(HTML, {
      headers: { "Content-Type": "text/html;charset=UTF-8" },
    });
  } else if (path === "/websocket") {
    const id = env.WEBSOCKETDO.idFromName("A");
    const obj = env.WEBSOCKETDO.get(id);
    const response = obj.fetch(request);
    return response;
  } else {
    return new Response("Not found", {
      status: 404,
      headers: { pathname: path },
    });
  }
}

export default {
  async fetch(request: Request, env: Env) {
    return await handleErrors(request, async () => {
      return handleRequest(request, env);
    });
  },
};
