import type {
  PublicResourceReservationStatusResponse,
  ResourceDetailResponse
} from "@campusbook/shared-types";

import { localeText } from "../../../lib/locale";

export type CellState =
  | "available"
  | "occupied"
  | "in_progress"
  | "closed"
  | "selected";

export function formatNameList(names: string[], locale: "zh-CN" | "en") {
  if (!names.length) {
    return localeText(locale, "未设置", "Not set");
  }

  return names.join(locale === "zh-CN" ? "、" : ", ");
}

export function summarizeNames(names: string[], locale: "zh-CN" | "en") {
  const visibleNames = names.slice(0, 2);
  const restCount = names.length - visibleNames.length;
  const base = formatNameList(visibleNames, locale);

  if (restCount <= 0) {
    return base;
  }

  return `${base} +${restCount}`;
}

export function buildAvailableTargets(params: {
  currentResource: ResourceDetailResponse | null;
  mode: "unit" | "group";
  resourceUnitNameMap: Map<string, string>;
  locale: "zh-CN" | "en";
}) {
  const { currentResource, locale, mode, resourceUnitNameMap } = params;

  if (!currentResource) {
    return [];
  }

  if (mode === "group") {
    return currentResource.groups.map((group) => ({
      id: group.id,
      label: group.name,
      detail: summarizeNames(
        group.items.map(
          (item) => resourceUnitNameMap.get(item.resourceUnitId) ?? item.resourceUnitId
        ),
        locale
      )
    }));
  }

  return currentResource.units.map((unit) => ({
    id: unit.id,
    label: unit.name,
    detail: unit.code
  }));
}

export function getSlotState(params: {
  schedule: PublicResourceReservationStatusResponse | undefined;
  resourceUnitId: string;
  slotStart: Date;
  bookingThreshold: Date;
  mode: "unit" | "group";
  targetId: string;
  slotStarts: string[];
}) {
  const { bookingThreshold, mode, resourceUnitId, schedule, slotStart, slotStarts, targetId } =
    params;
  const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);
  const slotStartTime = slotStart.getTime();
  const slotEndTime = slotEnd.getTime();
  const now = Date.now();

  if (isSlotClosed(schedule, slotStart, slotEnd)) {
    return "closed" as const;
  }

  const matchedReservation = schedule?.sportsReservations.find(
    (reservation) =>
      reservation.resourceUnitId === resourceUnitId &&
      new Date(reservation.startTime).getTime() < slotEndTime &&
      new Date(reservation.endTime).getTime() > slotStartTime
  );

  if (matchedReservation) {
    return now >= slotStartTime && now < slotEndTime ? "in_progress" : "occupied";
  }

  if (slotStartTime < bookingThreshold.getTime()) {
    return now >= slotStartTime && now < slotEndTime ? "in_progress" : "closed";
  }

  if (
    mode === "unit" &&
    targetId === resourceUnitId &&
    slotStarts.includes(slotStart.toISOString())
  ) {
    return "selected" as const;
  }

  return "available" as const;
}

export function getGroupSlotState(params: {
  currentResource: ResourceDetailResponse | null;
  selectedGroupUnitIds: Set<string>;
  selectedGroupId: string | null;
  slotStart: Date;
  schedule: PublicResourceReservationStatusResponse | undefined;
  bookingThreshold: Date;
  mode: "unit" | "group";
  targetId: string;
  slotStarts: string[];
}) {
  const {
    bookingThreshold,
    currentResource,
    mode,
    schedule,
    selectedGroupId,
    selectedGroupUnitIds,
    slotStart,
    slotStarts,
    targetId
  } = params;

  if (!selectedGroupId) {
    return "closed" as const;
  }

  const memberStates =
    currentResource?.units
      .filter((unit) => selectedGroupUnitIds.has(unit.id))
      .map((unit) =>
        getSlotState({
          schedule,
          resourceUnitId: unit.id,
          slotStart,
          bookingThreshold,
          mode,
          targetId,
          slotStarts
        })
      ) ?? [];

  if (!memberStates.length) {
    return "closed" as const;
  }

  if (slotStarts.includes(slotStart.toISOString())) {
    return "selected" as const;
  }

  if (memberStates.some((state) => state === "closed")) {
    return "closed" as const;
  }

  if (memberStates.some((state) => state === "in_progress")) {
    return "in_progress" as const;
  }

  if (memberStates.some((state) => state === "occupied")) {
    return "occupied" as const;
  }

  return "available" as const;
}

export function cellStateLabel(state: CellState, locale: "zh-CN" | "en") {
  switch (state) {
    case "available":
      return localeText(locale, "可预约", "Available");
    case "occupied":
      return localeText(locale, "已占用", "Occupied");
    case "in_progress":
      return localeText(locale, "进行中", "In Progress");
    case "closed":
      return localeText(locale, "不可约", "Closed");
    case "selected":
      return localeText(locale, "已选择", "Selected");
  }
}

export function headerStateLabel(state: CellState, locale: "zh-CN" | "en") {
  switch (state) {
    case "available":
      return localeText(locale, "可选", "Pick");
    case "selected":
      return localeText(locale, "已选", "Selected");
    case "occupied":
      return localeText(locale, "冲突", "Conflict");
    case "in_progress":
      return localeText(locale, "进行中", "In Progress");
    case "closed":
      return localeText(locale, "关闭", "Closed");
  }
}

export function cellStateClass(state: CellState) {
  switch (state) {
    case "available":
      return "border-moss/25 bg-white hover:border-moss hover:bg-moss/10";
    case "occupied":
      return "border-gold/25 bg-[#fff6e8]";
    case "in_progress":
      return "border-navy/20 bg-[#e9f1ff]";
    case "closed":
      return "border-ink/10 bg-[#f1f3f7] opacity-70";
    case "selected":
      return "border-ember/30 bg-ember/12";
  }
}

export function headerStateClass(state: CellState) {
  switch (state) {
    case "available":
      return "bg-moss/10 text-moss hover:bg-moss/18";
    case "selected":
      return "bg-ember text-white";
    case "occupied":
      return "bg-gold/15 text-[#9a6b18]";
    case "in_progress":
      return "bg-navy/10 text-navy";
    case "closed":
      return "bg-ink/8 text-ink/45";
  }
}

export function legendToneClass(state: CellState) {
  switch (state) {
    case "available":
      return "bg-moss/60";
    case "occupied":
      return "bg-gold/70";
    case "in_progress":
      return "bg-navy/70";
    case "closed":
      return "bg-ink/30";
    case "selected":
      return "bg-ember/80";
  }
}

export function isSlotClosed(
  schedule: PublicResourceReservationStatusResponse | undefined,
  slotStart: Date,
  slotEnd: Date
) {
  return (
    schedule?.closures.some((closure) => {
      const closureStart = new Date(closure.startsAt).getTime();
      const closureEnd = closure.endsAt
        ? new Date(closure.endsAt).getTime()
        : Number.POSITIVE_INFINITY;

      return closureStart < slotEnd.getTime() && closureEnd > slotStart.getTime();
    }) ?? false
  );
}
