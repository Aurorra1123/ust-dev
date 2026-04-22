import type Redis from "ioredis";

const WRITABLE_STATUSES = new Set(["connect", "ready"]);

export async function closeRedisConnection(client: Redis) {
  if (client.status === "end") {
    return;
  }

  if (!WRITABLE_STATUSES.has(client.status)) {
    client.disconnect(false);
    return;
  }

  try {
    await client.quit();
  } catch {
    client.disconnect(false);
  }
}
