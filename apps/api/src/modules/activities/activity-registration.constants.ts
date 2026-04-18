export const ACTIVITY_REGISTRATION_QUEUE_NAME = "activity-registration";
export const ACTIVITY_REGISTRATION_JOB_NAME = "activity-registration:create";
export const ACTIVITY_REGISTRATION_PENDING_TTL_MS = 5 * 60 * 1000;
export const ACTIVITY_REGISTRATION_FAILURE_TTL_MS = 5 * 60 * 1000;

export interface ActivityRegistrationJobPayload {
  activityId: string;
  ticketId: string;
  userId: string;
}

export function buildActivityRegistrationJobId(
  payload: ActivityRegistrationJobPayload
) {
  return `activity-grab-${payload.activityId}-${payload.ticketId}-${payload.userId}`;
}

export function getActivityTicketRemainingKey(ticketId: string) {
  return `campusbook:activity-ticket:${ticketId}:remaining`;
}

export function getActivityRegistrationPendingKey(activityId: string, userId: string) {
  return `campusbook:activity:${activityId}:user:${userId}:pending`;
}

export function getActivityRegistrationFailureKey(activityId: string, userId: string) {
  return `campusbook:activity:${activityId}:user:${userId}:failure`;
}
