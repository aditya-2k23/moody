import { redis } from "@/lib/redis";

function toPositiveInteger(value, fallback) {
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

export function getRequestIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  return realIp || "unknown";
}

export function getRateLimitIdentifier(request, userId) {
  if (typeof userId === "string" && userId.trim()) {
    return userId.trim();
  }

  return getRequestIp(request);
}

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
        await redis.del(key).catch(() => {});
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
