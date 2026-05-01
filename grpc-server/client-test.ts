/**
 * Local smoke test: calls GetOrder with a fixed tray_number before wiring the Pi.
 *
 * Run while the server is up: `bun run test:get-order`
 * (default tray 32; override: `bun client-test.ts 5`)
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROTO_PATH = path.join(__dirname, "proto", "connector.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: Number,
  enums: String,
  defaults: true,
  oneofs: true,
});

const ConnectorCtor = (
  grpc.loadPackageDefinition(packageDefinition) as {
    devices: {
      protos: {
        burgerbot: { ConnectorService: grpc.ServiceClientConstructor };
      };
    };
  }
).devices.protos.burgerbot.ConnectorService;

/** Narrow typings for the unary RPC exposed by proto-loader + grpc-js */
interface ConnectorClient extends grpc.Client {
  getOrder(
    request: { tray_number: number },
    callback: (
      error: grpc.ServiceError | null,
      response?: Record<string, unknown>,
    ) => void,
  ): grpc.ClientUnaryCall;
}

const host = process.env.GRPC_HOST ?? "127.0.0.1";
const port = Number(process.env.GRPC_PORT ?? "11001");
/** Default tray from your example payload */
const trayNumber = Number(process.argv[2] ?? "32");

const address = `${host}:${port}`;
const client = new ConnectorCtor(address, grpc.credentials.createInsecure()) as unknown as ConnectorClient;

console.log(`Calling GetOrder tray_number=${trayNumber} @ ${address}`);

client.getOrder({ tray_number: trayNumber }, (err, response) => {
  if (err) {
    console.error(err.message);
    process.exitCode = 1;
    return;
  }
  console.log(JSON.stringify(response, null, 2));
});
