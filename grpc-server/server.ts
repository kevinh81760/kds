/**
 * Standalone gRPC server for BurgerBot devices (e.g. Raspberry Pi).
 * Listens on 0.0.0.0:11001 — not part of the Next.js app.
 */

import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "node:path";
import {
  completeOrder,
  getOrderForPi,
  markFailedOrder,
} from "./db";

const PROTO_PATH = path.join(import.meta.dir, "proto", "connector.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: Number,
  enums: String,
  defaults: true,
  oneofs: true,
});

const proto = grpc.loadPackageDefinition(packageDefinition) as any;

// Full protobuf service name: devices.protos.burgerbot.ConnectorService
const connectorService =
  proto.devices.protos.burgerbot.ConnectorService.service;

const server = new grpc.Server();

server.addService(connectorService, {
  async GetOrder(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) {
    const trayNumber = Number(call.request.tray_number);

    if (!Number.isFinite(trayNumber)) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: "tray_number must be a finite number",
      });
    }

    const order = await getOrderForPi(trayNumber);

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
    const orderId = call.request.order_id as number;
    const clientId = call.request.client_id as number;

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
    const orderId = call.request.order_id as number;
    const clientId = call.request.client_id as number;
    const completed = (call.request.completed_commands ?? []) as Array<{
      id: number;
      is_disabled: boolean;
    }>;
    const failed = (call.request.failed_commands ?? []) as Array<{
      id: number;
      is_disabled: boolean;
    }>;

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
  "0.0.0.0:11001",
  grpc.ServerCredentials.createInsecure(),
  (error, port) => {
    if (error) {
      console.error(error);
      return;
    }

    console.log("gRPC server running on port 11001");
  },
);
