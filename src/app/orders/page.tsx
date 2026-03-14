"use client";

import { useEffect, useState } from "react";
import { AddBurgerModal, Navbar, Receipt, Skeleton } from "@/components";

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

type CreateBurgerPayload = {
  orderId: string;
  burgerType: string;
  ingredients: string[];
  trayNumber: number;
};

type ActiveOrdersResponse = {
  success?: boolean;
  error?: string;
  orders?: Order[];
};

type DeleteOrderResponse = {
  success?: boolean;
  error?: string;
};

const initialOrders: Order[] = [];

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

const getNextTrayNumber = (orders: Order[]) => orders.length + 1;

const OrderReceiptSkeleton = () => (
  <article
    className="grid min-h-70 h-full grid-rows-[auto_auto_1fr] gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
  >
    <div className="grid grid-cols-[1fr_auto] items-start gap-3">
      <Skeleton className="h-3 w-22" tone="strong" />
      <Skeleton className="h-7 w-12 rounded-md" />
    </div>
    <div className="space-y-3">
      <Skeleton className="h-6 w-4/5" tone="strong" />
      <Skeleton className="h-3 w-2/5" tone="soft" />
    </div>
    <div className="border-t border-dotted border-zinc-300 pt-3">
      <Skeleton className="h-3 w-24" tone="soft" />
      <div className="mt-3 space-y-2">
        <Skeleton className="h-3 w-10/12" />
        <Skeleton className="h-3 w-8/12" tone="soft" />
        <Skeleton className="h-3 w-9/12" />
        <Skeleton className="h-3 w-7/12" tone="soft" />
      </div>
    </div>
  </article>
);

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddBurgerModalOpen, setIsAddBurgerModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const selectedOrder = orders.find((order) => order.id === selectedOrderId);

  const fetchActiveOrders = async () => {
    const response = await fetch("/api/orders/active", {
      method: "POST",
    });

    const rawText = await response.text();
    let data: ActiveOrdersResponse | null = null;
    try {
      data = JSON.parse(rawText) as ActiveOrdersResponse;
    } catch {
      data = null;
    }

    if (!data) {
      throw new Error(
        `Failed to load active orders. Non-JSON response received (status=${response.status}).`,
      );
    }

    if (!response.ok || !data.success) {
      throw new Error(data.error ?? "Failed to load active orders.");
    }

    setOrders(data.orders ?? []);
  };

  const closeModal = () => {
    setIsAddBurgerModalOpen(false);
    setSelectedOrderId(null);
  };

  useEffect(() => {
    const loadActiveOrders = async () => {
      try {
        await fetchActiveOrders();
      } catch (error) {
        console.error("Load active orders failed", error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadActiveOrders();
  }, []);

  const handleCreateBurger = async (payload: CreateBurgerPayload) => {
    const response = await fetch("/api/orders/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as {
      error?: string;
      success?: boolean;
      code?: string;
      details?: string;
      hint?: string;
      sentParams?: unknown;
    };
    if (!response.ok || !data.success) {
      const debugMessage = [
        data.error ?? "Failed to create burger order.",
        data.code ? `code=${data.code}` : null,
        data.details ? `details=${data.details}` : null,
        data.hint ? `hint=${data.hint}` : null,
      ]
        .filter(Boolean)
        .join(" | ");

      throw new Error(debugMessage);
    }
  };

  const handleCreate = async (values: BurgerFormValues) => {
    const payload: CreateBurgerPayload = {
      orderId: getSafeOrderId(orders, values.id),
      burgerType: values.item,
      ingredients: values.ingredients,
      trayNumber: getNextTrayNumber(orders),
    };

    await handleCreateBurger(payload);
    setOrders((currentOrders) => [
      ...currentOrders,
      {
        id: payload.orderId,
        item: payload.burgerType,
        status: "Queued",
        ingredients: payload.ingredients,
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

  const handleDelete = async () => {
    if (!selectedOrderId) {
      return;
    }

    const response = await fetch("/api/orders/delete", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ orderId: selectedOrderId }),
    });

    const data = (await response.json()) as DeleteOrderResponse;
    if (!response.ok || !data.success) {
      throw new Error(data.error ?? "Failed to delete order.");
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
            Active Tickets: {isLoading ? "..." : orders.length}
          </p>
        </section>

        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {isLoading
            ? Array.from({ length: 6 }, (_, index) => <OrderReceiptSkeleton key={index} />)
            : orders.map((order) => (
                <Receipt
                  key={order.id}
                  id={order.id}
                  item={order.item}
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
