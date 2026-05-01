/**
 * Database helpers for the BurgerBot Connector gRPC server.
 *
 * Uses the Supabase **service role** key so this server can update orders/commands
 * without end-user JWTs (safe only when this process runs on a trusted machine).
 */

import { config } from "dotenv";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Mirror Next.js env layering from the repo root (same as `/api/test`):
 * 1. `.env` — base
 * 2. `.env.local` — overrides `.env` (`override: true`, like Next)
 * 3. `grpc-server/.env` — fills keys that are still unset only (won't stomp root locals)
 */
const grpcDir = import.meta.dir;

config({ path: path.join(grpcDir, "../.env") });
config({
  path: path.join(grpcDir, "../.env.local"),
  override: true,
});
config({ path: path.join(grpcDir, ".env") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Copy .env.example to .env or use root `.env.local`.",
  );
}

/** Shared Supabase admin client (service role — bypasses RLS). */
export const supabase: SupabaseClient = createClient(url, serviceRoleKey);

try {
  const host = new URL(url).hostname;
  console.log(`[grpc-server] Supabase host: ${host}`);
} catch {
  console.warn("[grpc-server] NEXT_PUBLIC_SUPABASE_URL is not a valid URL");
}

/**
 * Fetch a single active order row by tray number.
 * Maps DB column `orders.id` → returned shape uses `order_id` only in composite helpers.
 */
export async function getOrderByTrayNumber(trayNumber: number) {
  // Same RPC shape as Next.js `src/lib/db/orders.ts` (includes PostgREST error semantics).
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("tray_number", trayNumber)
    .single();

  if (error) {
    // PGRST116 = zero rows (normal NOT_FOUND); anything else is worth printing server-side.
    if (error.code !== "PGRST116") {
      console.error("[grpc-server] orders lookup failed:", error.code, error.message);
    }
    return null;
  }

  return data;
}

/** All commands for an order, ordered by id (stable for the Pi). */
export async function getCommandsByOrderId(orderId: number) {
  const { data, error } = await supabase
    .from("order_command")
    .select("*")
    .eq("order_id", orderId)
    .order("id", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data;
}

/**
 * Payload the Raspberry Pi expects from GetOrder:
 * - orders.id → order_id
 * - orders.client_id → client_id
 * - orders.tray_number → tray_number
 * - order_command: id, command_code → code, command_level → level
 */
export async function getOrderForPi(trayNumber: number) {
  const order = await getOrderByTrayNumber(trayNumber);

  if (!order) {
    return null;
  }

  // Pi has picked up the order; flip it to running before handing back the payload.
  const { error: statusError } = await supabase
    .from("orders")
    .update({ status: "running", updated_at: new Date().toISOString() })
    .eq("id", order.id);

  if (statusError) {
    console.error(
      "[grpc-server] failed to mark order running:",
      statusError.code,
      statusError.message,
    );
  }

  const commands = await getCommandsByOrderId(order.id);

  return {
    order_id: order.id,
    client_id: order.client_id,
    tray_number: order.tray_number,
    commands: commands.map((command) => ({
      id: command.id,
      code: command.command_code,
      level: command.command_level,
    })),
  };
}

/**
 * Mark order done and all its commands completed.
 * Requires matching client_id so one tenant cannot complete another's order by id guess.
 */
export async function completeOrder(orderId: number, clientId: number) {
  const updatedAt = new Date().toISOString();

  const { data: updatedRows, error: orderError } = await supabase
    .from("orders")
    .update({ status: "done", updated_at: updatedAt })
    .eq("id", orderId)
    .eq("client_id", clientId)
    .select("id");

  if (orderError || !updatedRows?.length) {
    return false;
  }

  const { error: commandsError } = await supabase
    .from("order_command")
    .update({ status: "completed", updated_at: updatedAt })
    .eq("order_id", orderId);

  if (commandsError) {
    return false;
  }

  return true;
}

type ResultCommand = { id: number; is_disabled: boolean };

/**
 * Mark order failed and patch each command row by id with status + is_disabled.
 * Optional `.eq("order_id", …)` on command updates avoids touching another order's ids.
 */
export async function markFailedOrder(
  orderId: number,
  clientId: number,
  completedCommands: ResultCommand[],
  failedCommands: ResultCommand[],
) {
  const updatedAt = new Date().toISOString();

  const { data: updatedRows, error: orderError } = await supabase
    .from("orders")
    .update({ status: "failed", updated_at: updatedAt })
    .eq("id", orderId)
    .eq("client_id", clientId)
    .select("id");

  if (orderError || !updatedRows?.length) {
    return false;
  }

  for (const command of completedCommands) {
    const { error } = await supabase
      .from("order_command")
      .update({
        status: "completed",
        is_disabled: command.is_disabled,
        updated_at: updatedAt,
      })
      .eq("id", command.id)
      .eq("order_id", orderId);

    if (error) {
      return false;
    }
  }

  for (const command of failedCommands) {
    const { error } = await supabase
      .from("order_command")
      .update({
        status: "failed",
        is_disabled: command.is_disabled,
        updated_at: updatedAt,
      })
      .eq("id", command.id)
      .eq("order_id", orderId);

    if (error) {
      return false;
    }
  }

  return true;
}
