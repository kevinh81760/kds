import { Navbar } from "@/components";

const completedOrders = [
  {
    order: "QR #1001",
    item: "Classic Burger",
    ingredients: "Lettuce, Tomato +4",
    completedAt: "7:42 PM",
    date: "03/13/26",
  },
  {
    order: "QR #1002",
    item: "Cheese Burger",
    ingredients: "Lettuce, Onion +3",
    completedAt: "7:45 PM",
    date: "03/13/26",
  },
  {
    order: "QR #1003",
    item: "Double Burger",
    ingredients: "Tomato, Onion +3",
    completedAt: "7:50 PM",
    date: "03/13/26",
  },
] as const;

export default function CompletedPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-8 text-zinc-900 lg:px-10">
      <div className="mx-auto flex w-full max-w-[96rem] flex-col gap-8">
        <Navbar />
        <section className="grid grid-cols-1 gap-3 border-b border-dotted border-zinc-300 pb-4 md:grid-cols-[1fr_auto] md:items-end">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Completed</h1>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Total: {completedOrders.length}
          </p>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm md:px-6 md:py-4">
          <div className="hidden grid-cols-[1.1fr_1.5fr_2.5fr_1fr_0.7fr] items-center gap-4 border-b border-dotted border-zinc-300 pb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 md:grid">
            <p>Order</p>
            <p>Item</p>
            <p>Ingredients</p>
            <p>Completed</p>
            <p>Date</p>
          </div>

          <ul className="divide-y divide-zinc-200/80">
            {completedOrders.map((order) => (
              <li
                key={order.order}
                className="grid grid-cols-1 gap-1 py-3 text-sm text-zinc-900 md:grid-cols-[1.1fr_1.5fr_2.5fr_1fr_0.7fr] md:items-center md:gap-4"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 md:hidden">
                  {order.order}
                </p>
                <p className="font-semibold md:font-medium">{order.order}</p>
                <p>{order.item}</p>
                <p className="text-zinc-700">{order.ingredients}</p>
                <p>{order.completedAt}</p>
                <p>{order.date}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
