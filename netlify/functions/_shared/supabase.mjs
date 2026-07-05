import { createClient } from "@supabase/supabase-js";

// TODO(SUPABASE credentials): SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be
// set in Netlify site environment variables — get the real values from Codex
// (same shared Supabase project as the deep-water-growth / AI Growth Platform repo,
// per FREE-WEBSITE-REVIEW-BLUEPRINT.md). The service-role key bypasses RLS, so it
// must ONLY ever be read here (server-side, inside a Netlify Function) — never sent
// to the browser.
export function createAdminSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not configured");
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
