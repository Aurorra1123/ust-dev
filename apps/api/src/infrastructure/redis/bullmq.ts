import Redis from "ioredis";

export function createBullmqConnection(redisUrl: string) {
  return new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableOfflineQueue: false
  });
}
