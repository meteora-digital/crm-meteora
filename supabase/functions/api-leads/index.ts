import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Simple API key auth
  const apiKey = req.headers.get("x-api-key");
  const expectedKey = Deno.env.get("LEADS_API_KEY");

  if (!expectedKey) {
    return new Response(JSON.stringify({ error: "API not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (apiKey !== expectedKey) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // POST: create a new lead
    if (req.method === "POST") {
      const body = await req.json().catch(() => null);
      if (!body || typeof body !== "object") {
        return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const name = (body.name ?? "").toString().trim();
      if (!name) {
        return new Response(JSON.stringify({ error: "Field 'name' is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const allowedStatus = ["mql", "sql", "oportunidade", "ganho", "perdido"];
      const allowedSource = ["manual", "import", "website", "referral", "event", "social", "other"];
      const status = allowedStatus.includes(body.status) ? body.status : "mql";
      const source = allowedSource.includes(body.source) ? body.source : "website";

      // System user id used as created_by for API-originated leads
      const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";

      const insertPayload: Record<string, unknown> = {
        name,
        email: body.email ? String(body.email).trim() : null,
        phone: body.phone ? String(body.phone).trim() : null,
        company: body.company ? String(body.company).trim() : null,
        notes: body.notes ? String(body.notes) : null,
        status,
        source,
        revenue_potential: body.revenue_potential != null ? Number(body.revenue_potential) || 0 : 0,
        partner_id: body.partner_id ? String(body.partner_id) : null,
        utm_source: body.utm_source ? String(body.utm_source) : null,
        utm_medium: body.utm_medium ? String(body.utm_medium) : null,
        utm_campaign: body.utm_campaign ? String(body.utm_campaign) : null,
        utm_term: body.utm_term ? String(body.utm_term) : null,
        utm_content: body.utm_content ? String(body.utm_content) : null,
        created_by: SYSTEM_USER_ID,
      };

      const { data: created, error: insertError } = await supabase
        .from("leads")
        .insert(insertPayload)
        .select()
        .single();

      if (insertError) {
        console.error("Insert error:", insertError.message);
        return new Response(JSON.stringify({ error: "Failed to create lead", details: insertError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ lead: created }), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const since = url.searchParams.get("since"); // ISO date filter

    let query = supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }
    if (since) {
      query = query.gte("updated_at", since);
    }

    const { data, error } = await query;

    if (error) {
      console.error("DB error:", error.message);
      return new Response(JSON.stringify({ error: "Failed to fetch leads" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Also fetch payments for each lead
    const leadIds = (data || []).map((l: any) => l.id);
    let payments: any[] = [];
    if (leadIds.length > 0) {
      const { data: payData } = await supabase
        .from("lead_payments")
        .select("*")
        .in("lead_id", leadIds)
        .order("due_date", { ascending: true });
      payments = payData || [];
    }

    // Attach payments to leads
    const leadsWithPayments = (data || []).map((lead: any) => ({
      ...lead,
      payments: payments.filter((p: any) => p.lead_id === lead.id),
    }));

    return new Response(JSON.stringify({ leads: leadsWithPayments, count: leadsWithPayments.length }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
