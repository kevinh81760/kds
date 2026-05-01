/**
 * Shared setup for local gRPC smoke-test scripts (GetOrder, CompleteOrder, etc.).
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const PROTO_PATH = path.join(__dirname, "..", "proto", "connector.proto");

const protoLoaderOptions = {
  keepCase: true,
  longs: Number,
  enums: String,
  defaults: true,
  oneofs: true,
} as const;

export function loadConnectorServiceConstructor(): grpc.ServiceClientConstructor {
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, protoLoaderOptions);

  return (
    grpc.loadPackageDefinition(packageDefinition) as {
      devices: {
        protos: {
          burgerbot: { ConnectorService: grpc.ServiceClientConstructor };
        };
      };
    }
  ).devices.protos.burgerbot.ConnectorService;
}

export function getGrpcAddress(): string {
  const host = process.env.GRPC_HOST ?? "127.0.0.1";
  const port = Number(process.env.GRPC_PORT ?? "11001");
  return `${host}:${port}`;
}
