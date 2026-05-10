/**
 * Local smoke test: calls CompleteOrder for a known order/client pair.
 *
 * Run while the server is up: `bun run test:complete-order -- 123 456`
 * (args: order_id client_id)
 */

import * as grpc from "@grpc/grpc-js";
import { getGrpcAddress, loadConnectorServiceConstructor } from "../lib/grpc-test-connector";

const ConnectorCtor = loadConnectorServiceConstructor();

interface ConnectorClient extends grpc.Client {
  completeOrder(
    request: { order_id: string; client_id: string },
    callback: (error: grpc.ServiceError | null, response?: Record<string, unknown>) => void,
  ): grpc.ClientUnaryCall;
}

const orderId = Number(process.argv[2]);
const clientId = Number(process.argv[3]);

if (!Number.isFinite(orderId) || !Number.isFinite(clientId)) {
  console.error("Usage: bun client-test-complete.ts <order_id> <client_id>");
  process.exit(1);
}

const address = getGrpcAddress();
const client = new ConnectorCtor(address, grpc.credentials.createInsecure()) as unknown as ConnectorClient;

console.log(`Calling CompleteOrder order_id=${orderId} client_id=${clientId} @ ${address}`);

client.completeOrder({ order_id: String(orderId), client_id: String(clientId) }, (err, response) => {
  if (err) {
    console.error(`${err.code}: ${err.message}`);
    process.exitCode = 1;
    return;
  }

  console.log("CompleteOrder success");
  console.log(JSON.stringify(response ?? {}, null, 2));
});
