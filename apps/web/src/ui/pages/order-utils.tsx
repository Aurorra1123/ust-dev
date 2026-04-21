import type { OrderDetailResponse, OrderStatus } from "@campusbook/shared-types";

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
    return `${firstSlot.resourceName} · ${order.sportsReservationSlots
      .map((slot) => slot.resourceUnitName)
      .join(" / ")}`;
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
    const unitNames = Array.from(
      new Set(order.sportsReservationSlots.map((slot) => slot.resourceUnitName))
    );
    return `${firstSlot.resourceName} · ${unitNames.join(" / ")}`;
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
    const sortedSlots = [...order.sportsReservationSlots].sort(
      (left, right) =>
        new Date(left.slotStart).getTime() - new Date(right.slotStart).getTime()
    );
    return `${formatDateTime(sortedSlots[0]?.slotStart)} - ${formatDateTime(
      sortedSlots[sortedSlots.length - 1]?.slotEnd
    )}`;
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
    return [...order.sportsReservationSlots]
      .sort(
        (left, right) =>
          new Date(left.slotEnd).getTime() - new Date(right.slotEnd).getTime()
      )
      .map((slot) => new Date(slot.slotEnd))
      .pop() ?? null;
  }

  return null;
}
