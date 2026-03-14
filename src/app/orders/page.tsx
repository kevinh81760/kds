"use client";

import { useState } from "react";
import { AddBurgerModal, Navbar, Receipt } from "@/components";

const orders = [
  {
    id: "1001",
    item: "Classic Burger",
    status: "In Progress",
    ingredients: ["Lettuce", "Tomatoes", "Onions", "Pickles", "Gochujang", "Ketchup"],
  },
  {
    id: "1002",
    item: "Cheese Burger",
    status: "Ready",
    ingredients: ["Lettuce", "Onions", "Pickles", "American Cheese", "Ketchup"],
  },
  {
    id: "1003",
    item: "Double Burger",
    status: "Ready",
    ingredients: ["Tomatoes", "Onions", "Pickles", "Gochujang", "Ketchup"],
  },
  {
    id: "1004",
    item: "Veggie Burger",
    status: "In Progress",
    ingredients: ["Lettuce", "Tomatoes", "Onions", "Pickles", "Vegan Aioli"],
  },
  {
    id: "1005",
    item: "Bacon Burger",
    status: "Ready",
    ingredients: ["Lettuce", "Tomatoes", "Onions", "Pickles", "Bacon", "Ketchup"],
  },
  {
    id: "1006",
    item: "BBQ Burger",
    status: "Queued",
    ingredients: ["Lettuce", "Onions", "Pickles", "Cheddar", "BBQ Sauce"],
  },
] as const;

export default function OrdersPage() {
  const [isAddBurgerModalOpen, setIsAddBurgerModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");

  return (
    <main className="min-h-screen bg-white px-6 py-8 text-zinc-900 lg:px-10">
      <div className="mx-auto flex w-full max-w-[96rem] flex-col gap-8">
        <Navbar
          onBuildBurgerClick={() => {
            setModalMode("create");
            setIsAddBurgerModalOpen(true);
          }}
        />
        <section className="grid grid-cols-1 gap-3 border-b border-zinc-200 pb-4 md:grid-cols-[1fr_auto] md:items-end">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Orders</h1>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Active Tickets: {orders.length}
          </p>
        </section>

        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {orders.map((order) => (
            <Receipt
              key={order.id}
              id={order.id}
              item={order.item}
              status={order.status}
              ingredients={order.ingredients}
              onEdit={() => {
                setModalMode("edit");
                setIsAddBurgerModalOpen(true);
              }}
            />
          ))}
        </section>
      </div>

      <AddBurgerModal
        isOpen={isAddBurgerModalOpen}
        mode={modalMode}
        onClose={() => setIsAddBurgerModalOpen(false)}
      />
    </main>
  );
}
