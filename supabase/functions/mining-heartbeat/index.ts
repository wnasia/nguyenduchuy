import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-fingerprint, x-session-id",
};

interface HeartbeatPayload {
  sessionId: string;
  postId: string;
  isVisible: boolean;
  activeSeconds: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get client info
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip") || 
                     "0.0.0.0";
    const fingerprint = req.headers.get("x-fingerprint") || "";
    const userAgent = req.headers.get("user-agent") || "";

    // Get user from auth header if present
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabase.auth.getUser(token);
      userId = data.user?.id || null;
    }

    const payload: HeartbeatPayload = await req.json();
    const { sessionId, postId, isVisible, activeSeconds } = payload;

    // Check if IP/fingerprint is blocked
    const { data: blocked } = await supabase
      .from("blocked_entities")
      .select("id")
      .or(`and(entity_type.eq.ip,entity_value.eq.${clientIP}),and(entity_type.eq.fingerprint,entity_value.eq.${fingerprint})`)
      .maybeSingle();

    if (blocked) {
      return new Response(
        JSON.stringify({ success: false, error: "blocked" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
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

    // Check if session exists
    if (sessionId) {
      // Get existing session
      const { data: existingSession, error: fetchError } = await supabase
        .from("reading_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (fetchError || !existingSession) {
        // Session might have expired, create new one
        return await createNewSession(supabase, {
          userId,
          postId,
          clientIP,
          fingerprint,
          userAgent,
          isVisible,
          config,
        });
      }

      // Update existing session
      const newHeartbeatCount = existingSession.heartbeat_count + 1;
      
      const { error: updateError } = await supabase
        .from("reading_sessions")
        .update({
          last_heartbeat: new Date().toISOString(),
          heartbeat_count: newHeartbeatCount,
          total_active_seconds: activeSeconds,
          is_tab_visible: isVisible,
          user_id: userId,
        })
        .eq("id", sessionId);

      if (updateError) {
        console.error("Update session error:", updateError);
      }

      // Check if view is now valid (>= min read time and enough heartbeats)
      const isValidView = 
        activeSeconds >= config.min_read_time_seconds &&
        newHeartbeatCount >= Math.floor(config.min_read_time_seconds / config.heartbeat_interval_seconds) - 1;

      if (isValidView && existingSession.is_valid !== true) {
        // Mark session as valid
        await supabase
          .from("reading_sessions")
          .update({ is_valid: true })
          .eq("id", sessionId);

        // Try to create valid view (unique constraint prevents duplicates)
        const today = new Date().toISOString().split("T")[0];
        await supabase
          .from("valid_views")
          .upsert({
            user_id: userId,
            post_id: postId,
            session_id: sessionId,
            ip_address: clientIP,
            fingerprint: fingerprint,
            view_date: today,
          }, { onConflict: "ip_address,fingerprint,post_id,view_date" });
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          sessionId,
          activeSeconds,
          isValid: isValidView,
          minRequired: config.min_read_time_seconds,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Create new session
      return await createNewSession(supabase, {
        userId,
        postId,
        clientIP,
        fingerprint,
        userAgent,
        isVisible,
        config,
      });
    }
  } catch (error) {
    console.error("Heartbeat error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

async function createNewSession(
  supabase: any,
  params: {
    userId: string | null;
    postId: string;
    clientIP: string;
    fingerprint: string;
    userAgent: string;
    isVisible: boolean;
    config: any;
  }
) {
  const { userId, postId, clientIP, fingerprint, userAgent, isVisible, config } = params;

  // Check for existing session today from same IP+fingerprint+post
  const today = new Date().toISOString().split("T")[0];
  const { data: existingView } = await supabase
    .from("valid_views")
    .select("id")
    .eq("ip_address", clientIP)
    .eq("fingerprint", fingerprint)
    .eq("post_id", postId)
    .eq("view_date", today)
    .maybeSingle();

  // Create new session
  const { data: newSession, error } = await supabase
    .from("reading_sessions")
    .insert({
      user_id: userId,
      post_id: postId,
      ip_address: clientIP,
      fingerprint: fingerprint,
      user_agent: userAgent,
      is_tab_visible: isVisible,
      heartbeat_count: 1,
      is_valid: existingView ? true : null, // Already has valid view today
    })
    .select()
    .single();

  if (error) {
    console.error("Create session error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      sessionId: newSession.id,
      activeSeconds: 0,
      isValid: false,
      alreadyCounted: !!existingView,
      minRequired: config.min_read_time_seconds,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
