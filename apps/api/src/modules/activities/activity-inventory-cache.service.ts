import { Injectable } from "@nestjs/common";

import { RedisService } from "../../infrastructure/redis/redis.service";
import {
  ACTIVITY_REGISTRATION_FAILURE_TTL_MS,
  getActivityRegistrationFailureKey,
  getActivityRegistrationPendingKey,
  getActivityTicketRemainingKey
} from "./activity-registration.constants";

type ReserveResult = "reserved" | "sold_out" | "duplicate_pending" | "missing_stock";

const RESERVE_STOCK_LUA = `
local stockKey = KEYS[1]
local pendingKey = KEYS[2]
local failureKey = KEYS[3]
local pendingValue = ARGV[1]
local pendingTtl = tonumber(ARGV[2])

if redis.call("EXISTS", pendingKey) == 1 then
  return "duplicate_pending"
end

local stock = redis.call("GET", stockKey)
if not stock then
  return "missing_stock"
end

if tonumber(stock) <= 0 then
  return "sold_out"
end

redis.call("DECR", stockKey)
redis.call("SET", pendingKey, pendingValue, "PX", pendingTtl)
redis.call("DEL", failureKey)
return "reserved"
`;

const COMPENSATE_PENDING_LUA = `
local stockKey = KEYS[1]
local pendingKey = KEYS[2]
local failureKey = KEYS[3]
local failureReason = ARGV[1]
local failureTtl = tonumber(ARGV[2])

if redis.call("EXISTS", pendingKey) == 1 then
  if redis.call("EXISTS", stockKey) == 1 then
    redis.call("INCR", stockKey)
  end
  redis.call("DEL", pendingKey)
end

redis.call("SET", failureKey, failureReason, "PX", failureTtl)
return "ok"
`;

const COMPLETE_PENDING_LUA = `
redis.call("DEL", KEYS[1])
redis.call("DEL", KEYS[2])
return "ok"
`;

const RELEASE_CONFIRMED_LUA = `
local stockKey = KEYS[1]
if redis.call("EXISTS", stockKey) == 1 then
  redis.call("INCR", stockKey)
end

redis.call("DEL", KEYS[2])
redis.call("DEL", KEYS[3])
return "ok"
`;

@Injectable()
export class ActivityInventoryCacheService {
  constructor(private readonly redisService: RedisService) {}

  async ensureTicketRemaining(ticketId: string, remaining: number) {
    await (await this.redisService.connect()).set(
      getActivityTicketRemainingKey(ticketId),
      String(Math.max(remaining, 0)),
      "NX"
    );
  }

  async reserveTicketForRequest(params: {
    activityId: string;
    ticketId: string;
    userId: string;
    jobId: string;
    ttlMs: number;
  }): Promise<ReserveResult> {
    const result = await (await this.redisService.connect()).eval(
      RESERVE_STOCK_LUA,
      3,
      getActivityTicketRemainingKey(params.ticketId),
      getActivityRegistrationPendingKey(params.activityId, params.userId),
      getActivityRegistrationFailureKey(params.activityId, params.userId),
      params.jobId,
      String(params.ttlMs)
    );

    return toReserveResult(result);
  }

  async compensatePendingReservation(
    activityId: string,
    ticketId: string,
    userId: string,
    reason: string
  ) {
    await (await this.redisService.connect()).eval(
      COMPENSATE_PENDING_LUA,
      3,
      getActivityTicketRemainingKey(ticketId),
      getActivityRegistrationPendingKey(activityId, userId),
      getActivityRegistrationFailureKey(activityId, userId),
      reason,
      String(ACTIVITY_REGISTRATION_FAILURE_TTL_MS)
    );
  }

  async markRequestCompleted(activityId: string, userId: string) {
    await (await this.redisService.connect()).eval(
      COMPLETE_PENDING_LUA,
      2,
      getActivityRegistrationPendingKey(activityId, userId),
      getActivityRegistrationFailureKey(activityId, userId)
    );
  }

  async releaseConfirmedReservation(
    activityId: string,
    ticketId: string,
    userId: string
  ) {
    await (await this.redisService.connect()).eval(
      RELEASE_CONFIRMED_LUA,
      3,
      getActivityTicketRemainingKey(ticketId),
      getActivityRegistrationPendingKey(activityId, userId),
      getActivityRegistrationFailureKey(activityId, userId)
    );
  }

  async getPendingJobId(activityId: string, userId: string) {
    const value = await (await this.redisService.connect()).get(
      getActivityRegistrationPendingKey(activityId, userId)
    );

    return value ?? null;
  }

  async getFailureReason(activityId: string, userId: string) {
    const value = await (await this.redisService.connect()).get(
      getActivityRegistrationFailureKey(activityId, userId)
    );

    return value ?? null;
  }
}

function toReserveResult(value: unknown): ReserveResult {
  if (
    value === "reserved" ||
    value === "sold_out" ||
    value === "duplicate_pending" ||
    value === "missing_stock"
  ) {
    return value;
  }

  throw new Error(`unexpected-activity-stock-result:${String(value)}`);
}
