import { redis } from "@/lib/redis";

const METRICS_TTL_SECONDS = 35 * 24 * 60 * 60;

// Asia/Kolkata defines the product reporting day; metrics do not use per-user timezones.
function istDate() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const partMap = {};
  for (const part of formatter.formatToParts(now)) {
    if (part.type !== "literal") {
      partMap[part.type] = Number(part.value);
    }
  }

  const hasAllParts = ["year", "month", "day", "hour", "minute", "second"]
    .every((key) => Number.isFinite(partMap[key]));

  if (!hasAllParts) {
    return "unknown";
  }

  const istTime = new Date(Date.UTC(
    partMap.year,
    partMap.month - 1,
    partMap.day,
    partMap.hour,
    partMap.minute,
    partMap.second
  ));
  return istTime.toISOString().slice(0, 10);
}

/**
 * Increments a daily insights metric without affecting the caller on Redis failures.
 * @param {string} name Metric name.
 * @returns {Promise<void>}
 */
export async function incrementMetric(name) {
  try {
    const key = `metrics:insights:${name}:${istDate()}`;
    const script = `
      local count = redis.call("INCR", KEYS[1])
      if count == 1 then
        redis.call("EXPIRE", KEYS[1], ARGV[1])
      end
      return count
    `;
    await redis.eval(script, [key], [METRICS_TTL_SECONDS]);
  } catch (error) {
    console.error("[Metrics] Failed to increment insights metric:", error?.message || error);
  }
}
