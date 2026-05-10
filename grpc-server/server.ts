/**
 * Standalone gRPC server for BurgerBot devices (e.g. Orange Pi).
 * Binds all IPv4 interfaces by default (`0.0.0.0:11001`) so LAN clients (e.g. Raspberry Pi) can connect.
 * Listen config (first match wins for full address):
 * - `GRPC_LISTEN_ADDR` — full `host:port` (e.g. `0.0.0.0:11001`). Overrides host/port below.
 * - Else `GRPC_LISTEN_HOST` (default `0.0.0.0`) and `GRPC_LISTEN_PORT` (default `11001`).
 */

import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  completeOrder,
  getOrderForPi,
  markFailedOrder,
} from "./db";

const serverDir = path.dirname(fileURLToPath(import.meta.url));
const PROTO_PATH = path.join(serverDir, "proto", "connector.proto");

const DEFAULT_GRPC_LISTEN_HOST = "0.0.0.0";
const DEFAULT_GRPC_LISTEN_PORT = 11001;

const grpcListenPortRaw = process.env.GRPC_LISTEN_PORT ?? String(DEFAULT_GRPC_LISTEN_PORT);
const grpcListenPort = Number(grpcListenPortRaw);
if (!Number.isInteger(grpcListenPort) || grpcListenPort < 1 || grpcListenPort > 65535) {
  throw new Error(
    `[grpc-server] Invalid GRPC_LISTEN_PORT "${process.env.GRPC_LISTEN_PORT}" (expected 1–65535)`,
  );
}

const grpcListenHost = process.env.GRPC_LISTEN_HOST ?? DEFAULT_GRPC_LISTEN_HOST;

/** Address this process listens on (not necessarily the IP clients use to reach you). */
const GRPC_LISTEN_ADDR =
  process.env.GRPC_LISTEN_ADDR ?? `${grpcListenHost}:${grpcListenPort}`;

const listenIsLoopback =
  GRPC_LISTEN_ADDR === "127.0.0.1" ||
  GRPC_LISTEN_ADDR.startsWith("127.0.0.1:") ||
  GRPC_LISTEN_ADDR === "localhost" ||
  GRPC_LISTEN_ADDR.startsWith("localhost:");
if (listenIsLoopback) {
  console.warn(
    "[grpc-server] Listening on loopback (127.0.0.1/localhost). LAN devices cannot connect; use 0.0.0.0:11001 or set GRPC_LISTEN_HOST=0.0.0.0.",
  );
}

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const proto = grpc.loadPackageDefinition(packageDefinition) as any;

// Full protobuf service name: devices.protos.burgerbot.ConnectorService
const connectorService =
  proto.devices.protos.burgerbot.ConnectorService.service;

const server = new grpc.Server();

function parseTrayNumber(value: unknown): number | null {
  const tray = Number(value);
  if (!Number.isInteger(tray) || tray < 1 || tray > 65535) {
    return null;
  }
  return tray;
}

function parseUint64AsSafeInt(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isSafeInteger(value) && value >= 0 ? value : null;
  }
  if (typeof value === "string" && /^\d+$/.test(value)) {
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) ? parsed : null;
  }
  return null;
}

server.addService(connectorService, {
  async GetOrder(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) {
    const trayNumber = parseTrayNumber(call.request.tray_number);
    if (trayNumber === null) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: "tray_number must be an integer between 1 and 65535",
      });
    }

    let order = null;
    try {
      order = await getOrderForPi(trayNumber);
    } catch (error) {
      console.error("[grpc-server] GetOrder failed:", error);
      const detail =
        error instanceof Error ? error.message : "Order data is invalid for Pi execution";
      return callback({
        code: grpc.status.FAILED_PRECONDITION,
        message: detail,
      });
    }

    if (!order) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: `No order found for tray ${trayNumber}`,
      });
    }

    callback(null, order);
  },

  async CompleteOrder(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>,
  ) {
    const orderId = parseUint64AsSafeInt(call.request.order_id);
    const clientId = parseUint64AsSafeInt(call.request.client_id);
    if (orderId === null || clientId === null) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: "order_id and client_id must be safe uint64 integers",
      });
    }

    const ok = await completeOrder(orderId, clientId);

    if (!ok) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: `Order ${orderId} not found or client mismatch`,
      });
    }

    callback(null, {});
  },

  async MarkFailedOrder(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>,
  ) {
    const orderId = parseUint64AsSafeInt(call.request.order_id);
    const clientId = parseUint64AsSafeInt(call.request.client_id);
    if (orderId === null || clientId === null) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: "order_id and client_id must be safe uint64 integers",
      });
    }

    const completedRaw = (call.request.completed_commands ?? []) as Array<{
      id: unknown;
      is_disabled: boolean;
    }>;
    const completed = completedRaw
      .map((command) => ({
        id: parseUint64AsSafeInt(command.id),
        is_disabled: Boolean(command.is_disabled),
      }))
      .filter((command): command is { id: number; is_disabled: boolean } => command.id !== null);

    const failedRaw = (call.request.failed_commands ?? []) as Array<{
      id: unknown;
      is_disabled: boolean;
    }>;
    const failed = failedRaw
      .map((command) => ({
        id: parseUint64AsSafeInt(command.id),
        is_disabled: Boolean(command.is_disabled),
      }))
      .filter((command): command is { id: number; is_disabled: boolean } => command.id !== null);

    if (completed.length !== completedRaw.length || failed.length !== failedRaw.length) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: "completed_commands/failed_commands contain non-safe uint64 ids",
      });
    }

    const ok = await markFailedOrder(orderId, clientId, completed, failed);

    if (!ok) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: `Order ${orderId} not found, client mismatch, or command update failed`,
      });
    }

    callback(null, {});
  },
});

server.bindAsync(
  GRPC_LISTEN_ADDR,
  grpc.ServerCredentials.createInsecure(),
  (error, port) => {
    if (error) {
      console.error(error);
      return;
    }

    console.log(
      `gRPC server listening on ${GRPC_LISTEN_ADDR} (bound port ${port}; reachable from LAN as <this-host-ip>:${port})`,
    );
  },
);
