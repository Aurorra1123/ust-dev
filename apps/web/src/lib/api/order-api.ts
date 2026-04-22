import type {
  MockPaymentCallbackRequest,
  MockPaymentStartResponse,
  OrderDetailResponse,
  PaymentRecordDetail,
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

export function fetchOrderPayment(orderId: string) {
  return requestJson<PaymentRecordDetail | null>(`/payments/orders/${orderId}`);
}

export function startMockPayment(orderId: string) {
  return requestJson<MockPaymentStartResponse>(`/payments/orders/${orderId}/mock`, {
    method: "POST"
  });
}

export function confirmMockPayment(payload: MockPaymentCallbackRequest) {
  return requestJson<OrderDetailResponse>("/payments/mock/callback", {
    method: "POST",
    body: payload
  });
}
