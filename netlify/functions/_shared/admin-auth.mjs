import { createHash, timingSafeEqual } from "node:crypto";

// Shared admin-key check for all /api/admin-* functions. Single-operator tool —
// one shared secret (ADMIN_KEY env var in Netlify site settings), no per-user
// sessions or RLS. Checked on every request, not just login.

export function verifyAdminKey(req) {
  const expected = process.env.ADMIN_KEY;
  if (!expected) {
    return { ok: false, reason: "not_configured" };
  }
  const provided = req.headers.get("x-admin-key") || "";
  if (provided.length === 0 || !safeCompare(provided, expected)) {
    return { ok: false, reason: "invalid" };
  }
  return { ok: true };
}

// Hash both sides to a fixed-length digest before comparing so neither the
// early-exit on a plain `!==` nor a length mismatch on the raw strings can
// leak how many characters of the key were guessed correctly.
function safeCompare(a, b) {
  const hashA = createHash("sha256").update(a).digest();
  const hashB = createHash("sha256").update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

export function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
  });
}
