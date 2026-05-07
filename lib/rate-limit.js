import { redis } from "@/lib/redis";

/**
 * Converts a value to a positive integer, or returns a fallback if invalid.
 * @param {*} value - The value to convert.
 * @param {number} fallback - The fallback value.
 * @returns {number} The converted integer or fallback.
 */
function toPositiveInteger(value, fallback) {
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

/**
 * Extracts the client IP address from a request object, considering proxies.
 * @param {Request} request - The incoming request.
 * @returns {string} The resolved IP address.
 */
export function getRequestIp(request) {
  // Only trust x-forwarded-for if we're behind a trusted proxy (e.g. Vercel, Fly.io, Cloudflare)
  // which is usually the case in production for this app.
  // We prefer x-real-ip as it's harder to spoof if the proxy sets it correctly.
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ips = forwarded.split(",").map(ip => ip.trim()).filter(Boolean);
    // In many cloud environments, the last IP or the one before the last is the most trusted.
    // However, to balance security and compatibility, we take the first but prefer x-real-ip first.
    if (ips.length > 0) return ips[0];
  }

  return "unknown";
}

/**
 * Determines the identifier for rate limiting (either user ID or IP address).
 * @param {Request} request - The incoming request.
 * @param {string} [userId] - The optional user ID.
 * @returns {string} The identifier for rate limiting.
 */
export function getRateLimitIdentifier(request, userId) {
  if (typeof userId === "string" && userId.trim()) {
    return userId.trim();
  }

  return getRequestIp(request);
}

/**
 * Checks if a request exceeds the allowed rate limit using Redis.
 * @param {Object} params - The rate limit parameters.
 * @param {string} params.namespace - The namespace for the limit (e.g., "api").
 * @param {string} params.identifier - The unique identifier (e.g., IP or User ID).
 * @param {number} params.limit - The maximum number of allowed requests.
 * @param {number} params.windowSeconds - The time window in seconds.
 * @returns {Promise<{allowed: boolean, remaining: number|null, retryAfter: number}>} The rate limit check result.
 */
export async function checkRateLimit({ namespace, identifier, limit, windowSeconds }) {
  const safeNamespace = typeof namespace === "string" && namespace.trim() ? namespace.trim() : "api";
  const safeIdentifier = typeof identifier === "string" && identifier.trim() ? identifier.trim() : "anonymous";
  const safeLimit = toPositiveInteger(limit, 60);
  const safeWindow = toPositiveInteger(windowSeconds, 60);

  const key = `rate:${safeNamespace}:${safeIdentifier}`;

  try {
    const count = await redis.incr(key);

    // Gracefully allow traffic if Redis is unavailable.
    if (!Number.isInteger(count)) {
      return { allowed: true, remaining: null, retryAfter: 0 };
    }

    if (count === 1) {
      try {
        await redis.expire(key, safeWindow);
      } catch (expireError) {
        console.error("[Rate Limit] Failed to set TTL for key:", key, expireError);
        await redis.del(key).catch(() => { });
      }
    }

    const remaining = Math.max(safeLimit - count, 0);
    const ttl = await redis.ttl(key);
    const retryAfter = Number.isInteger(ttl) && ttl > 0 ? ttl : safeWindow;

    return {
      allowed: count <= safeLimit,
      remaining,
      retryAfter,
    };
  } catch (error) {
    console.warn("[Rate Limit] Failed to evaluate limit, allowing request:", error?.message || error);
    return { allowed: true, remaining: null, retryAfter: 0 };
  }
}
