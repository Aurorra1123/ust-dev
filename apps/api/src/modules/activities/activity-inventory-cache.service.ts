import { Injectable } from "@nestjs/common";

import { RedisService } from "../../infrastructure/redis/redis.service";
import {
  ACTIVITY_REGISTRATION_FAILURE_TTL_MS,
  buildActivityRegistrationPendingValue,
  getActivityRegistrationFailureKey,
  getActivityRegistrationPendingKey,
  getActivityTicketRemainingKey,
  parseActivityRegistrationPendingValue
} from "./activity-registration.constants";

type ReserveResult = "reserved" | "sold_out" | "duplicate_pending" | "missing_stock";
type PendingMutationResult = "compensated" | "completed" | "skipped";

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
local expectedPendingValue = ARGV[1]
local failureReason = ARGV[2]
local failureTtl = tonumber(ARGV[3])

if redis.call("GET", pendingKey) == expectedPendingValue then
  if redis.call("EXISTS", stockKey) == 1 then
    redis.call("INCR", stockKey)
  end
  redis.call("DEL", pendingKey)
  redis.call("SET", failureKey, failureReason, "PX", failureTtl)
  return "compensated"
end

return "skipped"
`;

const COMPLETE_PENDING_LUA = `
local pendingKey = KEYS[1]
local failureKey = KEYS[2]
local expectedPendingValue = ARGV[1]

if redis.call("GET", pendingKey) == expectedPendingValue then
  redis.call("DEL", pendingKey)
  redis.call("DEL", failureKey)
  return "completed"
end

return "skipped"
`;

const RELEASE_CONFIRMED_LUA = `
local stockKey = KEYS[1]
if redis.call("EXISTS", stockKey) == 1 then
  redis.call("INCR", stockKey)
end

redis.call("DEL", KEYS[2])
return "ok"
`;

@Injectable()
export class ActivityInventoryCacheService {
  constructor(private readonly redisService: RedisService) {}

  async ensureTicketRemaining(
    activityId: string,
    ticketId: string,
    remaining: number
  ) {
    const client = await this.redisService.connect();
    const existing = await client.exists(getActivityTicketRemainingKey(ticketId));

    if (existing === 1) {
      return;
    }

    const pendingClaims = await this.countPendingClaimsForTicket(
      activityId,
      ticketId
    );

    await client.set(
      getActivityTicketRemainingKey(ticketId),
      String(Math.max(remaining - pendingClaims, 0)),
      "NX"
    );
  }

  async reconcileTicketRemaining(
    activityId: string,
    ticketId: string,
    remaining: number
  ) {
    const pendingClaims = await this.countPendingClaimsForTicket(
      activityId,
      ticketId
    );
    const nextRemaining = Math.max(remaining - pendingClaims, 0);

    await (await this.redisService.connect()).set(
      getActivityTicketRemainingKey(ticketId),
      String(nextRemaining)
    );

    return {
      remaining: nextRemaining,
      pendingClaims
    };
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
      buildActivityRegistrationPendingValue(params.jobId, params.ticketId),
      String(params.ttlMs)
    );

    return toReserveResult(result);
  }

  async compensatePendingReservation(
    activityId: string,
    ticketId: string,
    userId: string,
    jobId: string,
    reason: string
  ): Promise<PendingMutationResult> {
    const result = await (await this.redisService.connect()).eval(
      COMPENSATE_PENDING_LUA,
      3,
      getActivityTicketRemainingKey(ticketId),
      getActivityRegistrationPendingKey(activityId, userId),
      getActivityRegistrationFailureKey(activityId, userId),
      buildActivityRegistrationPendingValue(jobId, ticketId),
      reason,
      String(ACTIVITY_REGISTRATION_FAILURE_TTL_MS)
    );

    return toPendingMutationResult(result);
  }

  async markRequestCompleted(
    activityId: string,
    userId: string,
    ticketId: string,
    jobId: string
  ): Promise<PendingMutationResult> {
    const result = await (await this.redisService.connect()).eval(
      COMPLETE_PENDING_LUA,
      2,
      getActivityRegistrationPendingKey(activityId, userId),
      getActivityRegistrationFailureKey(activityId, userId),
      buildActivityRegistrationPendingValue(jobId, ticketId)
    );

    return toPendingMutationResult(result);
  }

  async releaseConfirmedReservation(
    activityId: string,
    ticketId: string,
    userId: string
  ) {
    await (await this.redisService.connect()).eval(
      RELEASE_CONFIRMED_LUA,
      2,
      getActivityTicketRemainingKey(ticketId),
      getActivityRegistrationFailureKey(activityId, userId)
    );
  }

  async getPendingJobId(activityId: string, userId: string) {
    const value = await (await this.redisService.connect()).get(
      getActivityRegistrationPendingKey(activityId, userId)
    );

    if (!value) {
      return null;
    }

    return parseActivityRegistrationPendingValue(value).jobId;
  }

  async getFailureReason(activityId: string, userId: string) {
    const value = await (await this.redisService.connect()).get(
      getActivityRegistrationFailureKey(activityId, userId)
    );

    return value ?? null;
  }

  private async countPendingClaimsForTicket(activityId: string, ticketId: string) {
    const client = await this.redisService.connect();
    const keys = await scanKeys(
      client,
      `campusbook:activity:${activityId}:user:*:pending`
    );

    if (keys.length === 0) {
      return 0;
    }

    const values = await client.mget(keys);

    return values.reduce((count, value) => {
      if (!value) {
        return count;
      }

      return parseActivityRegistrationPendingValue(value).ticketId === ticketId
        ? count + 1
        : count;
    }, 0);
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

function toPendingMutationResult(value: unknown): PendingMutationResult {
  if (value === "compensated" || value === "completed" || value === "skipped") {
    return value;
  }

  throw new Error(`unexpected-activity-pending-result:${String(value)}`);
}

async function scanKeys(client: Awaited<ReturnType<RedisService["connect"]>>, match: string) {
  const keys: string[] = [];
  let cursor = "0";

  do {
    const [nextCursor, batch] = await client.scan(cursor, "MATCH", match, "COUNT", 100);
    cursor = nextCursor;
    keys.push(...batch);
  } while (cursor !== "0");

  return keys;
}
