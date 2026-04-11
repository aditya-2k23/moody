
/**
 * Validates if a chatId is properly scoped to a specific user.
 * Patterns expected: chat_${uid}_...
 */
export function isChatIdScopedToUser(chatId, uid) {
  return (
    typeof chatId === "string" &&
    chatId.length >= 8 &&
    chatId.length <= 200 &&
    !chatId.includes("/") &&
    chatId.startsWith(`chat_${uid}_`)
  );
}

/**
 * Validates if a sessionId is valid.
 * A reasonable pattern/length: 1-256 chars, no control/newline characters.
 */
export function isValidSessionId(sessionId) {
  return (
    typeof sessionId === "string" &&
    sessionId.trim().length > 0 &&
    sessionId.length <= 256 &&
    !/[\r\n\x00-\x1F\x7F]/.test(sessionId)
  );
}

/**
 * Standard string validation for shared fields.
 */
export function isValidString(val, { min = 1, max = 5000, trim = true } = {}) {
  if (typeof val !== "string") return false;
  const processed = trim ? val.trim() : val;
  return processed.length >= min && processed.length <= max;
}
