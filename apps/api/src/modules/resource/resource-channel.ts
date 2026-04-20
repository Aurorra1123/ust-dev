import { ResourceReleaseFrequency } from "@prisma/client";

export interface ReleaseRuleLike {
  frequency: ResourceReleaseFrequency;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  hour: number;
  minute: number;
  isActive: boolean;
}

export interface BookingClosureLike {
  startsAt: Date;
  endsAt: Date | null;
  reason: string | null;
  isActive: boolean;
}

export interface ResourceChannelSnapshotResult {
  status: "OPEN" | "CLOSED" | "SCHEDULED";
  currentCycleReleaseAt: Date | null;
  nextReleaseAt: Date | null;
  activeClosureReason: string | null;
  activeClosureEndsAt: Date | null;
}

export interface ResourceChannelBlock {
  type: "closure" | "release";
  startsAt?: Date;
  endsAt?: Date | null;
  availableAt?: Date;
  reason?: string | null;
}

export function computeResourceChannelSnapshot(
  releaseRules: ReleaseRuleLike[],
  bookingClosures: BookingClosureLike[],
  now: Date
): ResourceChannelSnapshotResult {
  const activeClosure = getCurrentActiveClosures(bookingClosures, now)[0] ?? null;

  if (activeClosure) {
    return {
      status: "CLOSED",
      currentCycleReleaseAt: null,
      nextReleaseAt: null,
      activeClosureReason: activeClosure.reason,
      activeClosureEndsAt: activeClosure.endsAt
    };
  }

  const activeRules = releaseRules.filter((rule) => rule.isActive);

  if (activeRules.length === 0) {
    return {
      status: "OPEN",
      currentCycleReleaseAt: null,
      nextReleaseAt: null,
      activeClosureReason: null,
      activeClosureEndsAt: null
    };
  }

  const cycleMoments = activeRules.map((rule) => getReleaseCycleMoments(rule, now));
  const released = cycleMoments.filter(
    (moment) => now.getTime() >= moment.currentCycleReleaseAt.getTime()
  );

  if (released.length > 0) {
    return {
      status: "OPEN",
      currentCycleReleaseAt: maxDate(
        released.map((moment) => moment.currentCycleReleaseAt)
      ),
      nextReleaseAt: minDate(cycleMoments.map((moment) => moment.nextReleaseAt)),
      activeClosureReason: null,
      activeClosureEndsAt: null
    };
  }

  return {
    status: "SCHEDULED",
    currentCycleReleaseAt: minDate(
      cycleMoments.map((moment) => moment.currentCycleReleaseAt)
    ),
    nextReleaseAt: minDate(cycleMoments.map((moment) => moment.currentCycleReleaseAt)),
    activeClosureReason: null,
    activeClosureEndsAt: null
  };
}

export function getResourceChannelBlock(
  releaseRules: ReleaseRuleLike[],
  bookingClosures: BookingClosureLike[],
  rangeStart: Date,
  rangeEnd: Date,
  now: Date
): ResourceChannelBlock | null {
  const overlappingClosure = getOverlappingClosures(
    bookingClosures,
    rangeStart,
    rangeEnd
  )[0];

  if (overlappingClosure) {
    return {
      type: "closure",
      startsAt: overlappingClosure.startsAt,
      endsAt: overlappingClosure.endsAt,
      reason: overlappingClosure.reason
    };
  }

  const snapshot = computeResourceChannelSnapshot(releaseRules, bookingClosures, now);

  if (snapshot.status === "SCHEDULED") {
    return {
      type: "release",
      availableAt: snapshot.nextReleaseAt ?? undefined
    };
  }

  if (snapshot.status === "CLOSED") {
    return {
      type: "closure",
      endsAt: snapshot.activeClosureEndsAt,
      reason: snapshot.activeClosureReason
    };
  }

  return null;
}

export function getCurrentActiveClosures(
  bookingClosures: BookingClosureLike[],
  now: Date
) {
  return bookingClosures
    .filter(
      (closure) =>
        closure.isActive &&
        closure.startsAt.getTime() <= now.getTime() &&
        (closure.endsAt === null || closure.endsAt.getTime() > now.getTime())
    )
    .sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime());
}

export function getOverlappingClosures(
  bookingClosures: BookingClosureLike[],
  rangeStart: Date,
  rangeEnd: Date
) {
  return bookingClosures
    .filter((closure) => {
      if (!closure.isActive) {
        return false;
      }

      const closureEnd = closure.endsAt ?? FAR_FUTURE_DATE;
      return (
        closure.startsAt.getTime() < rangeEnd.getTime() &&
        closureEnd.getTime() > rangeStart.getTime()
      );
    })
    .sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime());
}

export function getReleaseCycleMoments(rule: ReleaseRuleLike, now: Date) {
  switch (rule.frequency) {
    case ResourceReleaseFrequency.DAILY: {
      const currentCycleReleaseAt = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        rule.hour,
        rule.minute,
        0,
        0
      );
      const nextReleaseAt = addDays(currentCycleReleaseAt, 1);

      return {
        currentCycleReleaseAt,
        nextReleaseAt
      };
    }

    case ResourceReleaseFrequency.WEEKLY: {
      const targetDay = rule.dayOfWeek ?? 0;
      const dayOffset = targetDay - now.getDay();
      const currentCycleReleaseAt = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + dayOffset,
        rule.hour,
        rule.minute,
        0,
        0
      );

      return {
        currentCycleReleaseAt,
        nextReleaseAt: addDays(currentCycleReleaseAt, 7)
      };
    }

    case ResourceReleaseFrequency.MONTHLY: {
      const currentDay = resolveMonthDay(
        now.getFullYear(),
        now.getMonth(),
        rule.dayOfMonth ?? 1
      );
      const currentCycleReleaseAt = new Date(
        now.getFullYear(),
        now.getMonth(),
        currentDay,
        rule.hour,
        rule.minute,
        0,
        0
      );

      const nextMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        1,
        rule.hour,
        rule.minute,
        0,
        0
      );
      const nextDay = resolveMonthDay(
        nextMonth.getFullYear(),
        nextMonth.getMonth(),
        rule.dayOfMonth ?? 1
      );
      const nextReleaseAt = new Date(
        nextMonth.getFullYear(),
        nextMonth.getMonth(),
        nextDay,
        rule.hour,
        rule.minute,
        0,
        0
      );

      return {
        currentCycleReleaseAt,
        nextReleaseAt
      };
    }
  }
}

const FAR_FUTURE_DATE = new Date("2999-12-31T23:59:59.999+08:00");

function resolveMonthDay(year: number, month: number, dayOfMonth: number) {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return Math.max(1, Math.min(dayOfMonth, lastDay));
}

function addDays(value: Date, days: number) {
  return new Date(
    value.getFullYear(),
    value.getMonth(),
    value.getDate() + days,
    value.getHours(),
    value.getMinutes(),
    value.getSeconds(),
    value.getMilliseconds()
  );
}

function minDate(values: Date[]) {
  return values.reduce((current, value) =>
    value.getTime() < current.getTime() ? value : current
  );
}

function maxDate(values: Date[]) {
  return values.reduce((current, value) =>
    value.getTime() > current.getTime() ? value : current
  );
}
