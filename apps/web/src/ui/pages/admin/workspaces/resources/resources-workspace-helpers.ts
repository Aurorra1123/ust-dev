import type {
  AdminResourceDetailResponse,
  ResourceReleaseFrequency,
  ResourceType
} from "@campusbook/shared-types";

import { addHours, startOfNextHour, toDateTimeLocalValue } from "../../../../../lib/date";
import { getErrorCode, getErrorMessage } from "../../../../../lib/http/errors";
import { localeText } from "../../../../../lib/locale";
import type { Locale } from "../../../../../store/locale-store";

export type ResourceFormState = {
  type: ResourceType;
  code: string;
  name: string;
  description: string;
  location: string;
  status: "active" | "inactive";
};

export type ResourceUnitFormState = {
  code: string;
  name: string;
  unitType: string;
  availabilityMode: "continuous" | "discrete_slot";
  capacity: number;
};

export type ReleaseRuleFormState = {
  frequency: ResourceReleaseFrequency;
  dayOfWeek: number;
  dayOfMonth: number;
  hour: number;
  minute: number;
};

export type BookingClosureFormState = {
  startsAt: string;
  endsAt: string;
  reason: string;
  indefinite: boolean;
};

export type StatusWindowState = {
  from: string;
  to: string;
};

export type AcademicAreaGroup = {
  key: string;
  label: string;
  resources: AdminResourceDetailResponse[];
};

export function createDefaultResourceFormState(
  type: ResourceType = "academic_space"
): ResourceFormState {
  return {
    type,
    code: "",
    name: "",
    description: "",
    location: "",
    status: "active"
  };
}

export function createDefaultResourceUnitFormState(): ResourceUnitFormState {
  return {
    code: "",
    name: "",
    unitType: "room",
    availabilityMode: "continuous",
    capacity: 8
  };
}

export function alignResourceUnitFormToResource(
  current: ResourceUnitFormState,
  resource: AdminResourceDetailResponse
): ResourceUnitFormState {
  return {
    ...current,
    availabilityMode:
      resource.type === "academic_space" ? "continuous" : "discrete_slot",
    unitType: resource.type === "academic_space" ? "room" : "court"
  };
}

export function createDefaultReleaseRuleFormState(): ReleaseRuleFormState {
  return {
    frequency: "daily",
    dayOfWeek: 1,
    dayOfMonth: 1,
    hour: 8,
    minute: 0
  };
}

export function createDefaultBookingClosureFormState(): BookingClosureFormState {
  const startsAt = startOfNextHour();
  const endsAt = addHours(startsAt, 2);

  return {
    startsAt: toDateTimeLocalValue(startsAt),
    endsAt: toDateTimeLocalValue(endsAt),
    reason: "",
    indefinite: false
  };
}

export function createDefaultStatusWindow(): StatusWindowState {
  const from = startOfNextHour();
  const to = addHours(from, 24);

  return {
    from: toDateTimeLocalValue(from),
    to: toDateTimeLocalValue(to)
  };
}

export function extractAcademicAreaKey(resourceCode: string) {
  const normalizedCode = resourceCode.trim().toUpperCase();
  const matched = normalizedCode.match(/^(E\d+)/);

  return matched?.[1] ?? "ungrouped";
}

export function buildAcademicAreaGroups(
  resources: AdminResourceDetailResponse[],
  locale: Locale
): AcademicAreaGroup[] {
  const groups = new Map<string, AdminResourceDetailResponse[]>();

  for (const resource of resources) {
    const key = extractAcademicAreaKey(resource.code);
    const current = groups.get(key) ?? [];
    current.push(resource);
    groups.set(key, current);
  }

  return [...groups.entries()]
    .sort(([leftKey], [rightKey]) => {
      if (leftKey === "ungrouped") {
        return 1;
      }

      if (rightKey === "ungrouped") {
        return -1;
      }

      return leftKey.localeCompare(rightKey, undefined, { numeric: true });
    })
    .map(([key, groupedResources]) => ({
      key,
      label:
        key === "ungrouped"
          ? localeText(locale, "未分区", "Ungrouped")
          : localeText(locale, `${key} 区`, `${key} Area`),
      resources: groupedResources
    }));
}

export function formatResourceMutationError(error: unknown, locale: Locale) {
  const code = getErrorCode(error);

  switch (code) {
    case "resource-delete-blocked-existing-records":
      return localeText(
        locale,
        "该资源仍有关联的资源单元、规则绑定或历史预约记录，不能直接删除。请先停用资源，或先清理未被引用的配置。",
        "This resource still has linked units, rule bindings, or reservation history. Deactivate it first, or remove unused configuration before deleting."
      );
    case "resource-unit-delete-blocked-existing-records":
      return localeText(
        locale,
        "该资源单元已被预约记录、订单记录或组合场地绑定引用，不能直接删除。",
        "This unit is referenced by reservations, orders, or a grouped sports configuration and cannot be deleted."
      );
    default:
      return getErrorMessage(error);
  }
}
