import type { OrderDetailResponse } from "@campusbook/shared-types";

import { formatDateTime } from "../../lib/date";
import { localeText } from "../../lib/locale";
import { getRemainingPaymentTime, paymentStatusLabel } from "./order-utils";

export function OrderPaymentPanel({
  locale,
  order
}: {
  locale: "zh-CN" | "en";
  order: OrderDetailResponse;
}) {
  const latestPayment =
    order.paymentRecords[order.paymentRecords.length - 1] ?? null;
  const remainingPaymentTime = getRemainingPaymentTime(order.expireAt);

  return (
    <div className="rounded-[24px] border border-ink/10 bg-sand px-5 py-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-ink">
            {localeText(locale, "支付信息", "Payment")}
          </h3>
          <p className="mt-2 text-sm text-slate">
            {localeText(
              locale,
              `当前状态：${paymentStatusLabel(latestPayment?.payStatus, locale)}`,
              `Current status: ${paymentStatusLabel(latestPayment?.payStatus, locale)}`
            )}
          </p>
          {order.expireAt ? (
            <p className="mt-2 text-sm text-slate">
              {localeText(
                locale,
                `待支付截止：${formatDateTime(order.expireAt)}${
                  remainingPaymentTime ? `（剩余 ${remainingPaymentTime}）` : ""
                }`,
                `Pay before ${formatDateTime(order.expireAt)}${
                  remainingPaymentTime ? ` (${remainingPaymentTime} left)` : ""
                }`
              )}
            </p>
          ) : null}
          {latestPayment?.transactionNo ? (
            <p className="mt-2 text-sm text-slate">
              {localeText(
                locale,
                `交易号：${latestPayment.transactionNo}`,
                `Transaction No.: ${latestPayment.transactionNo}`
              )}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
