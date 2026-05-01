import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { DbCommand, DbOrderCommand } from "@/types/command";
import type { DbOrder } from "@/types/order";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey)
    : null;

export async function POST() {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY." },
        { status: 500 },
      );
    }

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id, status, burger_name, tray_number")
      .in("status", ["pending", "running"])
      .order("created_at", { ascending: true });

    if (ordersError) {
      return NextResponse.json({ error: ordersError.message }, { status: 500 });
    }

    const typedOrders = (orders ?? []) as DbOrder[];
    if (typedOrders.length === 0) {
      return NextResponse.json({ success: true, orders: [] });
    }

    const internalOrderIds = typedOrders.map((order) => order.id);
    const { data: orderCommands, error: orderCommandsError } = await supabase
      .from("order_command")
      .select("id, order_id, command_code, command_level, is_disabled")
      .in("order_id", internalOrderIds)
      .order("id", { ascending: true });

    if (orderCommandsError) {
      return NextResponse.json({ error: orderCommandsError.message }, { status: 500 });
    }

    const typedCommands = (orderCommands ?? []) as DbOrderCommand[];
    const commandCodes = [...new Set(typedCommands.map((command) => command.command_code))];

    const { data: commandRows, error: commandRowsError } = await supabase
      .from("commands")
      .select("ingredient_name, command_code")
      .in("command_code", commandCodes);

    if (commandRowsError) {
      return NextResponse.json({ error: commandRowsError.message }, { status: 500 });
    }

    const typedCommandsCatalog = (commandRows ?? []) as DbCommand[];
    const ingredientByCommandCode = new Map(
      typedCommandsCatalog.map((item) => [item.command_code, item.ingredient_name]),
    );

    const commandsByOrderId = new Map<number, DbOrderCommand[]>();
    for (const command of typedCommands) {
      const current = commandsByOrderId.get(command.order_id) ?? [];
      current.push(command);
      commandsByOrderId.set(command.order_id, current);
    }

    const formattedOrders = typedOrders.map((order) => {
      const commands = commandsByOrderId.get(order.id) ?? [];
      const ingredients = commands
        .filter((command) => !command.is_disabled)
        .map((command) => ingredientByCommandCode.get(command.command_code))
        .filter((ingredient): ingredient is string => Boolean(ingredient));

      return {
        id: String(order.id),
        trayNumber:
          order.tray_number != null && Number.isFinite(Number(order.tray_number))
            ? Number(order.tray_number)
            : 0,
        item: order.burger_name?.trim() || "Custom Burger",
        status: order.status,
        ingredients,
      };
    });

    return NextResponse.json({ success: true, orders: formattedOrders });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown server error",
      },
      { status: 500 },
    );
  }
}
