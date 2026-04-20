export const RESERVATION_ATTENDANCE_QUEUE_NAME = "reservation-attendance";
export const RESERVATION_ATTENDANCE_JOB_NAME = "reservation-attendance-evaluate";

export interface ReservationAttendanceJobPayload {
  orderId: string;
}
