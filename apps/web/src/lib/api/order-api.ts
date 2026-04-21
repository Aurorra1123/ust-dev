import type {
  OrderDetailResponse,
  ReservationCheckInResponse
} from "@campusbook/shared-types";

import { requestJson } from "../http/client";

export function fetchOrders() {
  return requestJson<OrderDetailResponse[]>("/orders");
}

export function fetchOrderDetail(orderId: string) {
  return requestJson<OrderDetailResponse>(`/orders/${orderId}`);
}

export function cancelOrder(orderId: string, reason?: string) {
  return requestJson<OrderDetailResponse>(`/orders/${orderId}/cancel`, {
    method: "POST",
    body: {
      reason
    }
  });
}

export function checkInReservation(orderId: string) {
  return requestJson<ReservationCheckInResponse>(`/reservations/${orderId}/check-in`, {
    method: "POST"
  });
}
