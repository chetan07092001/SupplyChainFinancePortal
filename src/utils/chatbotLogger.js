/**
 * Chatbot Logger with Security Redaction
 * Ensures sensitive data (OTPs, tokens, passwords, raw credentials)
 * are never transmitted to log servers or written in plain text.
 */

const LOG_SERVER = "http://localhost:9001/log";

const SENSITIVE_KEYS = [
  "otp",
  "otpcode",
  "otpvalue",
  "token",
  "authorization",
  "password",
  "secret",
  "apikey",
  "api_key",
];

export function maskSensitiveData(value, depth = 0) {
  if (depth > 5 || value === null || value === undefined) return value;
  if (typeof value === "string") {
    // Redact 6-digit standalone OTP strings
    if (/^\d{6}$/.test(value.trim())) return "[REDACTED_SECRET]";
    return value;
  }
  if (typeof value !== "object") return value;

  if (Array.isArray(value)) {
    return value.map((item) => maskSensitiveData(item, depth + 1));
  }

  const sanitized = {};
  for (const [k, v] of Object.entries(value)) {
    const lowerKey = k.toLowerCase().replace(/[^a-z]/g, "");
    if (SENSITIVE_KEYS.some((s) => lowerKey.includes(s))) {
      sanitized[k] = "[REDACTED_SECRET]";
    } else {
      sanitized[k] = maskSensitiveData(v, depth + 1);
    }
  }
  return sanitized;
}

export const sanitizePayload = maskSensitiveData;

export function logChatbot(label, payload) {
  if (process.env.NODE_ENV !== "development") return;
  try {
    const cleanPayload = sanitizePayload(payload);
    fetch(LOG_SERVER, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ time: new Date().toISOString(), label, payload: cleanPayload }),
    }).catch(() => {});
  } catch (e) {
    // Silent catch — never interfere with UI runtime
  }
}
