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
