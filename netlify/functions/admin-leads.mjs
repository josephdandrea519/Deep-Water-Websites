import { verifyAdminKey, jsonResponse } from "./_shared/admin-auth.mjs";
import { createAdminSupabaseClient } from "./_shared/supabase.mjs";
import { checkRateLimit } from "./_shared/rate-limit.mjs";

const VALID_TEMPERATURES = new Set(["cold", "cool", "warm", "hot"]);

export default async (request) => {
  if (checkRateLimit(request).limited) {
    return jsonResponse({ error: "Too many attempts, try again shortly" }, { status: 429 });
  }

  const check = verifyAdminKey(request);
  if (!check.ok && check.reason === "not_configured") {
    return jsonResponse({ error: "ADMIN_KEY is not configured on this site yet" }, { status: 500 });
  }
  if (!check.ok) {
    return jsonResponse({ error: "Invalid admin key" }, { status: 401 });
  }

  let supabase;
  try {
    supabase = createAdminSupabaseClient();
  } catch (err) {
    return jsonResponse({ error: "Supabase is not configured on this site yet" }, { status: 500 });
  }

  if (request.method === "GET") {
    return handleList(supabase);
  }
  if (request.method === "PATCH") {
    return handleUpdate(supabase, request);
  }
  return jsonResponse({ error: "Method not allowed" }, { status: 405 });
};

async function handleList(supabase) {
  // NOTE: unverified against a real Supabase project — no credentials existed at
  // write time. `crm_leads` is one row per business (unique on business_id), so
  // it's embedded under `businesses`, not directly under `audit_requests`.
  const { data, error } = await supabase
    .from("audit_requests")
    .select(
      `
      id,
      request_token,
      status,
      tier,
      created_at,
      completed_at,
      contact_email,
      business:businesses (
        id,
        name,
        city,
        state,
        category,
        crm_leads ( id, temperature, lead_score, status, owner_notes, next_action, next_action_at )
      ),
      audit_scores ( overall_score )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return jsonResponse({ error: error.message }, { status: 500 });
  }

  const leads = (data || []).map((row) => {
    const business = row.business || {};
    const crmLead = firstRelated(business.crm_leads);
    const score = firstRelated(row.audit_scores);
    return {
      auditRequestId: row.id,
      requestToken: row.request_token,
      auditStatus: row.status,
      tier: row.tier,
      submittedAt: row.created_at,
      completedAt: row.completed_at,
      contactEmail: row.contact_email,
      businessId: business.id ?? null,
      business: business.name ?? null,
      city: [business.city, business.state].filter(Boolean).join(", "),
      category: business.category ?? null,
      overallScore: score ? score.overall_score : null,
      crmLeadId: crmLead ? crmLead.id : null,
      temperature: crmLead ? crmLead.temperature : "cool",
      leadStatus: crmLead ? crmLead.status : "new",
      ownerNotes: crmLead ? crmLead.owner_notes : "",
      nextAction: crmLead ? crmLead.next_action : "",
      nextActionAt: crmLead ? crmLead.next_action_at : null,
    };
  });

  return jsonResponse({ leads });
}

async function handleUpdate(supabase, request) {
  const body = await request.json().catch(() => null);
  if (!body || !body.businessId) {
    return jsonResponse({ error: "businessId is required" }, { status: 400 });
  }

  const patch = {
    business_id: body.businessId,
  };
  if (body.status !== undefined) patch.status = body.status;
  if (body.temperature !== undefined) {
    if (!VALID_TEMPERATURES.has(body.temperature)) {
      return jsonResponse({ error: "Invalid temperature value" }, { status: 400 });
    }
    patch.temperature = body.temperature;
  }
  if (body.ownerNotes !== undefined) patch.owner_notes = body.ownerNotes;
  if (body.nextAction !== undefined) patch.next_action = body.nextAction;
  if (body.nextActionAt !== undefined) patch.next_action_at = body.nextActionAt || null;
  if (body.latestAuditRequestId !== undefined) patch.latest_audit_request_id = body.latestAuditRequestId;

  const { data, error } = await supabase
    .from("crm_leads")
    .upsert(patch, { onConflict: "business_id" })
    .select()
    .single();

  if (error) {
    return jsonResponse({ error: error.message }, { status: 500 });
  }

  return jsonResponse({ crmLead: data });
}

function firstRelated(value) {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

export const config = {
  path: "/api/admin-leads",
};
