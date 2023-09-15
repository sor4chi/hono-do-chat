# so simple usage of Durable Object + Hono

Multi client chat app using Durable Object (WebSocket).

1. Create a Durable Object Namespace

```bash
touch wrangler.toml
```

Write the following to wrangler.toml
```toml
name = "workers-websocket-do"
compatibility_date = "2023-01-01"
[durable_objects]
bindings = [{ name = "WEBSOCKETDO", class_name = "WebSocketDO" }]

[[migrations]]
tag = "v1"
new_classes = ["WebSocketDO"]
```

2. Install dependencies

```
bun install
bun dev
```

3. Deploy
```
bun run deploy
```
