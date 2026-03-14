import { Navbar } from "@/components";

export default function InventoryPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-8 text-zinc-900 lg:px-10">
      <div className="mx-auto flex w-full max-w-[96rem] flex-col gap-8">
        <Navbar />
        <section className="grid grid-cols-1 gap-3 border-b border-dotted border-zinc-300 pb-4 md:grid-cols-[1fr_auto] md:items-end">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Inventory</h1>
        </section>
        <section className="rounded-xl border border-zinc-200 bg-white px-4 py-6 text-sm text-zinc-700 shadow-sm md:px-6">
          Inventory is here.
        </section>
      </div>
    </main>
  );
}
