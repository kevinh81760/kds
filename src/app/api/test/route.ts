import { getOrderForPi } from "@/lib/db/orders";

export async function GET() {
  const trayNumber = 32; // change this to a tray_number that exists in Supabase

  const order = await getOrderForPi(trayNumber);

  return Response.json(order);
}