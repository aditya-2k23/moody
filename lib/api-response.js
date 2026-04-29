import { NextResponse } from "next/server";

export function apiError({
  status = 500,
  code = "INTERNAL_ERROR",
  message = "Internal server error",
  retryAfter = null,
  details = null,
}) {
  const body = {
    error: message,
    code,
  };

  if (Number.isInteger(retryAfter) && retryAfter > 0) {
    body.retryAfter = retryAfter;
  }

  if (details && typeof details === "object") {
    body.details = details;
  }

  const headers = {};
  if (Number.isInteger(retryAfter) && retryAfter > 0) {
    headers["Retry-After"] = String(retryAfter);
  }

  return NextResponse.json(body, {
    status,
    headers,
  });
}
