import { ReservationCategory } from "@prisma/client";

export const CHECK_IN_WINDOW_MINUTES = 10;
export const RESERVATION_BAN_DAYS = 7;

export function getReservationStartTimeFromOrder(order: {
  academicReservation: { startTime: Date } | null;
  sportsReservationSlots: Array<{ slotStart: Date }>;
}) {
  if (order.academicReservation) {
    return order.academicReservation.startTime;
  }

  return order.sportsReservationSlots[0]?.slotStart ?? null;
}

export function getReservationCategoryFromOrder(order: {
  academicReservation: unknown;
  sportsReservationSlots: unknown[];
}) {
  if (order.academicReservation) {
    return ReservationCategory.ACADEMIC_SPACE;
  }

  if (order.sportsReservationSlots.length > 0) {
    return ReservationCategory.SPORTS_FACILITY;
  }

  return null;
}

export function buildReservationCheckInWindow(reservationStartTime: Date) {
  return {
    checkInOpenAt: addMinutes(reservationStartTime, -CHECK_IN_WINDOW_MINUTES),
    checkInCloseAt: addMinutes(reservationStartTime, CHECK_IN_WINDOW_MINUTES)
  };
}

export function getReservationAttendanceEvaluateAt(reservationStartTime: Date) {
  return addMinutes(reservationStartTime, CHECK_IN_WINDOW_MINUTES);
}

export function getReservationBanDeadline(now = new Date()) {
  return addDays(now, RESERVATION_BAN_DAYS);
}

export function mapReservationCategory(category: ReservationCategory) {
  return category === ReservationCategory.ACADEMIC_SPACE
    ? ("academic_space" as const)
    : ("sports_facility" as const);
}

export function maxReservationPolicyDate(current: Date | null, next: Date) {
  if (!current) {
    return next;
  }

  return current.getTime() > next.getTime() ? current : next;
}

function addMinutes(value: Date, minutes: number) {
  return new Date(value.getTime() + minutes * 60 * 1000);
}

function addDays(value: Date, days: number) {
  return new Date(value.getTime() + days * 24 * 60 * 60 * 1000);
}
