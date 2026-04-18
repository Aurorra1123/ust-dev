export type UserRole = "student" | "admin";
export type UserStatus = "active" | "inactive";

export type ResourceType = "academic_space" | "sports_facility";
export type ResourceStatus = "active" | "inactive";
export type ResourceAvailabilityMode = "continuous" | "discrete_slot";

export type ActivityStatus = "draft" | "published" | "closed" | "cancelled";
export type ActivityTicketStatus = "active" | "inactive";

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

export interface AcademicReservationRequest {
  resourceUnitId: string;
  startTime: string;
  endTime: string;
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

export interface ResourceListItem extends AppResource {
  unitCount: number;
  groupCount: number;
  units: AppResourceUnit[];
}

export interface ResourceDetailResponse extends AppResource {
  units: AppResourceUnit[];
  groups: AppResourceGroup[];
}

export interface ActivityListItem extends AppActivity {
  ticketCount: number;
  remainingQuota: number;
}

export interface ActivityDetailResponse extends AppActivity {
  tickets: AppActivityTicket[];
}

export interface RouteCard {
  title: string;
  description: string;
  href: string;
  badge: string;
}
