import type {
  ActivityListItem,
  ActivityRegistrationStatusResponse
} from "@campusbook/shared-types";

import { localeText } from "../../../lib/locale";

export function getSelectedActivity(
  activities: ActivityListItem[] | undefined,
  activityId: string | null
) {
  return activities?.find((activity) => activity.id === activityId) ?? activities?.[0] ?? null;
}

export function isActivitySoldOut(activity: ActivityListItem | null) {
  return (activity?.remainingQuota ?? 0) <= 0;
}

export function getTicketRemaining(ticket: {
  stock: number;
  reserved: number;
}) {
  return Math.max(ticket.stock - ticket.reserved, 0);
}

export function isTicketSoldOut(ticket: {
  stock: number;
  reserved: number;
}) {
  return getTicketRemaining(ticket) <= 0;
}

export function isGrabDisabled(params: {
  sessionStatus: "unknown" | "anonymous" | "authenticated";
  isPending: boolean;
  soldOut: boolean;
  ticketSoldOut: boolean;
}) {
  return (
    params.sessionStatus !== "authenticated" ||
    params.isPending ||
    params.soldOut ||
    params.ticketSoldOut
  );
}

export function activityStatusLabel(
  status: ActivityListItem["status"],
  locale: "zh-CN" | "en"
) {
  switch (status) {
    case "draft":
      return localeText(locale, "草稿", "Draft");
    case "published":
      return localeText(locale, "已发布", "Published");
    case "closed":
      return localeText(locale, "已关闭", "Closed");
    case "cancelled":
      return localeText(locale, "已取消", "Cancelled");
  }
}

export function registrationStateLabel(
  status: ActivityRegistrationStatusResponse["status"],
  locale: "zh-CN" | "en"
) {
  switch (status) {
    case "queued":
      return localeText(locale, "排队中", "Queued");
    case "pending_confirmation":
      return localeText(locale, "待确认", "Pending");
    case "confirmed":
      return localeText(locale, "已确认", "Confirmed");
    case "cancelled":
      return localeText(locale, "已取消", "Cancelled");
    case "no_show":
      return localeText(locale, "已结束", "Finished");
    case "failed":
      return localeText(locale, "失败", "Failed");
  }
}
