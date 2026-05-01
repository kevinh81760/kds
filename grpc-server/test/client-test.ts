/**
 * Local smoke test: calls GetOrder with a fixed tray_number before wiring the Pi.
 *
 * Run while the server is up: `bun run test:get-order`
 * (default tray 1; override: `bun client-test.ts 5`)
 */

import * as grpc from "@grpc/grpc-js";
import { getGrpcAddress, loadConnectorServiceConstructor } from "../lib/grpc-test-connector";

const ConnectorCtor = loadConnectorServiceConstructor();

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

const address = getGrpcAddress();
/** Default tray when no CLI arg is passed */
const trayNumber = Number(process.argv[2] ?? "1");

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
