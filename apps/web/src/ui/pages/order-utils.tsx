import type { OrderDetailResponse, OrderStatus } from "@campusbook/shared-types";

import { formatDateTime } from "../../lib/date";

export function statusLabel(status: OrderStatus) {
  switch (status) {
    case "pending_confirmation":
      return "待确认";
    case "confirmed":
      return "已确认";
    case "cancelled":
      return "已取消";
    case "no_show":
      return "已结束";
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

export function bizTypeLabel(order: Pick<OrderDetailResponse, "bizType">) {
  return order.bizType === "activity_registration" ? "校园活动" : "资源预约";
}

export function describeOrder(order: OrderDetailResponse) {
  if (order.academicReservation) {
    return `${order.academicReservation.resourceName} · ${order.academicReservation.resourceUnitName}`;
  }

  if (order.sportsReservationSlots.length > 0) {
    const firstSlot = order.sportsReservationSlots[0];
    if (!firstSlot) {
      return "体育预约";
    }
    return `${firstSlot.resourceName} · ${order.sportsReservationSlots
      .map((slot) => slot.resourceUnitName)
      .join(" / ")}`;
  }

  if (order.activityRegistration) {
    return `${order.activityRegistration.activityTitle} · ${order.activityRegistration.activityTicketName}`;
  }

  return "暂无业务明细";
}

export function orderCategoryLabel(order: OrderDetailResponse) {
  if (order.reservationCategory === "sports_facility") {
    return "体育";
  }

  if (order.reservationCategory === "academic_space") {
    return "学术";
  }

  if (order.activityRegistration) {
    return "活动";
  }

  return "其他";
}

export function orderResourceLabel(order: OrderDetailResponse) {
  if (order.academicReservation) {
    return `${order.academicReservation.resourceName} · ${order.academicReservation.resourceUnitName}`;
  }

  if (order.sportsReservationSlots.length > 0) {
    const firstSlot = order.sportsReservationSlots[0];
    if (!firstSlot) {
      return "体育预约";
    }
    const unitNames = Array.from(
      new Set(order.sportsReservationSlots.map((slot) => slot.resourceUnitName))
    );
    return `${firstSlot.resourceName} · ${unitNames.join(" / ")}`;
  }

  if (order.activityRegistration) {
    return `${order.activityRegistration.activityTitle} · ${order.activityRegistration.activityTicketName}`;
  }

  return "暂无资源信息";
}

export function orderLocationLabel(order: OrderDetailResponse) {
  if (order.academicReservation) {
    return order.academicReservation.resourceName;
  }

  if (order.sportsReservationSlots.length > 0) {
    return order.sportsReservationSlots[0]?.resourceName ?? "体育预约";
  }

  if (order.activityRegistration) {
    return order.activityRegistration.activityTitle;
  }

  return "未设置";
}

export function orderTimeLabel(order: OrderDetailResponse) {
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
    return `报名时间：${formatDateTime(order.createdAt)}`;
  }

  return "未设置";
}

export function orderProgressLabel(order: OrderDetailResponse, now = new Date()) {
  if (order.status === "cancelled") {
    return "已取消";
  }

  if (order.status === "pending_confirmation") {
    return "待确认";
  }

  if (order.status === "no_show") {
    return "已结束";
  }

  const startTime = order.reservationStartTime
    ? new Date(order.reservationStartTime)
    : null;
  const endTime = getReservationEndTime(order);

  if (startTime && endTime) {
    if (startTime.getTime() <= now.getTime() && endTime.getTime() >= now.getTime()) {
      return "进行中";
    }

    if (endTime.getTime() < now.getTime()) {
      return "已结束";
    }
  }

  return "已确认";
}

export function orderProgressTone(label: string) {
  switch (label) {
    case "已取消":
      return "danger" as const;
    case "进行中":
    case "已确认":
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

  return cancelledLog?.reason ?? "未记录备注";
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

export function formatAmount(totalAmountCents: number) {
  if (totalAmountCents === 0) {
    return "免费";
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
