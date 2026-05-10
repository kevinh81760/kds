# BurgerBot Connector gRPC server

Standalone insecure gRPC server for Orange Pi / Raspberry Pi clients.

## Run

```bash
cd grpc-server
bun install
bun run dev
```

The server listens on `0.0.0.0:11001` by default.

## grpcurl example (GetOrder tray 123)

```bash
grpcurl -plaintext \
  -import-path ./proto \
  -proto connector.proto \
  -d '{"tray_number":123}' \
  127.0.0.1:11001 \
  devices.protos.burgerbot.ConnectorService/GetOrder
```

Expected response shape:

```json
{
  "orderId": "123",
  "clientId": "456",
  "trayNumber": 123,
  "commands": [
    { "id": "1001", "code": "1_2", "level": 0.5 }
  ]
}
```

## Smoke tests

```bash
# Get order by tray number
bun run test:get-order -- 123

# Mark successful completion
bun run test:complete-order -- 123 456

# Mark failed order with failed command IDs
bun run test:mark-failed-order -- 123 456 1001 1002
```
