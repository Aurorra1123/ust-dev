import type { ServiceRequestStatus } from "@campusbook/shared-types";

import { localeText } from "../../lib/locale";
import type { Locale } from "../../store/locale-store";

const serviceRequestStatusOrder: ServiceRequestStatus[] = [
  "submitted",
  "received",
  "in_progress",
  "resolved",
  "closed"
];

export function serviceRequestStatusLabel(
  status: ServiceRequestStatus,
  locale: Locale
) {
  switch (status) {
    case "submitted":
      return localeText(locale, "待受理", "Submitted");
    case "received":
      return localeText(locale, "已接收", "Received");
    case "in_progress":
      return localeText(locale, "处理中", "In Progress");
    case "resolved":
      return localeText(locale, "已解决", "Resolved");
    case "closed":
      return localeText(locale, "已关闭", "Closed");
  }
}

export function serviceRequestStatusTone(status: ServiceRequestStatus) {
  switch (status) {
    case "resolved":
    case "closed":
      return "success" as const;
    case "submitted":
      return "brand" as const;
    case "received":
    case "in_progress":
      return "neutral" as const;
  }
}

export function serviceRequestStatusOptions(locale: Locale) {
  return serviceRequestStatusOrder.map((status) => ({
    value: status,
    label: serviceRequestStatusLabel(status, locale)
  }));
}
