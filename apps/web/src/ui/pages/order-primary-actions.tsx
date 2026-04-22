import { Link } from "react-router-dom";

import type { AuthUser, OrderDetailResponse } from "@campusbook/shared-types";

import { localeText } from "../../lib/locale";
import { buildRebookPath, canCancel, canCheckIn } from "./order-utils";

export function OrderPrimaryActions({
  locale,
  order,
  userId,
  userRole,
  latestPaymentStatus,
  isCancelPending,
  isCheckInPending,
  isMockPaymentPending,
  onCancel,
  onCheckIn,
  onMockPay
}: {
  locale: "zh-CN" | "en";
  order: OrderDetailResponse;
  userId?: string;
  userRole?: AuthUser["role"];
  latestPaymentStatus?: OrderDetailResponse["paymentRecords"][number]["payStatus"];
  isCancelPending: boolean;
  isCheckInPending: boolean;
  isMockPaymentPending: boolean;
  onCancel: () => void;
  onCheckIn: () => void;
  onMockPay: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {canCheckIn(order, userId) ? (
        <button
          type="button"
          className="rounded-full border border-moss/25 px-4 py-2 text-sm text-moss transition hover:bg-moss/10"
          onClick={onCheckIn}
          disabled={isCheckInPending}
        >
          {isCheckInPending
            ? localeText(locale, "签到中", "Checking In")
            : localeText(locale, "确认预约", "Check In")}
        </button>
      ) : null}
      {canCancel(order, userId, userRole) ? (
        <button
          type="button"
          className="rounded-full border border-danger/25 px-4 py-2 text-sm text-danger transition hover:bg-danger/10"
          onClick={onCancel}
          disabled={isCancelPending}
        >
          {isCancelPending
            ? localeText(locale, "取消中", "Cancelling")
            : localeText(locale, "取消预约", "Cancel Order")}
        </button>
      ) : null}
      {order.status === "pending_confirmation" &&
      order.totalAmountCents > 0 &&
      latestPaymentStatus === "pending" ? (
        <button
          type="button"
          className="rounded-full bg-ember px-4 py-2 text-sm text-white transition hover:bg-ember/90 disabled:cursor-not-allowed disabled:bg-ember/50"
          onClick={onMockPay}
          disabled={isMockPaymentPending}
        >
          {isMockPaymentPending
            ? localeText(locale, "支付中", "Paying")
            : localeText(locale, "模拟支付", "Mock Pay")}
        </button>
      ) : null}
      <Link
        to={buildRebookPath(order)}
        className="rounded-full border border-navy/10 px-4 py-2 text-sm text-ink transition hover:border-moss"
      >
        {localeText(locale, "重新预约", "Book Again")}
      </Link>
    </div>
  );
}
