# So Simple Usage of Durable Object + Websocket

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
npm install
npm run dev
```

3. Deploy
```
npm run deploy
```
