/**
 * Local smoke test: calls MarkFailedOrder for a known order/client pair.
 *
 * Run while the server is up:
 * `bun run test:mark-failed-order -- 123 456 1001 1002`
 * (args: order_id client_id failed_command_id... ; no command ids means empty arrays)
 */

import * as grpc from "@grpc/grpc-js";
import { getGrpcAddress, loadConnectorServiceConstructor } from "../lib/grpc-test-connector";

const ConnectorCtor = loadConnectorServiceConstructor();

interface OrderResultCommand {
  id: string;
  is_disabled: boolean;
}

interface ConnectorClient extends grpc.Client {
  markFailedOrder(
    request: {
      order_id: string;
      client_id: string;
      completed_commands: OrderResultCommand[];
      failed_commands: OrderResultCommand[];
    },
    callback: (error: grpc.ServiceError | null, response?: Record<string, unknown>) => void,
  ): grpc.ClientUnaryCall;
}

const orderId = Number(process.argv[2]);
const clientId = Number(process.argv[3]);
const failedCommandIds = process.argv.slice(4).map((value) => Number(value));

if (!Number.isSafeInteger(orderId) || !Number.isSafeInteger(clientId)) {
  console.error("Usage: bun client-test-mark-failed.ts <order_id> <client_id> [failed_command_id...]");
  process.exit(1);
}
if (failedCommandIds.some((id) => !Number.isSafeInteger(id))) {
  console.error("All failed_command_id values must be safe integers");
  process.exit(1);
}

const address = getGrpcAddress();
const client = new ConnectorCtor(address, grpc.credentials.createInsecure()) as unknown as ConnectorClient;

const failedCommands = failedCommandIds.map((id) => ({ id: String(id), is_disabled: false }));

console.log(
  `Calling MarkFailedOrder order_id=${orderId} client_id=${clientId} failed_ids=${failedCommandIds.join(",")} @ ${address}`,
);

client.markFailedOrder(
  {
    order_id: String(orderId),
    client_id: String(clientId),
    completed_commands: [],
    failed_commands: failedCommands,
  },
  (err, response) => {
    if (err) {
      console.error(`${err.code}: ${err.message}`);
      process.exitCode = 1;
      return;
    }

    console.log("MarkFailedOrder success");
    console.log(JSON.stringify(response ?? {}, null, 2));
  },
);
