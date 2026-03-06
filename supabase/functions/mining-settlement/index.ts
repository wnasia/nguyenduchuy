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

    // Verify admin or cron caller
    const authHeader = req.headers.get("Authorization");
    const cronSecret = req.headers.get("x-cron-secret");
    
    if (!cronSecret && authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: claims } = await supabase.auth.getUser(token);
      
      if (claims.user) {
        const { data: isAdmin } = await supabase.rpc("has_role", {
          _user_id: claims.user.id,
          _role: "admin"
        });
        
        if (!isAdmin) {
          return new Response(
            JSON.stringify({ error: "Unauthorized" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
          );
        }
      }
    }

    // Get settlement date (yesterday by default, or from body)
    let settlementDate: string;
    try {
      const body = await req.json();
      settlementDate = body.date || getYesterday();
    } catch {
      settlementDate = getYesterday();
    }

    console.log(`Processing settlement for date: ${settlementDate}`);

    // Check if already settled
    const { data: existingSettlement } = await supabase
      .from("daily_settlements")
      .select("id")
      .eq("settlement_date", settlementDate)
      .maybeSingle();

    if (existingSettlement) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "already_settled",
          message: `Settlement for ${settlementDate} already exists` 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    // Calculate which phase we're in
    const phaseStartDate = new Date(config.phase_start_date);
    const currentDate = new Date(settlementDate);
    const daysSinceStart = Math.floor((currentDate.getTime() - phaseStartDate.getTime()) / (1000 * 60 * 60 * 24));
    
    let phase = 1;
    let dailyBudget: number;
    let viewsPerToken = config.base_views_per_token;

    if (daysSinceStart >= config.phase1_days) {
      phase = 2;
      dailyBudget = config.phase2_budget / config.phase2_days;
      
      // Calculate difficulty increase for phase 2
      const phase2Days = daysSinceStart - config.phase1_days;
      const sixMonthPeriods = Math.floor(phase2Days / 180);
      for (let i = 0; i < sixMonthPeriods; i++) {
        viewsPerToken = Math.ceil(viewsPerToken * (1 + config.difficulty_increase_percent / 100));
      }
    } else {
      dailyBudget = config.phase1_budget / config.phase1_days;
    }

    // Get all unsettled valid views for the date
    const { data: validViews, error: viewsError } = await supabase
      .from("valid_views")
      .select("id, user_id, post_id")
      .eq("view_date", settlementDate)
      .eq("settled", false);

    if (viewsError) {
      console.error("Error fetching valid views:", viewsError);
      return new Response(
        JSON.stringify({ success: false, error: viewsError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const totalValidViews = validViews?.length || 0;
    
    if (totalValidViews === 0) {
      // Create settlement record with 0 distribution
      const { data: settlement } = await supabase
        .from("daily_settlements")
        .insert({
          settlement_date: settlementDate,
          total_valid_views: 0,
          total_tokens_distributed: 0,
          tokens_per_view: 0,
          daily_budget: dailyBudget,
          phase,
          unique_users: 0,
        })
        .select()
        .single();

      // Update emission stats
      await updateEmissionStats(supabase, settlementDate, 0, 0, 0);

      return new Response(
        JSON.stringify({ 
          success: true, 
          settlementId: settlement?.id,
          totalViews: 0,
          tokensDistributed: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate tokens per view
    // Base: 10 views = 1 token, so 1 view = 0.1 token
    const baseTokensPerView = 1 / viewsPerToken;
    const maxPossibleDistribution = totalValidViews * baseTokensPerView;
    
    let tokensPerView: number;
    let totalTokensToDistribute: number;

    if (maxPossibleDistribution > dailyBudget) {
      // Proportional reduction
      tokensPerView = dailyBudget / totalValidViews;
      totalTokensToDistribute = dailyBudget;
    } else {
      tokensPerView = baseTokensPerView;
      totalTokensToDistribute = maxPossibleDistribution;
    }

    // Group views by user
    const userViews: Record<string, number> = {};
    const uniqueUsers = new Set<string>();

    for (const view of validViews) {
      if (view.user_id) {
        userViews[view.user_id] = (userViews[view.user_id] || 0) + 1;
        uniqueUsers.add(view.user_id);
      }
    }

    // Create settlement record
    const { data: settlement, error: settlementError } = await supabase
      .from("daily_settlements")
      .insert({
        settlement_date: settlementDate,
        total_valid_views: totalValidViews,
        total_tokens_distributed: totalTokensToDistribute,
        tokens_per_view: tokensPerView,
        daily_budget: dailyBudget,
        phase,
        unique_users: uniqueUsers.size,
      })
      .select()
      .single();

    if (settlementError) {
      console.error("Error creating settlement:", settlementError);
      return new Response(
        JSON.stringify({ success: false, error: settlementError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Distribute tokens to each user
    for (const [userId, viewCount] of Object.entries(userViews)) {
      const userReward = viewCount * tokensPerView;
      
      // Get current balance
      const { data: balance } = await supabase
        .from("token_balances")
        .select("id, balance, total_earned, total_valid_views")
        .eq("user_id", userId)
        .maybeSingle();

      if (balance) {
        const newBalance = parseFloat(balance.balance) + userReward;
        const newTotalEarned = parseFloat(balance.total_earned) + userReward;
        const newTotalViews = balance.total_valid_views + viewCount;

        // Update balance
        await supabase
          .from("token_balances")
          .update({
            balance: newBalance,
            total_earned: newTotalEarned,
            total_valid_views: newTotalViews,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        // Create ledger entry
        await supabase
          .from("token_ledger")
          .insert({
            user_id: userId,
            transaction_type: "mining_reward",
            amount: userReward,
            balance_after: newBalance,
            settlement_id: settlement.id,
            description: `Mining reward for ${viewCount} valid views on ${settlementDate}`,
          });
      } else {
        // Create new balance record
        await supabase
          .from("token_balances")
          .insert({
            user_id: userId,
            balance: userReward,
            total_earned: userReward,
            total_valid_views: viewCount,
          });

        await supabase
          .from("token_ledger")
          .insert({
            user_id: userId,
            transaction_type: "mining_reward",
            amount: userReward,
            balance_after: userReward,
            settlement_id: settlement.id,
            description: `Mining reward for ${viewCount} valid views on ${settlementDate}`,
          });
      }

      // Update tokens_earned in valid_views
      await supabase
        .from("valid_views")
        .update({ 
          tokens_earned: tokensPerView,
          settled: true 
        })
        .eq("user_id", userId)
        .eq("view_date", settlementDate);
    }

    // Mark anonymous views as settled
    await supabase
      .from("valid_views")
      .update({ settled: true })
      .is("user_id", null)
      .eq("view_date", settlementDate);

    // Update emission stats
    await updateEmissionStats(supabase, settlementDate, totalTokensToDistribute, totalValidViews, uniqueUsers.size);

    console.log(`Settlement complete: ${totalValidViews} views, ${totalTokensToDistribute.toFixed(8)} tokens distributed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        settlementId: settlement.id,
        date: settlementDate,
        phase,
        totalViews: totalValidViews,
        tokensPerView: tokensPerView,
        tokensDistributed: totalTokensToDistribute,
        uniqueUsers: uniqueUsers.size,
        dailyBudget,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Settlement error:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

function getYesterday(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split("T")[0];
}

async function updateEmissionStats(
  supabase: any, 
  date: string, 
  tokensIssued: number, 
  validViews: number, 
  uniqueReaders: number
) {
  // Get previous cumulative total
  const { data: prevStats } = await supabase
    .from("emission_stats")
    .select("cumulative_tokens_issued")
    .lt("stat_date", date)
    .order("stat_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const prevCumulative = prevStats?.cumulative_tokens_issued || 0;
  const newCumulative = parseFloat(prevCumulative) + tokensIssued;

  // Get average read time from sessions
  const { data: avgData } = await supabase
    .from("reading_sessions")
    .select("total_active_seconds")
    .eq("is_valid", true)
    .gte("created_at", `${date}T00:00:00`)
    .lt("created_at", `${date}T23:59:59`);

  const avgReadTime = avgData?.length > 0
    ? Math.round(avgData.reduce((sum: number, s: any) => sum + s.total_active_seconds, 0) / avgData.length)
    : 0;

  await supabase
    .from("emission_stats")
    .upsert({
      stat_date: date,
      total_tokens_issued: tokensIssued,
      cumulative_tokens_issued: newCumulative,
      total_valid_views: validViews,
      unique_readers: uniqueReaders,
      average_read_time: avgReadTime,
    }, { onConflict: "stat_date" });
}
