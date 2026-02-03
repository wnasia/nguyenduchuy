import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "overview";

    // Get tokenomics config
    const { data: config } = await supabase
      .from("tokenomics_config")
      .select("*")
      .eq("is_active", true)
      .single();

    if (!config) {
      return new Response(
        JSON.stringify({ success: false, error: "config_not_found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Calculate current phase
    const phaseStartDate = new Date(config.phase_start_date);
    const currentDate = new Date();
    const daysSinceStart = Math.floor((currentDate.getTime() - phaseStartDate.getTime()) / (1000 * 60 * 60 * 24));
    
    let phase = 1;
    let dailyBudget: number;
    let viewsPerToken = config.base_views_per_token;
    let daysRemaining: number;

    if (daysSinceStart >= config.phase1_days) {
      phase = 2;
      dailyBudget = config.phase2_budget / config.phase2_days;
      daysRemaining = config.phase1_days + config.phase2_days - daysSinceStart;
      
      // Calculate difficulty for phase 2
      const phase2Days = daysSinceStart - config.phase1_days;
      const sixMonthPeriods = Math.floor(phase2Days / 180);
      for (let i = 0; i < sixMonthPeriods; i++) {
        viewsPerToken = Math.ceil(viewsPerToken * (1 + config.difficulty_increase_percent / 100));
      }
    } else {
      dailyBudget = config.phase1_budget / config.phase1_days;
      daysRemaining = config.phase1_days - daysSinceStart;
    }

    if (type === "overview") {
      // Get total tokens issued
      const { data: totalIssued } = await supabase
        .from("emission_stats")
        .select("cumulative_tokens_issued")
        .order("stat_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Get today's valid views
      const today = new Date().toISOString().split("T")[0];
      const { count: todayViews } = await supabase
        .from("valid_views")
        .select("id", { count: "exact" })
        .eq("view_date", today);

      // Get total valid views all time
      const { data: totalViewsData } = await supabase
        .from("emission_stats")
        .select("total_valid_views");
      
      const totalViews = totalViewsData?.reduce((sum, s) => sum + (s.total_valid_views || 0), 0) || 0;

      // Get active readers today
      const { count: activeReaders } = await supabase
        .from("reading_sessions")
        .select("user_id", { count: "exact" })
        .gte("created_at", `${today}T00:00:00`)
        .not("user_id", "is", null);

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            totalSupply: config.total_supply,
            totalIssued: parseFloat(totalIssued?.cumulative_tokens_issued || 0),
            remainingSupply: config.total_supply - parseFloat(totalIssued?.cumulative_tokens_issued || 0),
            currentPhase: phase,
            dailyBudget,
            viewsPerToken,
            tokensPerView: 1 / viewsPerToken,
            daysRemaining,
            todayValidViews: todayViews || 0,
            totalValidViews: totalViews,
            activeReaders: activeReaders || 0,
            phaseStartDate: config.phase_start_date,
            minReadTime: config.min_read_time_seconds,
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (type === "history") {
      const days = parseInt(url.searchParams.get("days") || "30");
      
      const { data: history } = await supabase
        .from("emission_stats")
        .select("*")
        .order("stat_date", { ascending: false })
        .limit(days);

      return new Response(
        JSON.stringify({ success: true, data: history || [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (type === "settlements") {
      const days = parseInt(url.searchParams.get("days") || "30");
      
      const { data: settlements } = await supabase
        .from("daily_settlements")
        .select("*")
        .order("settlement_date", { ascending: false })
        .limit(days);

      return new Response(
        JSON.stringify({ success: true, data: settlements || [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (type === "user") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(
          JSON.stringify({ success: false, error: "unauthorized" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
        );
      }

      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabase.auth.getUser(token);
      
      if (!userData.user) {
        return new Response(
          JSON.stringify({ success: false, error: "unauthorized" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
        );
      }

      const userId = userData.user.id;

      // Get user balance
      const { data: balance } = await supabase
        .from("token_balances")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      // Get today's valid views
      const today = new Date().toISOString().split("T")[0];
      const { count: todayViews } = await supabase
        .from("valid_views")
        .select("id", { count: "exact" })
        .eq("user_id", userId)
        .eq("view_date", today);

      // Get recent transactions
      const { data: transactions } = await supabase
        .from("token_ledger")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      // Get reading history
      const { data: readingHistory } = await supabase
        .from("valid_views")
        .select(`
          id,
          view_date,
          tokens_earned,
          created_at,
          post_id,
          posts (title)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            balance: balance?.balance || 0,
            totalEarned: balance?.total_earned || 0,
            totalValidViews: balance?.total_valid_views || 0,
            todayViews: todayViews || 0,
            transactions: transactions || [],
            readingHistory: readingHistory || [],
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "invalid_type" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );

  } catch (error) {
    console.error("Stats error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
