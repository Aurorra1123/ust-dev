export type UserRole = "student" | "admin";
export type UserStatus = "active" | "inactive";

export type ResourceType = "academic_space" | "sports_facility";
export type ResourceStatus = "active" | "inactive";
export type ResourceAvailabilityMode = "continuous" | "discrete_slot";
export type ReservationCategory = "academic_space" | "sports_facility";
export type ResourceReleaseFrequency = "daily" | "weekly" | "monthly";
export type ResourceChannelStatus = "open" | "closed" | "scheduled";

export type ActivityStatus = "draft" | "published" | "closed" | "cancelled";
export type ActivityTicketStatus = "active" | "inactive";
export type RuleStatus = "active" | "inactive";
export type RuleType =
  | "min_credit_score"
  | "max_duration_minutes"
  | "allowed_user_roles";

export type OrderBizType =
  | "resource_reservation"
  | "activity_registration";

export type OrderStatus =
  | "pending_confirmation"
  | "confirmed"
  | "cancelled"
  | "no_show";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface HealthStatus {
  service: string;
  status: "ok" | "degraded";
  timestamp: string;
  dependencies: {
    postgres: "up" | "down";
    redis: "up" | "down";
  };
  checks?: {
    postgres?: string;
    redis?: string;
  };
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthSessionResponse {
  accessToken: string;
  expiresIn: number;
  user: AuthUser;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  creditScore: number;
}

export interface AppResource {
  id: string;
  type: ResourceType;
  code: string;
  name: string;
  description?: string | null;
  location?: string | null;
  status: ResourceStatus;
}

export interface AppResourceUnit {
  id: string;
  resourceId: string;
  code: string;
  name: string;
  unitType: string;
  availabilityMode: ResourceAvailabilityMode;
  capacity?: number | null;
  sortOrder: number;
}

export interface AppResourceGroupItem {
  id: string;
  resourceUnitId: string;
  sortOrder: number;
}

export interface AppResourceGroup {
  id: string;
  resourceId: string;
  name: string;
  description?: string | null;
  items: AppResourceGroupItem[];
}

export interface AppActivity {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  totalQuota: number;
  saleStartTime: string;
  saleEndTime: string;
  eventStartTime?: string | null;
  eventEndTime?: string | null;
  status: ActivityStatus;
}

export interface AppActivityTicket {
  id: string;
  activityId: string;
  name: string;
  stock: number;
  reserved: number;
  priceCents: number;
  status: ActivityTicketStatus;
}

export interface AppOrder {
  id: string;
  orderNo: string;
  userId: string;
  activityId?: string | null;
  bizType: OrderBizType;
  status: OrderStatus;
  version: number;
  expireAt?: string | null;
  totalAmountCents: number;
}

export interface OrderStatusLogEntry {
  id: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  reason: string | null;
  createdAt: string;
}

export interface OrderItemDetail {
  id: string;
  quantity: number;
  slotCount: number;
  startTime: string | null;
  endTime: string | null;
  bufferBeforeMin: number;
  bufferAfterMin: number;
  unitPriceCents: number;
  resourceName: string | null;
  resourceUnitName: string | null;
  activityTicketName: string | null;
}

export interface AcademicReservationDetail {
  id: string;
  resourceId: string;
  resourceName: string;
  resourceUnitId: string;
  resourceUnitName: string;
  startTime: string;
  endTime: string;
  bufferBeforeMin: number;
  bufferAfterMin: number;
  status: OrderStatus;
}

export interface ReservationParticipantDetail {
  userId: string;
  userEmail: string;
  isHost: boolean;
  checkedInAt: string | null;
}

export interface SportsReservationSlotDetail {
  id: string;
  resourceId: string;
  resourceName: string;
  resourceUnitId: string;
  resourceUnitName: string;
  slotStart: string;
  slotEnd: string;
  status: OrderStatus;
}

export interface ActivityRegistrationDetail {
  id: string;
  activityId: string;
  activityTitle: string;
  activityTicketId: string;
  activityTicketName: string;
  status: OrderStatus;
}

export interface OrderDetailResponse extends AppOrder {
  userEmail: string;
  createdAt: string;
  updatedAt: string;
  reservationCategory: ReservationCategory | null;
  reservationStartTime: string | null;
  checkInOpenAt: string | null;
  checkInCloseAt: string | null;
  items: OrderItemDetail[];
  statusLogs: OrderStatusLogEntry[];
  reservationParticipants: ReservationParticipantDetail[];
  academicReservation: AcademicReservationDetail | null;
  sportsReservationSlots: SportsReservationSlotDetail[];
  activityRegistration: ActivityRegistrationDetail | null;
}

export interface AcademicReservationRequest {
  resourceUnitId: string;
  startTime: string;
  endTime: string;
  companionEmails?: string[];
}

export interface AcademicReservationResponse {
  reservationId: string;
  orderId: string;
  orderNo: string;
  userId: string;
  resourceId: string;
  resourceUnitId: string;
  startTime: string;
  endTime: string;
  bufferBeforeMin: number;
  bufferAfterMin: number;
  status: OrderStatus;
}

export interface SportsReservationRequest {
  resourceUnitId?: string;
  resourceGroupId?: string;
  slotStarts: string[];
  companionEmails?: string[];
}

export interface SportsReservationResponse {
  orderId: string;
  orderNo: string;
  userId: string;
  resourceId: string;
  resourceUnitIds: string[];
  slotStarts: string[];
  slotEnds: string[];
  slotCount: number;
  status: OrderStatus;
}

export interface ReservationCheckInResponse {
  orderId: string;
  participantUserId: string;
  participantUserEmail: string;
  checkedInAt: string;
  reservationCategory: ReservationCategory;
  checkInOpenAt: string;
  checkInCloseAt: string;
  orderStatus: OrderStatus;
}

export interface ResourceListItem extends AppResource {
  unitCount: number;
  groupCount: number;
  units: AppResourceUnit[];
}

export interface ResourceDetailResponse extends AppResource {
  units: AppResourceUnit[];
  groups: AppResourceGroup[];
}

export interface ResourceReleaseRuleDetail {
  id: string;
  resourceId: string;
  frequency: ResourceReleaseFrequency;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  hour: number;
  minute: number;
  isActive: boolean;
  currentCycleReleaseAt: string;
  nextReleaseAt: string;
}

export interface ResourceBookingClosureDetail {
  id: string;
  resourceId: string;
  startsAt: string;
  endsAt: string | null;
  reason: string | null;
  isActive: boolean;
  isCurrentlyClosed: boolean;
}

export interface ResourceChannelSnapshot {
  status: ResourceChannelStatus;
  currentCycleReleaseAt: string | null;
  nextReleaseAt: string | null;
  activeClosureReason: string | null;
  activeClosureEndsAt: string | null;
}

export interface AdminResourceDetailResponse extends ResourceDetailResponse {
  releaseRules: ResourceReleaseRuleDetail[];
  bookingClosures: ResourceBookingClosureDetail[];
  channelStatus: ResourceChannelSnapshot;
}

export interface CreateResourceReleaseRulePayload {
  resourceIds: string[];
  frequency: ResourceReleaseFrequency;
  dayOfWeek?: number;
  dayOfMonth?: number;
  hour: number;
  minute: number;
  isActive?: boolean;
}

export interface UpdateResourceReleaseRulePayload {
  frequency?: ResourceReleaseFrequency;
  dayOfWeek?: number | null;
  dayOfMonth?: number | null;
  hour?: number;
  minute?: number;
  isActive?: boolean;
}

export interface CreateResourceBookingClosurePayload {
  resourceIds: string[];
  startsAt: string;
  endsAt?: string | null;
  reason?: string;
  isActive?: boolean;
}

export interface UpdateResourceBookingClosurePayload {
  startsAt?: string;
  endsAt?: string | null;
  reason?: string | null;
  isActive?: boolean;
}

export interface AdminBulkMutationResponse {
  createdCount: number;
}

export interface AdminResourceReservationRecord {
  orderId: string;
  orderNo: string;
  userId: string;
  userEmail: string;
  status: OrderStatus;
  resourceUnitId: string;
  resourceUnitName: string;
  startTime: string;
  endTime: string;
  participantCount: number;
  checkedInCount: number;
}

export interface AdminResourceReservationStatusResponse {
  resourceId: string;
  resourceName: string;
  from: string;
  to: string;
  generatedAt: string;
  channelStatus: ResourceChannelSnapshot;
  closures: ResourceBookingClosureDetail[];
  academicReservations: AdminResourceReservationRecord[];
  sportsReservations: AdminResourceReservationRecord[];
}

export interface ActivityListItem extends AppActivity {
  ticketCount: number;
  remainingQuota: number;
}

export interface ActivityDetailResponse extends AppActivity {
  tickets: AppActivityTicket[];
}

export interface ActivityGrabRequest {
  ticketId: string;
}

export interface ActivityGrabResponse {
  activityId: string;
  ticketId: string;
  jobId: string;
  requestStatus: "queued";
}

export interface ActivityRegistrationStatusResponse {
  activityId: string;
  ticketId: string | null;
  userId: string;
  orderId: string | null;
  orderNo: string | null;
  jobId?: string | null;
  status: OrderStatus | "queued" | "failed";
  reason?: string | null;
}

export interface RuleExpression {
  min?: number;
  max?: number;
  roles?: UserRole[];
}

export interface AppRule {
  id: string;
  name: string;
  ruleType: RuleType;
  status: RuleStatus;
  expression: RuleExpression;
  resourceIds: string[];
}

export interface RouteCard {
  title: string;
  description: string;
  href: string;
  badge: string;
}
