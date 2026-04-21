import type {
  AppResourceUnit,
  PublicResourceReservationRecord,
  PublicResourceReservationStatusResponse
} from "@campusbook/shared-types";

import { formatDateTime } from "../../../lib/date";
import { localeText } from "../../../lib/locale";
import type { Locale } from "../../../store/locale-store";

export type TimelineSegmentTone = "occupied" | "current" | "closed" | "selection";

export type TimelineSegment = {
  key: string;
  leftPercent: number;
  widthPercent: number;
  tone: TimelineSegmentTone;
  label: string;
};

export type SelectedRange = {
  start: Date;
  end: Date;
};

export type SelectionConflict = {
  tone: "danger" | "success";
  title: string;
  description: string;
} | null;

export function parseLocalDateTime(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getSelectedUnitReservations(
  schedule: PublicResourceReservationStatusResponse | undefined,
  resourceUnitId: string
) {
  return (
    schedule?.academicReservations
      .filter((reservation) => reservation.resourceUnitId === resourceUnitId)
      .sort(
        (left, right) =>
          new Date(left.startTime).getTime() - new Date(right.startTime).getTime()
      ) ?? []
  );
}

export function getSelectionConflict(params: {
  locale: Locale;
  selectedRange: SelectedRange | null;
  schedule: PublicResourceReservationStatusResponse | undefined;
  selectedUnit: AppResourceUnit | null;
  selectedUnitReservations: PublicResourceReservationRecord[];
}): SelectionConflict {
  const { locale, schedule, selectedRange, selectedUnit, selectedUnitReservations } = params;

  if (!selectedRange || !schedule || !selectedUnit) {
    return null;
  }

  const overlappingClosure = schedule.closures.find((closure) =>
    rangesOverlap(selectedRange.start, selectedRange.end, closure.startsAt, closure.endsAt)
  );

  if (overlappingClosure) {
    return {
      tone: "danger",
      title: localeText(locale, "所选时间命中关闭区间", "Selected range is closed"),
      description:
        overlappingClosure.reason ||
        localeText(
          locale,
          "当前资源在这段时间不可预约，请调整时间后再提交。",
          "This resource is unavailable during the selected time window. Choose another time."
        )
    };
  }

  const overlappingReservation = selectedUnitReservations.find((reservation) =>
    rangesOverlap(
      selectedRange.start,
      selectedRange.end,
      reservation.startTime,
      reservation.endTime
    )
  );

  if (overlappingReservation) {
    return {
      tone: "danger",
      title: localeText(locale, "所选时间与现有预约冲突", "Selected range conflicts"),
      description: localeText(
        locale,
        `${selectedUnit.name} 在 ${formatDateTime(overlappingReservation.startTime)} 至 ${formatDateTime(overlappingReservation.endTime)} 已被占用。`,
        `${selectedUnit.name} is already occupied from ${formatDateTime(overlappingReservation.startTime)} to ${formatDateTime(overlappingReservation.endTime)}.`
      )
    };
  }

  return {
    tone: "success",
    title: localeText(locale, "当前时段在已加载窗口内可预约", "Selected range is available"),
    description: localeText(
      locale,
      "可视化视图中暂未发现关闭或冲突区间，可以继续提交预约。",
      "No closures or conflicts were found in the loaded window. You can continue with the booking."
    )
  };
}

export function buildTimelineSegments(params: {
  displayStart: Date;
  displayEnd: Date;
  unitName: string;
  reservations: Array<{
    orderId: string;
    startTime: string;
    endTime: string;
  }>;
  closures: Array<{
    startsAt: string;
    endsAt: string | null;
    reason: string | null;
  }>;
  selectedRange: SelectedRange | null;
}): TimelineSegment[] {
  const segments: TimelineSegment[] = [];
  const displayStartMs = params.displayStart.getTime();
  const displayEndMs = params.displayEnd.getTime();
  const now = Date.now();

  for (const closure of params.closures) {
    const segment = createTimelineSegment({
      start: new Date(closure.startsAt).getTime(),
      end: closure.endsAt
        ? new Date(closure.endsAt).getTime()
        : Number.POSITIVE_INFINITY,
      displayStart: displayStartMs,
      displayEnd: displayEndMs,
      tone: "closed",
      key: `closure-${closure.startsAt}-${closure.endsAt ?? "open"}`,
      label: closure.reason ?? "closure"
    });

    if (segment) {
      segments.push(segment);
    }
  }

  for (const reservation of params.reservations) {
    const reservationStart = new Date(reservation.startTime).getTime();
    const reservationEnd = new Date(reservation.endTime).getTime();
    const segment = createTimelineSegment({
      start: reservationStart,
      end: reservationEnd,
      displayStart: displayStartMs,
      displayEnd: displayEndMs,
      tone: reservationStart <= now && reservationEnd >= now ? "current" : "occupied",
      key: `reservation-${reservation.orderId}-${reservation.startTime}`,
      label: `${params.unitName}: ${reservation.startTime}`
    });

    if (segment) {
      segments.push(segment);
    }
  }

  if (params.selectedRange) {
    const selectionSegment = createTimelineSegment({
      start: params.selectedRange.start.getTime(),
      end: params.selectedRange.end.getTime(),
      displayStart: displayStartMs,
      displayEnd: displayEndMs,
      tone: "selection",
      key: `selection-${params.selectedRange.start.toISOString()}`,
      label: "selection"
    });

    if (selectionSegment) {
      segments.push(selectionSegment);
    }
  }

  return segments;
}

export function calculateLeftPercent(value: number, min: number, max: number) {
  return ((value - min) / (max - min)) * 100;
}

export function isNowVisible(displayStart: Date, displayEnd: Date) {
  const now = Date.now();

  return now >= displayStart.getTime() && now <= displayEnd.getTime();
}

export function timelineSegmentClass(tone: TimelineSegmentTone) {
  switch (tone) {
    case "occupied":
      return "z-[2] border border-gold/30 bg-[#fff2d8]";
    case "current":
      return "z-[2] border border-navy/25 bg-[#dfeaff]";
    case "closed":
      return "z-[1] border border-ink/10 bg-[#edf0f5]";
    case "selection":
      return "z-[4] border-2 border-ember/50 bg-ember/20";
  }
}

export function legendToneClass(tone: "available" | TimelineSegmentTone) {
  switch (tone) {
    case "available":
      return "bg-moss/60";
    case "occupied":
      return "bg-gold/70";
    case "current":
      return "bg-navy/70";
    case "closed":
      return "bg-ink/35";
    case "selection":
      return "bg-ember/80";
  }
}

export function summarizeUnitWindow(
  reservationCount: number,
  closureCount: number,
  locale: Locale
) {
  if (reservationCount === 0 && closureCount === 0) {
    return localeText(locale, "当前窗口内没有占用", "No conflicts in this window");
  }

  return localeText(
    locale,
    `${reservationCount} 段占用 · ${closureCount} 段关闭`,
    `${reservationCount} occupied · ${closureCount} closed`
  );
}

export function rangeIntersectsWindow(
  range: SelectedRange,
  displayStart: Date,
  displayEnd: Date
) {
  return (
    range.end.getTime() > displayStart.getTime() &&
    range.start.getTime() < displayEnd.getTime()
  );
}

export function rangesOverlap(
  start: Date,
  end: Date,
  comparedStartRaw: string,
  comparedEndRaw: string | null
) {
  const comparedStart = new Date(comparedStartRaw).getTime();
  const comparedEnd = comparedEndRaw
    ? new Date(comparedEndRaw).getTime()
    : Number.POSITIVE_INFINITY;

  return start.getTime() < comparedEnd && end.getTime() > comparedStart;
}

function createTimelineSegment(params: {
  start: number;
  end: number;
  displayStart: number;
  displayEnd: number;
  tone: TimelineSegmentTone;
  key: string;
  label: string;
}): TimelineSegment | null {
  const start = Math.max(params.start, params.displayStart);
  const end = Math.min(params.end, params.displayEnd);

  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    end <= start ||
    params.displayEnd <= params.displayStart
  ) {
    return null;
  }

  return {
    key: params.key,
    leftPercent: calculateLeftPercent(start, params.displayStart, params.displayEnd),
    widthPercent: Math.max(
      calculateLeftPercent(end, params.displayStart, params.displayEnd) -
        calculateLeftPercent(start, params.displayStart, params.displayEnd),
      1.5
    ),
    tone: params.tone,
    label: params.label
  };
}
