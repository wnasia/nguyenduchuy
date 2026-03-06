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

    console.log(`Heartbeat received - IP: ${clientIP}, User: ${userId || 'anonymous'}, Fingerprint: ${fingerprint.substring(0, 10)}...`);

    const payload: HeartbeatPayload = await req.json();
    const { sessionId, postId, isVisible, activeSeconds } = payload;

    if (!postId) {
      return new Response(
        JSON.stringify({ success: false, error: "missing_post_id" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Check if IP/fingerprint is blocked
    const { data: blocked } = await supabase
      .from("blocked_entities")
      .select("id")
      .or(`and(entity_type.eq.ip,entity_value.eq.${clientIP}),and(entity_type.eq.fingerprint,entity_value.eq.${fingerprint})`)
      .maybeSingle();

    if (blocked) {
      console.log(`Blocked entity detected - IP: ${clientIP}, Fingerprint: ${fingerprint}`);
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

    // Check for existing valid view today (1 per IP+fingerprint+post per 24h)
    const today = new Date().toISOString().split("T")[0];
    const { data: existingValidView } = await supabase
      .from("valid_views")
      .select("id")
      .eq("ip_address", clientIP)
      .eq("fingerprint", fingerprint)
      .eq("post_id", postId)
      .eq("view_date", today)
      .maybeSingle();

    const alreadyCounted = !!existingValidView;

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
          alreadyCounted,
        });
      }

      // Update existing session
      const newHeartbeatCount = existingSession.heartbeat_count + 1;
      
      // Always update user_id if we have one (user might have logged in after starting to read)
      const { error: updateError } = await supabase
        .from("reading_sessions")
        .update({
          last_heartbeat: new Date().toISOString(),
          heartbeat_count: newHeartbeatCount,
          total_active_seconds: activeSeconds,
          is_tab_visible: isVisible,
          user_id: userId || existingSession.user_id, // Preserve existing user_id if current is null
        })
        .eq("id", sessionId);

      if (updateError) {
        console.error("Update session error:", updateError);
      }

      // Check if view is now valid (>= min read time and enough heartbeats)
      const minHeartbeats = Math.max(2, Math.floor(config.min_read_time_seconds / config.heartbeat_interval_seconds) - 1);
      const isValidView = 
        activeSeconds >= config.min_read_time_seconds &&
        newHeartbeatCount >= minHeartbeats;

      if (isValidView && existingSession.is_valid !== true && !alreadyCounted) {
        console.log(`Valid view achieved - Session: ${sessionId}, Seconds: ${activeSeconds}, Heartbeats: ${newHeartbeatCount}`);
        
        // Mark session as valid
        await supabase
          .from("reading_sessions")
          .update({ is_valid: true })
          .eq("id", sessionId);

        // Create valid view record - use the user_id from either current or session
        const viewUserId = userId || existingSession.user_id;
        const { error: viewError } = await supabase
          .from("valid_views")
          .insert({
            user_id: viewUserId,
            post_id: postId,
            session_id: sessionId,
            ip_address: clientIP,
            fingerprint: fingerprint,
            view_date: today,
            settled: false,
            tokens_earned: 0,
          });

        if (viewError) {
          // Might be duplicate, check if it's a unique constraint violation
          if (viewError.code !== '23505') {
            console.error("Error creating valid view:", viewError);
          }
        } else {
          console.log(`Valid view created for user: ${viewUserId || 'anonymous'}, post: ${postId}`);
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          sessionId,
          activeSeconds,
          isValid: isValidView || alreadyCounted,
          minRequired: config.min_read_time_seconds,
          alreadyCounted,
          heartbeatCount: newHeartbeatCount,
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
        alreadyCounted,
      });
    }
  } catch (error) {
    console.error("Heartbeat error:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
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
    alreadyCounted: boolean;
  }
) {
  const { userId, postId, clientIP, fingerprint, userAgent, isVisible, config, alreadyCounted } = params;

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
      is_valid: null,
      total_active_seconds: 0,
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

  console.log(`New session created: ${newSession.id} for user: ${userId || 'anonymous'}, post: ${postId}`);

  return new Response(
    JSON.stringify({ 
      success: true, 
      sessionId: newSession.id,
      activeSeconds: 0,
      isValid: false,
      alreadyCounted,
      minRequired: config.min_read_time_seconds,
      heartbeatCount: 1,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
