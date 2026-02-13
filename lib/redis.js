import { Redis } from "@upstash/redis";

/**
 * Lazily-initialized Redis client singleton.
 *
 * Uses a Proxy so callers can import `redis` and use it like a
 * normal @upstash/redis client (`redis.get()`, `redis.set()`, etc.)
 * while deferring instantiation until the first actual call.
 */
let _client = null;

function getClient() {
  if (_client) return _client;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.error(
      "[Redis] Missing env vars. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN."
    );
    return null;
  }

  _client = new Redis({ url, token });
  return _client;
}

export const redis = new Proxy(
  {},
  {
    get(_, prop) {
      const client = getClient();
      if (!client) {
        // Return a no-op async function so callers don't crash
        // when Redis is not configured (graceful degradation).
        if (typeof prop === "string") {
          return async () => null;
        }
        return undefined;
      }
      const value = client[prop];
      return typeof value === "function" ? value.bind(client) : value;
    },
  }
);
