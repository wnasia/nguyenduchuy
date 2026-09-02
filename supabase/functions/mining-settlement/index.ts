import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

type Client = ReturnType<typeof createClient>;

interface DateResult {
  date: string;
  totalViews: number;
  tokensPerView: number;
  tokensDistributed: number;
  uniqueUsers: number;
  phase: number;
  dailyBudget: number;
  reusedSettlement: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ---- Auth: allow cron secret, otherwise require admin ----
    const authHeader = req.headers.get("Authorization");
    const cronSecret = req.headers.get("x-cron-secret");

    if (!cronSecret && authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: claims } = await supabase.auth.getUser(token);

      if (claims.user) {
        const { data: isAdmin } = await supabase.rpc("has_role", {
          _user_id: claims.user.id,
          _role: "admin",
        });

        if (!isAdmin) {
          return json({ success: false, error: "Unauthorized" }, 403);
        }
      }
    }

    // ---- Parse body ----
    let requestedDate: string | undefined;
    try {
      const body = await req.json();
      requestedDate = body?.date;
    } catch {
      requestedDate = undefined;
    }

    const { data: config } = await supabase
      .from("tokenomics_config")
      .select("*")
      .eq("is_active", true)
      .single();

    if (!config) {
      return json({ success: false, error: "config_not_found" }, 500);
    }

    // ---- Determine which dates to settle ----
    let dates: string[];
    if (requestedDate) {
      dates = [requestedDate];
    } else {
      // Every date (up to and including yesterday) that still has unsettled valid views.
      const today = new Date().toISOString().slice(0, 10);
      const { data: pending, error: pendingError } = await supabase
        .from("valid_views")
        .select("view_date")
        .eq("settled", false)
        .lt("view_date", today)
        .order("view_date", { ascending: true })
        .limit(10000);

      if (pendingError) {
        return json({ success: false, error: pendingError.message }, 500);
      }

      dates = [...new Set((pending ?? []).map((r: { view_date: string }) => r.view_date))];
    }

    if (dates.length === 0) {
      return json({
        success: true,
        message: "no_pending_views",
        datesProcessed: 0,
        totalViews: 0,
        tokensDistributed: 0,
        uniqueUsers: 0,
        results: [],
      });
    }

    const results: DateResult[] = [];
    for (const date of dates) {
      results.push(await settleDate(supabase, config, date));
    }

    const totalViews = results.reduce((s, r) => s + r.totalViews, 0);
    const tokensDistributed = results.reduce((s, r) => s + r.tokensDistributed, 0);
    const uniqueUsers = Math.max(0, ...results.map((r) => r.uniqueUsers));

    return json({
      success: true,
      datesProcessed: results.length,
      dates,
      date: dates[dates.length - 1],
      totalViews,
      tokensDistributed,
      tokensPerView: results.at(-1)?.tokensPerView ?? 0,
      uniqueUsers,
      phase: results.at(-1)?.phase ?? 1,
      dailyBudget: results.at(-1)?.dailyBudget ?? 0,
      results,
    });
  } catch (error) {
    console.error("Settlement error:", error);
    return json({ success: false, error: (error as Error).message }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

async function settleDate(
  supabase: Client,
  // deno-lint-ignore no-explicit-any
  config: any,
  settlementDate: string,
): Promise<DateResult> {
  console.log(`Processing settlement for date: ${settlementDate}`);

  // ---- Phase & budget ----
  const phaseStartDate = new Date(config.phase_start_date);
  const currentDate = new Date(settlementDate);
  const daysSinceStart = Math.floor(
    (currentDate.getTime() - phaseStartDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  let phase = 1;
  let dailyBudget: number;
  let viewsPerToken = config.base_views_per_token;

  if (daysSinceStart >= config.phase1_days) {
    phase = 2;
    dailyBudget = config.phase2_budget / config.phase2_days;
    const phase2Days = daysSinceStart - config.phase1_days;
    const sixMonthPeriods = Math.floor(phase2Days / 180);
    for (let i = 0; i < sixMonthPeriods; i++) {
      viewsPerToken = Math.ceil(viewsPerToken * (1 + config.difficulty_increase_percent / 100));
    }
  } else {
    dailyBudget = config.phase1_budget / config.phase1_days;
  }

  // ---- Unsettled views for that date ----
  const { data: validViews, error: viewsError } = await supabase
    .from("valid_views")
    .select("id, user_id")
    .eq("view_date", settlementDate)
    .eq("settled", false)
    .limit(10000);

  if (viewsError) throw new Error(viewsError.message);

  const views = validViews ?? [];
  const totalValidViews = views.length;

  // Existing settlement row for this date (re-run / leftover case)
  const { data: existingSettlement } = await supabase
    .from("daily_settlements")
    .select("id, total_valid_views, total_tokens_distributed, unique_users")
    .eq("settlement_date", settlementDate)
    .maybeSingle();

  if (totalValidViews === 0) {
    if (!existingSettlement) {
      await supabase.from("daily_settlements").insert({
        settlement_date: settlementDate,
        total_valid_views: 0,
        total_tokens_distributed: 0,
        tokens_per_view: 0,
        daily_budget: dailyBudget,
        phase,
        unique_users: 0,
      });
      await updateEmissionStats(supabase, settlementDate, 0, 0, 0);
    }
    return {
      date: settlementDate,
      totalViews: 0,
      tokensPerView: 0,
      tokensDistributed: 0,
      uniqueUsers: 0,
      phase,
      dailyBudget,
      reusedSettlement: !!existingSettlement,
    };
  }

  // ---- Token math ----
  const baseTokensPerView = 1 / viewsPerToken;
  const maxPossibleDistribution = totalValidViews * baseTokensPerView;

  let tokensPerView: number;
  let totalTokensToDistribute: number;

  if (maxPossibleDistribution > dailyBudget) {
    tokensPerView = dailyBudget / totalValidViews;
    totalTokensToDistribute = dailyBudget;
  } else {
    tokensPerView = baseTokensPerView;
    totalTokensToDistribute = maxPossibleDistribution;
  }

  // ---- Group by user ----
  const userViewIds: Record<string, string[]> = {};
  const anonViewIds: string[] = [];

  for (const view of views as { id: string; user_id: string | null }[]) {
    if (view.user_id) {
      (userViewIds[view.user_id] ??= []).push(view.id);
    } else {
      anonViewIds.push(view.id);
    }
  }

  const uniqueUsers = Object.keys(userViewIds).length;

  // ---- Settlement record (create or update existing) ----
  let settlementId: string;
  if (existingSettlement) {
    settlementId = existingSettlement.id;
    await supabase
      .from("daily_settlements")
      .update({
        total_valid_views: (existingSettlement.total_valid_views ?? 0) + totalValidViews,
        total_tokens_distributed:
          parseFloat(String(existingSettlement.total_tokens_distributed ?? 0)) +
          totalTokensToDistribute,
        tokens_per_view: tokensPerView,
        daily_budget: dailyBudget,
        phase,
        unique_users: Math.max(existingSettlement.unique_users ?? 0, uniqueUsers),
      })
      .eq("id", settlementId);
  } else {
    const { data: settlement, error: settlementError } = await supabase
      .from("daily_settlements")
      .insert({
        settlement_date: settlementDate,
        total_valid_views: totalValidViews,
        total_tokens_distributed: totalTokensToDistribute,
        tokens_per_view: tokensPerView,
        daily_budget: dailyBudget,
        phase,
        unique_users: uniqueUsers,
      })
      .select()
      .single();

    if (settlementError) throw new Error(settlementError.message);
    settlementId = settlement.id;
  }

  // ---- Distribute ----
  for (const [userId, viewIds] of Object.entries(userViewIds)) {
    const viewCount = viewIds.length;
    const userReward = viewCount * tokensPerView;

    const { data: balance } = await supabase
      .from("token_balances")
      .select("id, balance, total_earned, total_valid_views")
      .eq("user_id", userId)
      .maybeSingle();

    let newBalance = userReward;
    if (balance) {
      newBalance = parseFloat(String(balance.balance)) + userReward;
      await supabase
        .from("token_balances")
        .update({
          balance: newBalance,
          total_earned: parseFloat(String(balance.total_earned)) + userReward,
          total_valid_views: (balance.total_valid_views ?? 0) + viewCount,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
    } else {
      await supabase.from("token_balances").insert({
        user_id: userId,
        balance: userReward,
        total_earned: userReward,
        total_valid_views: viewCount,
      });
    }

    await supabase.from("token_ledger").insert({
      user_id: userId,
      transaction_type: "mining_reward",
      amount: userReward,
      balance_after: newBalance,
      settlement_id: settlementId,
      description: `Mining reward for ${viewCount} valid views on ${settlementDate}`,
    });

    // Mark ONLY the views included in this settlement
    await supabase
      .from("valid_views")
      .update({ tokens_earned: tokensPerView, settled: true })
      .in("id", viewIds);
  }

  if (anonViewIds.length > 0) {
    await supabase.from("valid_views").update({ settled: true }).in("id", anonViewIds);
  }

  await updateEmissionStats(
    supabase,
    settlementDate,
    totalTokensToDistribute,
    totalValidViews,
    uniqueUsers,
  );

  console.log(
    `Settlement ${settlementDate}: ${totalValidViews} views, ${totalTokensToDistribute.toFixed(8)} tokens, ${uniqueUsers} users`,
  );

  return {
    date: settlementDate,
    totalViews: totalValidViews,
    tokensPerView,
    tokensDistributed: totalTokensToDistribute,
    uniqueUsers,
    phase,
    dailyBudget,
    reusedSettlement: !!existingSettlement,
  };
}

async function updateEmissionStats(
  supabase: Client,
  date: string,
  tokensIssued: number,
  validViews: number,
  uniqueReaders: number,
) {
  const { data: prevStats } = await supabase
    .from("emission_stats")
    .select("cumulative_tokens_issued")
    .lt("stat_date", date)
    .order("stat_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const newCumulative =
    parseFloat(String(prevStats?.cumulative_tokens_issued ?? 0)) + tokensIssued;

  const { data: avgData } = await supabase
    .from("reading_sessions")
    .select("total_active_seconds")
    .gte("created_at", `${date}T00:00:00Z`)
    .lte("created_at", `${date}T23:59:59Z`)
    .eq("is_valid", true);

  const avgReadTime = avgData && avgData.length > 0
    ? Math.round(
      avgData.reduce((sum: number, s: { total_active_seconds: number }) => sum + s.total_active_seconds, 0) /
        avgData.length,
    )
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
