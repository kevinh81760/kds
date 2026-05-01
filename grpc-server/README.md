# grpc-server

gRPC service for the robot connector (`proto/connector.proto`).

## Setup

```bash
bun install
```

Env (same Supabase vars as the Next app, or `SUPABASE_URL` instead of `NEXT_PUBLIC_SUPABASE_URL`):

- `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional:

- `GRPC_PORT` — default `50051`
- `GRPC_HOST` — client only, default `127.0.0.1`

## Run

Server:

```bash
bun run dev
```

Smoke-test client (`tray_number` optional, default `32`):

```bash
bun run client -- 32
```

## Stack

[Bun](https://bun.com) · [@grpc/grpc-js](https://www.npmjs.com/package/@grpc/grpc-js) · Supabase
