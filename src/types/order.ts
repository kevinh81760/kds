export type OrderStatus = "In Progress" | "Ready" | "Queued";

export type Order = {
  id: string;
  trayNumber: number;
  item: string;
  status: OrderStatus;
  ingredients: string[];
};

export type CompletedOrder = {
  id: string;
  trayNumber: number;
  item: string;
  ingredients: string[];
  completedAt: string;
};

export type ActiveOrdersResponse = {
  success?: boolean;
  error?: string;
  orders?: Order[];
};

export type CompletedOrdersResponse = {
  success?: boolean;
  error?: string;
  orders?: CompletedOrder[];
};

export type DeleteOrderResponse = {
  success?: boolean;
  error?: string;
};

export type CreateOrderRequestBody = {
  burgerType?: string;
  trayNumber?: number;
  ingredients?: string[];
};

export type DeleteOrderRequestBody = {
  orderId?: string;
};

export type BurgerFormValues = {
  id: string;
  trayNumber: number;
  item: string;
  ingredients: string[];
};

export type UpdateOrderTrayRequestBody = {
  orderId?: string;
  trayNumber?: number;
};

export type CreateBurgerPayload = {
  burgerType: string;
  ingredients: string[];
  trayNumber: number;
};

export type CreateOrderSuccessBody = {
  success: true;
  orderId: string;
  burgerType: string;
  trayNumber: number;
  ingredients: string[];
};

export type CreateOrderResponse = {
  success?: boolean;
  error?: string;
  orderId?: string | number;
  burgerType?: string;
  trayNumber?: number;
  ingredients?: string[];
  code?: string;
  details?: string;
  hint?: string;
  sentParams?: unknown;
};

export type DbOrder = {
  id: number;
  status: number;
  burger_name: string | null;
  tray_number: number | null;
};

export type DbCompletedOrder = {
  id: number;
  burger_name: string | null;
  tray_number: number | null;
  updated_at: string;
};

export function mapStatusToUi(status: number): OrderStatus {
  if (status === 2) {
    return "In Progress";
  }

  if (status === 3) {
    return "Ready";
  }

  return "Queued";
}
