"use client";

import { useState } from "react";
import { AddBurgerModal, Navbar, Receipt } from "@/components";

type Order = {
  id: string;
  item: string;
  status: "In Progress" | "Ready" | "Queued";
  ingredients: string[];
};

type BurgerFormValues = {
  id: string;
  item: string;
  ingredients: string[];
};

const initialOrders: Order[] = [
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
];

const normalizeQrValue = (value: string) => value.replace(/^qr\s*#?\s*/i, "").trim();

const getNextAvailableOrderId = (orders: Order[]) => {
  const numericIds = orders
    .map((order) => Number.parseInt(order.id, 10))
    .filter((id) => Number.isFinite(id));

  const currentMax = numericIds.length > 0 ? Math.max(...numericIds) : 1000;
  return String(currentMax + 1);
};

const getSafeOrderId = (orders: Order[], desiredId: string, excludedId?: string) => {
  const normalizedId = normalizeQrValue(desiredId);
  const takenIds = new Set(orders.filter((order) => order.id !== excludedId).map((order) => order.id));

  if (normalizedId && !takenIds.has(normalizedId)) {
    return normalizedId;
  }

  let nextId = getNextAvailableOrderId(orders);
  while (takenIds.has(nextId)) {
    nextId = String(Number.parseInt(nextId, 10) + 1);
  }

  return nextId;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [isAddBurgerModalOpen, setIsAddBurgerModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const selectedOrder = orders.find((order) => order.id === selectedOrderId);

  const closeModal = () => {
    setIsAddBurgerModalOpen(false);
    setSelectedOrderId(null);
  };

  const handleCreate = (values: BurgerFormValues) => {
    setOrders((currentOrders) => [
      ...currentOrders,
      {
        id: getSafeOrderId(currentOrders, values.id),
        item: values.item,
        status: "Queued",
        ingredients: values.ingredients,
      },
    ]);
  };

  const handleUpdate = (values: BurgerFormValues) => {
    if (!selectedOrderId) {
      return;
    }

    setOrders((currentOrders) => {
      const nextId = getSafeOrderId(currentOrders, values.id, selectedOrderId);

      return currentOrders.map((order) =>
        order.id === selectedOrderId
          ? {
              ...order,
              id: nextId,
              item: values.item,
              ingredients: values.ingredients,
            }
          : order,
      );
    });
  };

  const handleDelete = () => {
    if (!selectedOrderId) {
      return;
    }

    setOrders((currentOrders) => currentOrders.filter((order) => order.id !== selectedOrderId));
  };

  return (
    <main className="min-h-screen bg-white px-6 py-8 text-zinc-900 lg:px-10">
      <div className="mx-auto flex w-full max-w-[96rem] flex-col gap-8">
        <Navbar
          onBuildBurgerClick={() => {
            setModalMode("create");
            setSelectedOrderId(null);
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
              onEdit={(id) => {
                setModalMode("edit");
                setSelectedOrderId(id);
                setIsAddBurgerModalOpen(true);
              }}
            />
          ))}
        </section>
      </div>

      <AddBurgerModal
        isOpen={isAddBurgerModalOpen}
        mode={modalMode}
        initialValues={
          modalMode === "edit" && selectedOrder
            ? {
                id: selectedOrder.id,
                item: selectedOrder.item,
                ingredients: selectedOrder.ingredients,
              }
            : undefined
        }
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onClose={closeModal}
      />
    </main>
  );
}
