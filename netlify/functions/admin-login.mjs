import { verifyAdminKey, jsonResponse } from "./_shared/admin-auth.mjs";
import { checkRateLimit } from "./_shared/rate-limit.mjs";

export default async (request) => {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  if (checkRateLimit(request).limited) {
    return jsonResponse({ error: "Too many attempts, try again shortly" }, { status: 429 });
  }

  const check = verifyAdminKey(request);
  if (!check.ok && check.reason === "not_configured") {
    return jsonResponse(
      { error: "ADMIN_KEY is not configured on this site yet" },
      { status: 500 },
    );
  }
  if (!check.ok) {
    return jsonResponse({ error: "Invalid admin key" }, { status: 401 });
  }

  return jsonResponse({ ok: true });
};

export const config = {
  path: "/api/admin-login",
};
