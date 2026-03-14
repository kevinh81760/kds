import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type DeleteOrderRequestBody = {
  orderId?: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey)
    : null;

export async function DELETE(req: Request) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY." },
        { status: 500 },
      );
    }

    const body = (await req.json()) as DeleteOrderRequestBody;
    const normalizedOrderId = body.orderId?.trim();
    const parsedOrderId = Number.parseInt(normalizedOrderId ?? "", 10);

    if (!normalizedOrderId || !Number.isFinite(parsedOrderId)) {
      return NextResponse.json({ error: "Missing or invalid orderId." }, { status: 400 });
    }

    const { data: existingOrder, error: findError } = await supabase
      .from("orders")
      .select("id, sync_id")
      .eq("sync_id", parsedOrderId)
      .maybeSingle();

    if (findError) {
      return NextResponse.json({ error: findError.message }, { status: 500 });
    }

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const { error: deleteError } = await supabase.from("orders").delete().eq("id", existingOrder.id);
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, orderId: normalizedOrderId });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown server error",
      },
      { status: 500 },
    );
  }
}
