import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type DbOrder = {
  id: number;
  sync_id: number;
  status: number;
  burger_name: string | null;
};

type DbOrderCommand = {
  id: number;
  order_id: number;
  command_code: string;
};

type DbIngredientMap = {
  ingredient_name: string;
  command_code: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey)
    : null;

const mapStatusToUi = (status: number): "Queued" | "In Progress" | "Ready" => {
  if (status === 2) {
    return "In Progress";
  }

  if (status === 3) {
    return "Ready";
  }

  return "Queued";
};

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
      .select("id, sync_id, status, burger_name")
      .in("status", [1, 2])
      .order("created_at", { ascending: false });

    if (ordersError) {
      return NextResponse.json({ error: ordersError.message }, { status: 500 });
    }

    const typedOrders = (orders ?? []) as DbOrder[];
    if (typedOrders.length === 0) {
      return NextResponse.json({ success: true, orders: [] });
    }

    const internalOrderIds = typedOrders.map((order) => order.id);
    const { data: orderCommands, error: orderCommandsError } = await supabase
      .from("order_commands")
      .select("id, order_id, command_code")
      .in("order_id", internalOrderIds)
      .order("id", { ascending: true });

    if (orderCommandsError) {
      return NextResponse.json({ error: orderCommandsError.message }, { status: 500 });
    }

    const typedCommands = (orderCommands ?? []) as DbOrderCommand[];
    const commandCodes = [...new Set(typedCommands.map((command) => command.command_code))];

    const { data: ingredientMaps, error: ingredientMapsError } = await supabase
      .from("ingredient_command_map")
      .select("ingredient_name, command_code")
      .in("command_code", commandCodes);

    if (ingredientMapsError) {
      return NextResponse.json({ error: ingredientMapsError.message }, { status: 500 });
    }

    const typedIngredientMaps = (ingredientMaps ?? []) as DbIngredientMap[];
    const ingredientByCommandCode = new Map(
      typedIngredientMaps.map((item) => [item.command_code, item.ingredient_name]),
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
        .map((command) => ingredientByCommandCode.get(command.command_code))
        .filter((ingredient): ingredient is string => Boolean(ingredient));

      return {
        id: String(order.sync_id),
        item: order.burger_name?.trim() || "Custom Burger",
        status: mapStatusToUi(order.status),
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
