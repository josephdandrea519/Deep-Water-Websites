// In-memory per-IP throttle for the admin endpoints. Single-operator tool with
// low expected traffic, so this doesn't need Redis/Upstash — it just needs to
// make brute-forcing ADMIN_KEY slow, not impossible. Resets on cold start,
// which is fine: the threat model here is "raise the bar," not "hard block."
const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 10;
const attempts = new Map();

export function checkRateLimit(req) {
  const ip =
    req.headers.get("x-nf-client-connection-ip") ||
    req.headers.get("x-forwarded-for") ||
    "unknown";
  const now = Date.now();
  const record = attempts.get(ip);

  if (!record || now - record.windowStart > WINDOW_MS) {
    attempts.set(ip, { windowStart: now, count: 1 });
    return { limited: false };
  }

  record.count += 1;
  return { limited: record.count > MAX_ATTEMPTS };
}
