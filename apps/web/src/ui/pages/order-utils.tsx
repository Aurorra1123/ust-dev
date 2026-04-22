import type {
  OrderDetailResponse,
  OrderStatus,
  SportsReservationSlotDetail
} from "@campusbook/shared-types";

import { formatDateTime } from "../../lib/date";
import { localeText } from "../../lib/locale";
import type { Locale } from "../../store/locale-store";

export type OrderProgressState =
  | "pending_confirmation"
  | "confirmed"
  | "cancelled"
  | "in_progress"
  | "finished";

export function statusLabel(status: OrderStatus, locale: Locale) {
  switch (status) {
    case "pending_confirmation":
      return localeText(locale, "待确认", "Pending");
    case "confirmed":
      return localeText(locale, "已确认", "Confirmed");
    case "cancelled":
      return localeText(locale, "已取消", "Cancelled");
    case "no_show":
      return localeText(locale, "已结束", "Finished");
  }
}

export function statusTone(status: OrderStatus) {
  switch (status) {
    case "confirmed":
      return "success" as const;
    case "cancelled":
      return "danger" as const;
    default:
      return "brand" as const;
  }
}

export function bizTypeLabel(
  order: Pick<OrderDetailResponse, "bizType">,
  locale: Locale
) {
  return order.bizType === "activity_registration"
    ? localeText(locale, "校园活动", "Activity Registration")
    : localeText(locale, "资源预约", "Resource Reservation");
}

export function describeOrder(order: OrderDetailResponse, locale: Locale) {
  if (order.academicReservation) {
    return `${order.academicReservation.resourceName} · ${order.academicReservation.resourceUnitName}`;
  }

  if (order.sportsReservationSlots.length > 0) {
    const firstSlot = order.sportsReservationSlots[0];
    if (!firstSlot) {
      return localeText(locale, "体育预约", "Sports Reservation");
    }
    return `${firstSlot.resourceName} · ${getSportsUnitNames(order).join(" / ")}`;
  }

  if (order.activityRegistration) {
    return `${order.activityRegistration.activityTitle} · ${order.activityRegistration.activityTicketName}`;
  }

  return localeText(locale, "暂无业务明细", "No order details");
}

export function orderCategoryLabel(order: OrderDetailResponse, locale: Locale) {
  if (order.reservationCategory === "sports_facility") {
    return localeText(locale, "体育", "Sports");
  }

  if (order.reservationCategory === "academic_space") {
    return localeText(locale, "学术", "Study");
  }

  if (order.activityRegistration) {
    return localeText(locale, "活动", "Activity");
  }

  return localeText(locale, "其他", "Other");
}

export function orderResourceLabel(order: OrderDetailResponse, locale: Locale) {
  if (order.academicReservation) {
    return `${order.academicReservation.resourceName} · ${order.academicReservation.resourceUnitName}`;
  }

  if (order.sportsReservationSlots.length > 0) {
    const firstSlot = order.sportsReservationSlots[0];
    if (!firstSlot) {
      return localeText(locale, "体育预约", "Sports Reservation");
    }
    return `${firstSlot.resourceName} · ${getSportsUnitNames(order).join(" / ")}`;
  }

  if (order.activityRegistration) {
    return `${order.activityRegistration.activityTitle} · ${order.activityRegistration.activityTicketName}`;
  }

  return localeText(locale, "暂无资源信息", "No resource information");
}

export function orderLocationLabel(order: OrderDetailResponse, locale: Locale) {
  if (order.academicReservation) {
    return order.academicReservation.resourceName;
  }

  if (order.sportsReservationSlots.length > 0) {
    return (
      order.sportsReservationSlots[0]?.resourceName ??
      localeText(locale, "体育预约", "Sports Reservation")
    );
  }

  if (order.activityRegistration) {
    return order.activityRegistration.activityTitle;
  }

  return localeText(locale, "未设置", "Not set");
}

export function orderTimeLabel(order: OrderDetailResponse, locale: Locale) {
  if (order.academicReservation) {
    return `${formatDateTime(order.academicReservation.startTime)} - ${formatDateTime(order.academicReservation.endTime)}`;
  }

  if (order.sportsReservationSlots.length > 0) {
    return getSportsReservationTimeLabel(order.sportsReservationSlots, locale);
  }

  if (order.activityRegistration) {
    return localeText(
      locale,
      `报名时间：${formatDateTime(order.createdAt)}`,
      `Registered at: ${formatDateTime(order.createdAt)}`
    );
  }

  return localeText(locale, "未设置", "Not set");
}

export function getOrderProgressState(order: OrderDetailResponse, now = new Date()) {
  if (order.status === "cancelled") {
    return "cancelled" as const;
  }

  if (order.status === "pending_confirmation") {
    return "pending_confirmation" as const;
  }

  if (order.status === "no_show") {
    return "finished" as const;
  }

  if (order.sportsReservationSlots.length > 0) {
    const segments = getSportsReservationSegments(order.sportsReservationSlots);
    const currentTime = now.getTime();

    if (
      segments.some(
        (segment) =>
          segment.startTime.getTime() <= currentTime &&
          segment.endTime.getTime() >= currentTime
      )
    ) {
      return "in_progress" as const;
    }

    const lastSegment = segments.at(-1);
    if (lastSegment && lastSegment.endTime.getTime() < currentTime) {
      return "finished" as const;
    }

    return "confirmed" as const;
  }

  const startTime = order.reservationStartTime
    ? new Date(order.reservationStartTime)
    : null;
  const endTime = getReservationEndTime(order);

  if (startTime && endTime) {
    if (startTime.getTime() <= now.getTime() && endTime.getTime() >= now.getTime()) {
      return "in_progress" as const;
    }

    if (endTime.getTime() < now.getTime()) {
      return "finished" as const;
    }
  }

  return "confirmed" as const;
}

export function orderProgressLabel(state: OrderProgressState, locale: Locale) {
  switch (state) {
    case "cancelled":
      return localeText(locale, "已取消", "Cancelled");
    case "pending_confirmation":
      return localeText(locale, "待确认", "Pending");
    case "in_progress":
      return localeText(locale, "进行中", "In Progress");
    case "finished":
      return localeText(locale, "已结束", "Finished");
    case "confirmed":
      return localeText(locale, "已确认", "Confirmed");
  }
}

export function orderProgressTone(state: OrderProgressState) {
  switch (state) {
    case "cancelled":
      return "danger" as const;
    case "in_progress":
    case "confirmed":
      return "success" as const;
    default:
      return "brand" as const;
  }
}

export function getCancelledAt(order: OrderDetailResponse) {
  const cancelledLog = [...order.statusLogs]
    .reverse()
    .find((log) => log.toStatus === "cancelled");

  return cancelledLog?.createdAt ?? order.updatedAt;
}

export function getCancellationReason(order: OrderDetailResponse) {
  const cancelledLog = [...order.statusLogs]
    .reverse()
    .find((log) => log.toStatus === "cancelled");

  return cancelledLog?.reason ?? null;
}

export function getOrderTimelineAt(order: OrderDetailResponse) {
  return order.status === "cancelled" ? getCancelledAt(order) : order.createdAt;
}

export function buildRebookPath(order: OrderDetailResponse) {
  if (order.reservationCategory === "sports_facility") {
    return "/sports";
  }

  if (order.reservationCategory === "academic_space") {
    return "/spaces";
  }

  if (order.activityRegistration) {
    return "/activities";
  }

  return "/";
}

export function paymentStatusLabel(
  status: OrderDetailResponse["paymentRecords"][number]["payStatus"] | undefined,
  locale: "zh-CN" | "en"
) {
  switch (status) {
    case "paid":
      return localeText(locale, "已支付", "Paid");
    case "failed":
      return localeText(locale, "支付失败", "Failed");
    case "refunded":
      return localeText(locale, "已退款", "Refunded");
    case "pending":
      return localeText(locale, "待支付", "Pending");
    default:
      return localeText(locale, "未发起", "Not Started");
  }
}

export function getRemainingPaymentTime(expireAt?: string | null) {
  if (!expireAt) {
    return null;
  }

  const remainingMs = new Date(expireAt).getTime() - Date.now();

  if (remainingMs <= 0) {
    return "0m";
  }

  const totalMinutes = Math.ceil(remainingMs / (60 * 1000));

  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export function getLatestPayment(order: OrderDetailResponse | null) {
  if (!order?.paymentRecords.length) {
    return null;
  }

  return order.paymentRecords[order.paymentRecords.length - 1] ?? null;
}

export function shouldShowPaymentPanel(order: OrderDetailResponse) {
  return order.totalAmountCents > 0;
}

export function getOrderInfoCards(order: OrderDetailResponse, locale: Locale) {
  const latestPayment = getLatestPayment(order);

  return [
    {
      label: localeText(locale, "预约类别", "Category"),
      value: bizTypeLabel(order, locale)
    },
    {
      label: localeText(locale, "地点", "Location"),
      value: orderLocationLabel(order, locale)
    },
    {
      label: localeText(locale, "时间", "Time"),
      value: orderTimeLabel(order, locale)
    },
    {
      label: localeText(locale, "下单时间", "Created At"),
      value: formatDateTime(order.createdAt)
    },
    {
      label: localeText(locale, "金额", "Amount"),
      value: formatAmount(order.totalAmountCents, locale)
    },
    {
      label: localeText(locale, "订单号", "Order No."),
      value: order.orderNo
    },
    {
      label: localeText(locale, "预约人", "Reporter"),
      value: order.userEmail
    },
    {
      label: localeText(locale, "签到窗口", "Check-in Window"),
      value:
        order.checkInOpenAt && order.checkInCloseAt
          ? `${formatDateTime(order.checkInOpenAt)} - ${formatDateTime(order.checkInCloseAt)}`
          : localeText(locale, "无", "None")
    },
    {
      label: localeText(locale, "支付状态", "Payment Status"),
      value: paymentStatusLabel(latestPayment?.payStatus, locale)
    }
  ];
}

export function formatAmount(totalAmountCents: number, locale: Locale) {
  if (totalAmountCents === 0) {
    return localeText(locale, "免费", "Free");
  }

  return `¥${(totalAmountCents / 100).toFixed(2)}`;
}

export function canCancel(
  order: OrderDetailResponse,
  currentUserId?: string,
  currentUserRole?: "student" | "admin"
) {
  return (
    (currentUserRole === "admin" || order.userId === currentUserId) &&
    (order.status === "pending_confirmation" || order.status === "confirmed")
  );
}

export function canCheckIn(order: OrderDetailResponse, currentUserId?: string) {
  if (!currentUserId || order.status !== "confirmed") {
    return false;
  }

  return order.reservationParticipants.some(
    (participant) => participant.userId === currentUserId && !participant.checkedInAt
  );
}

function getReservationEndTime(order: OrderDetailResponse) {
  if (order.academicReservation) {
    return new Date(order.academicReservation.endTime);
  }

  if (order.sportsReservationSlots.length > 0) {
    return getSportsReservationSegments(order.sportsReservationSlots).at(-1)?.endTime ?? null;
  }

  return null;
}

function getSportsUnitNames(order: OrderDetailResponse) {
  return Array.from(
    new Set(order.sportsReservationSlots.map((slot) => slot.resourceUnitName))
  );
}

function getSportsReservationTimeLabel(
  slots: SportsReservationSlotDetail[],
  locale: Locale
) {
  const separator = localeText(locale, "； ", "; ");
  const segments = getSportsReservationSegments(slots);

  if (!segments.length) {
    return localeText(locale, "未设置", "Not set");
  }

  return segments
    .map(
      (segment) =>
        `${formatDateTime(segment.start)} - ${formatDateTime(segment.end)}`
    )
    .join(separator);
}

function getSportsReservationSegments(slots: SportsReservationSlotDetail[]) {
  const uniqueSlots = [...slots]
    .sort(
      (left, right) =>
        new Date(left.slotStart).getTime() - new Date(right.slotStart).getTime()
    )
    .filter(
      (slot, index, current) =>
        index === 0 ||
        slot.slotStart !== current[index - 1]?.slotStart ||
        slot.slotEnd !== current[index - 1]?.slotEnd
    );

  const segments: Array<{
    start: string;
    end: string;
    startTime: Date;
    endTime: Date;
  }> = [];

  for (const slot of uniqueSlots) {
    const slotStart = new Date(slot.slotStart);
    const slotEnd = new Date(slot.slotEnd);
    const lastSegment = segments.at(-1);

    if (
      lastSegment &&
      slotStart.getTime() <= lastSegment.endTime.getTime()
    ) {
      if (slotEnd.getTime() > lastSegment.endTime.getTime()) {
        lastSegment.end = slot.slotEnd;
        lastSegment.endTime = slotEnd;
      }
      continue;
    }

    segments.push({
      start: slot.slotStart,
      end: slot.slotEnd,
      startTime: slotStart,
      endTime: slotEnd
    });
  }

  return segments;
}
