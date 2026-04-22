import Redis from "ioredis";

export function createBullmqConnection(redisUrl: string) {
  return new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    // BullMQ workers and queues need to tolerate short reconnect windows
    // during bootstrap and teardown; otherwise startup races surface as
    // writeability errors before Redis is fully ready.
    enableOfflineQueue: true
  });
}
