import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey)
    : null;

export async function getOrderByTrayNumber(trayNumber: number) {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("tray_number", trayNumber)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function getCommandsByOrderId(orderId: number) {
  if (!supabase) {
    return [];
  }

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

export async function getOrderForPi(trayNumber: number) {
  const order = await getOrderByTrayNumber(trayNumber);

  if (!order) {
    return null;
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