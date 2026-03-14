"use client";

import { useEffect, useState } from "react";
import { Navbar, Skeleton } from "@/components";

type CompletedOrder = {
  id: string;
  item: string;
  ingredients: string[];
  completedAt: string;
};

type CompletedOrdersResponse = {
  success?: boolean;
  error?: string;
  orders?: CompletedOrder[];
};

const formatIngredients = (ingredients: readonly string[]) => {
  if (ingredients.length === 0) {
    return "No ingredients";
  }

  if (ingredients.length <= 2) {
    return ingredients.join(", ");
  }

  return `${ingredients[0]}, ${ingredients[1]} +${ingredients.length - 2}`;
};

const formatCompletedTime = (isoDate: string) =>
  new Date(isoDate).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

const formatCompletedDate = (isoDate: string) =>
  new Date(isoDate).toLocaleDateString([], {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
  });

const CompletedRowSkeleton = () => (
  <li className="grid grid-cols-1 gap-2 py-3 md:grid-cols-[1.1fr_1.5fr_2.5fr_1fr_0.7fr] md:items-center md:gap-4">
    <Skeleton className="h-3 w-16" tone="strong" />
    <Skeleton className="h-4 w-36" />
    <Skeleton className="h-4 w-52" tone="soft" />
    <Skeleton className="h-4 w-20" />
    <Skeleton className="h-4 w-16" tone="soft" />
  </li>
);

export default function CompletedPage() {
  const [completedOrders, setCompletedOrders] = useState<CompletedOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCompletedOrders = async () => {
      const response = await fetch("/api/orders/completed", {
        method: "POST",
      });

      const rawText = await response.text();
      let data: CompletedOrdersResponse | null = null;
      try {
        data = JSON.parse(rawText) as CompletedOrdersResponse;
      } catch {
        data = null;
      }

      if (!data) {
        throw new Error(
          `Failed to load completed orders. Non-JSON response received (status=${response.status}).`,
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Failed to load completed orders.");
      }

      setCompletedOrders(data.orders ?? []);
    };

    const loadCompletedOrders = async () => {
      try {
        await fetchCompletedOrders();
      } catch (error) {
        console.error("Load completed orders failed", error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadCompletedOrders();
  }, []);

  return (
    <main className="min-h-screen bg-white px-6 py-8 text-zinc-900 lg:px-10">
      <div className="mx-auto flex w-full max-w-[96rem] flex-col gap-8">
        <Navbar />
        <section className="grid grid-cols-1 gap-3 border-b border-dotted border-zinc-300 pb-4 md:grid-cols-[1fr_auto] md:items-end">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Completed</h1>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Total: {isLoading ? "..." : completedOrders.length}
          </p>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm md:px-6 md:py-4">
          <div className="hidden grid-cols-[1.1fr_1.5fr_2.5fr_1fr_0.7fr] items-center gap-4 border-b border-dotted border-zinc-300 pb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 md:grid">
            {isLoading ? (
              <>
                <Skeleton className="h-3 w-14" tone="soft" />
                <Skeleton className="h-3 w-12" tone="soft" />
                <Skeleton className="h-3 w-24" tone="soft" />
                <Skeleton className="h-3 w-16" tone="soft" />
                <Skeleton className="h-3 w-10" tone="soft" />
              </>
            ) : (
              <>
                <p>Order</p>
                <p>Item</p>
                <p>Ingredients</p>
                <p>Completed</p>
                <p>Date</p>
              </>
            )}
          </div>

          <ul className="divide-y divide-zinc-200/80">
            {isLoading
              ? Array.from({ length: 6 }, (_, index) => <CompletedRowSkeleton key={index} />)
              : completedOrders.map((order) => (
                  <li
                    key={order.id}
                    className="grid grid-cols-1 gap-1 py-3 text-sm text-zinc-900 md:grid-cols-[1.1fr_1.5fr_2.5fr_1fr_0.7fr] md:items-center md:gap-4"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 md:hidden">
                      QR #{order.id}
                    </p>
                    <p className="font-semibold md:font-medium">QR #{order.id}</p>
                    <p>{order.item}</p>
                    <p className="text-zinc-700">{formatIngredients(order.ingredients)}</p>
                    <p>{formatCompletedTime(order.completedAt)}</p>
                    <p>{formatCompletedDate(order.completedAt)}</p>
                  </li>
                ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
