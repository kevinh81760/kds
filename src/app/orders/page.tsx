"use client";

import { useEffect, useState } from "react";
import { AddBurgerModal, Navbar, Receipt, Skeleton } from "@/components";
import type {
  ActiveOrdersResponse,
  BurgerFormValues,
  CreateBurgerPayload,
  CreateOrderResponse,
  DeleteOrderResponse,
  Order,
} from "@/types/order";

const initialOrders: Order[] = [];

const getNextTrayNumber = (orders: Order[]) => {
  const trays = orders
    .map((order) => order.trayNumber)
    .filter((n) => Number.isFinite(n));
  const maxTray = trays.length > 0 ? Math.max(...trays) : 0;
  return maxTray + 1;
};

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

  const handleCreateBurger = async (
    payload: CreateBurgerPayload,
  ): Promise<{ orderId: string; trayNumber: number }> => {
    const response = await fetch("/api/orders/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as CreateOrderResponse;
    const resolvedOrderId =
      typeof data.orderId === "string" && data.orderId.trim()
        ? data.orderId.trim()
        : typeof data.orderId === "number" && Number.isFinite(data.orderId)
          ? String(Math.trunc(data.orderId))
          : null;

    if (!response.ok || !data.success || resolvedOrderId === null) {
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

    const resolvedTray =
      typeof data.trayNumber === "number" && Number.isFinite(data.trayNumber)
        ? data.trayNumber
        : payload.trayNumber;

    return { orderId: resolvedOrderId, trayNumber: resolvedTray };
  };

  const handleCreate = async (values: BurgerFormValues) => {
    const payload: CreateBurgerPayload = {
      burgerType: values.item,
      ingredients: values.ingredients,
      trayNumber: values.trayNumber,
    };

    const { orderId, trayNumber } = await handleCreateBurger(payload);

    setOrders((currentOrders) => [
      ...currentOrders,
      {
        id: orderId,
        trayNumber,
        item: payload.burgerType,
        status: "Queued",
        ingredients: payload.ingredients,
      },
    ]);
  };

  const handleUpdate = async (values: BurgerFormValues) => {
    if (!selectedOrderId) {
      return;
    }

    const response = await fetch("/api/orders/update", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ orderId: selectedOrderId, trayNumber: values.trayNumber }),
    });

    const data = (await response.json()) as { success?: boolean; error?: string };
    if (!response.ok || !data.success) {
      throw new Error(data.error ?? "Failed to update tray number.");
    }

    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === selectedOrderId
          ? {
              ...order,
              trayNumber: values.trayNumber,
              item: values.item,
              ingredients: values.ingredients,
            }
          : order,
      ),
    );
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
                  orderId={order.id}
                  trayNumber={order.trayNumber}
                  item={order.item}
                  ingredients={order.ingredients}
                  onEdit={(orderId) => {
                    setModalMode("edit");
                    setSelectedOrderId(orderId);
                    setIsAddBurgerModalOpen(true);
                  }}
                />
              ))}
        </section>
      </div>

      <AddBurgerModal
        isOpen={isAddBurgerModalOpen}
        mode={modalMode}
        suggestedTrayNumber={getNextTrayNumber(orders)}
        initialValues={
          modalMode === "edit" && selectedOrder
            ? {
                id: selectedOrder.id,
                trayNumber: selectedOrder.trayNumber,
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
