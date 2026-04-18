export const ORDER_EXPIRATION_QUEUE_NAME = "order-expiration";
export const ORDER_EXPIRATION_JOB_NAME = "expire-pending-order";

export interface OrderExpirationJobPayload {
  orderId: string;
}
