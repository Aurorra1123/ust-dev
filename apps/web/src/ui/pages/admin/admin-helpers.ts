import type {
  NotificationStatus,
  ResourceChannelStatus,
  ResourceReleaseFrequency,
  ResourceType,
  RuleType,
  ServiceRequestStatus
} from "@campusbook/shared-types";

import { localeText } from "../../../lib/locale";
import type { Locale } from "../../../store/locale-store";

export type WorkspaceTab =
  | "overview"
  | "resources"
  | "activities"
  | "rules"
  | "notifications"
  | "serviceRequests";

export function workspaceTabLabel(tab: WorkspaceTab, locale: Locale) {
  switch (tab) {
    case "overview":
      return localeText(locale, "运营总览", "Operations Overview");
    case "resources":
      return localeText(locale, "资源工作区", "Resource Workspace");
    case "activities":
      return localeText(locale, "活动工作区", "Activity Workspace");
    case "rules":
      return localeText(locale, "规则工作区", "Rule Workspace");
    case "notifications":
      return localeText(locale, "通知工作区", "Notification Workspace");
    case "serviceRequests":
      return localeText(locale, "工单工作区", "Service Request Workspace");
  }
}

export function weekDayOptions(locale: Locale) {
  return [
    { value: 1, label: localeText(locale, "每周一", "Monday") },
    { value: 2, label: localeText(locale, "每周二", "Tuesday") },
    { value: 3, label: localeText(locale, "每周三", "Wednesday") },
    { value: 4, label: localeText(locale, "每周四", "Thursday") },
    { value: 5, label: localeText(locale, "每周五", "Friday") },
    { value: 6, label: localeText(locale, "每周六", "Saturday") },
    { value: 0, label: localeText(locale, "每周日", "Sunday") }
  ];
}

export function releaseFrequencyLabel(
  frequency: ResourceReleaseFrequency,
  locale: Locale
) {
  switch (frequency) {
    case "daily":
      return localeText(locale, "每日放号", "Daily release");
    case "weekly":
      return localeText(locale, "每周放号", "Weekly release");
    case "monthly":
      return localeText(locale, "每月放号", "Monthly release");
  }
}

export function describeReleaseRule(
  rule: {
    frequency: ResourceReleaseFrequency;
    dayOfWeek: number | null;
    dayOfMonth: number | null;
    hour: number;
    minute: number;
  },
  locale: Locale
) {
  const time = `${String(rule.hour).padStart(2, "0")}:${String(rule.minute).padStart(2, "0")}`;

  switch (rule.frequency) {
    case "daily":
      return localeText(locale, `每天 ${time} 放号`, `Release daily at ${time}`);
    case "weekly":
      return localeText(
        locale,
        `${weekDayOptions(locale).find((item) => item.value === rule.dayOfWeek)?.label ?? "每周"} ${time} 放号`,
        `Release on ${weekDayOptions(locale).find((item) => item.value === rule.dayOfWeek)?.label ?? "weekly"} at ${time}`
      );
    case "monthly":
      return localeText(
        locale,
        `每月 ${rule.dayOfMonth ?? 1} 日 ${time} 放号`,
        `Release on day ${rule.dayOfMonth ?? 1} at ${time}`
      );
  }
}

export function channelStatusTone(status: ResourceChannelStatus) {
  switch (status) {
    case "open":
      return "success" as const;
    case "closed":
      return "danger" as const;
    case "scheduled":
      return "brand" as const;
  }
}

export function channelStatusLabel(
  status: ResourceChannelStatus,
  locale: Locale
) {
  switch (status) {
    case "open":
      return localeText(locale, "可预约", "Open");
    case "closed":
      return localeText(locale, "已关闭", "Closed");
    case "scheduled":
      return localeText(locale, "待放号", "Scheduled");
  }
}

export function orderStatusLabel(
  status: "pending_confirmation" | "confirmed" | "cancelled" | "no_show",
  locale: Locale
) {
  switch (status) {
    case "pending_confirmation":
      return localeText(locale, "待确认", "Pending");
    case "confirmed":
      return localeText(locale, "已确认", "Confirmed");
    case "cancelled":
      return localeText(locale, "已取消", "Cancelled");
    case "no_show":
      return localeText(locale, "已爽约", "No-show");
  }
}

export function resourceTypeLabel(type: ResourceType) {
  return type === "academic_space" ? "学术空间" : "体育设施";
}

export function activityStatusLabel(
  status: "draft" | "published" | "closed" | "cancelled"
) {
  switch (status) {
    case "draft":
      return "草稿";
    case "published":
      return "已发布";
    case "closed":
      return "已关闭";
    case "cancelled":
      return "已取消";
  }
}

export function ruleTypeLabel(ruleType: RuleType) {
  switch (ruleType) {
    case "min_credit_score":
      return "最低信用分";
    case "max_duration_minutes":
      return "最长预约时长";
    case "allowed_user_roles":
      return "允许用户角色";
  }
}

export function notificationStatusLabel(
  status: NotificationStatus,
  locale: Locale
) {
  switch (status) {
    case "draft":
      return localeText(locale, "草稿", "Draft");
    case "published":
      return localeText(locale, "已发布", "Published");
  }
}

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
