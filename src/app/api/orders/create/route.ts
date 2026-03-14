import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type CreateOrderRequestBody = {
  orderId?: string;
  burgerType?: string;
  trayNumber?: number;
  ingredients?: string[];
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey)
    : null;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateOrderRequestBody;
    const { orderId, burgerType, trayNumber, ingredients } = body;

    const normalizedOrderId = orderId?.trim();
    const normalizedBurgerType = burgerType?.trim();
    const parsedOrderId = Number.parseInt(normalizedOrderId ?? "", 10);
    const parsedTrayNumber = Number(trayNumber);

    if (!normalizedOrderId || !Number.isFinite(parsedOrderId)) {
      return NextResponse.json({ error: "Missing or invalid orderId." }, { status: 400 });
    }

    if (!Number.isFinite(parsedTrayNumber)) {
      return NextResponse.json({ error: "Missing or invalid trayNumber." }, { status: 400 });
    }

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json({ error: "Missing ingredients." }, { status: 400 });
    }

    if (!normalizedBurgerType) {
      return NextResponse.json({ error: "Missing burgerType." }, { status: 400 });
    }

    if (!supabase) {
      return NextResponse.json(
        { error: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY." },
        { status: 500 },
      );
    }

    const { error } = await supabase.rpc("create_burger_order", {
      p_order_id: parsedOrderId,
      p_client_id: 1,
      p_sync_id: parsedOrderId,
      p_tray_number: parsedTrayNumber,
      p_selected_ingredients: ingredients,
      p_burger_name: normalizedBurgerType,
    });

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          sentParams: {
            p_order_id: parsedOrderId,
            p_client_id: 1,
            p_sync_id: parsedOrderId,
            p_tray_number: parsedTrayNumber,
            p_selected_ingredients: ingredients,
            p_burger_name: normalizedBurgerType,
          },
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      orderId: normalizedOrderId,
      burgerType: normalizedBurgerType,
      trayNumber: parsedTrayNumber,
      ingredients,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown server error",
      },
      { status: 500 },
    );
  }
}
