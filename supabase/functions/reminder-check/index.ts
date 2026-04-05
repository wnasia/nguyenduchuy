import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch enabled reminder rules
    const { data: rules, error: rulesError } = await supabase
      .from("reminder_rules")
      .select("*")
      .eq("is_enabled", true);

    if (rulesError) throw rulesError;
    if (!rules || rules.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: "No enabled rules" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch active customers
    const { data: customers, error: custError } = await supabase
      .from("customers")
      .select("*")
      .eq("is_active", true);

    if (custError) throw custError;
    if (!customers || customers.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: "No active customers" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch templates
    const { data: templates } = await supabase.from("reminder_templates").select("*");
    const templateMap: Record<string, any> = {};
    (templates || []).forEach((t: any) => { templateMap[t.template_key] = t; });

    const now = new Date();
    let sentCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const customer of customers) {
      for (const rule of rules) {
        // Check if rule applies to this customer
        if (!rule.applies_to_all && rule.customer_id && rule.customer_id !== customer.id) continue;

        const expiryTypes: Array<{ type: string; date: string | null; serviceName: string }> = [];
        if (rule.reminder_type === "hosting" || rule.reminder_type === "both") {
          expiryTypes.push({ type: "hosting", date: customer.hosting_expiry_date, serviceName: "Hosting" });
        }
        if (rule.reminder_type === "domain" || rule.reminder_type === "both") {
          expiryTypes.push({ type: "domain", date: customer.domain_expiry_date, serviceName: "Domain" });
        }

        for (const expiry of expiryTypes) {
          if (!expiry.date) continue;

          const expiryDate = new Date(expiry.date);
          const daysUntil = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          // Check if this rule matches (within 1 day tolerance)
          if (daysUntil < 0 || Math.abs(daysUntil - rule.days_before_expiry) > 1) continue;

          // Build message from template
          const templateKey = `${expiry.type}_${rule.days_before_expiry}`;
          const template = templateMap[templateKey];
          let title = template?.subject || `Reminder: ${expiry.serviceName} expiry in ${daysUntil} days`;
          let message = template?.body_template || `Your ${expiry.serviceName} service for ${customer.website_url || customer.customer_name} will expire in ${daysUntil} days. Please renew soon.`;

          // Replace placeholders
          const replacePlaceholders = (text: string) => text
            .replace(/\{\{customer_name\}\}/g, customer.customer_name || "")
            .replace(/\{\{website_url\}\}/g, customer.website_url || "")
            .replace(/\{\{hosting_expiry_date\}\}/g, customer.hosting_expiry_date || "")
            .replace(/\{\{domain_expiry_date\}\}/g, customer.domain_expiry_date || "")
            .replace(/\{\{days_remaining\}\}/g, String(daysUntil))
            .replace(/\{\{service_name\}\}/g, expiry.serviceName)
            .replace(/\{\{expiry_date\}\}/g, expiry.date || "");

          title = replacePlaceholders(title);
          message = replacePlaceholders(message);

          // Determine channels to send
          const channels: string[] = [];
          if (rule.channel === "both") { channels.push("email", "in_app"); }
          else { channels.push(rule.channel); }

          for (const channel of channels) {
            // Insert delivery record (unique index prevents duplicates)
            const { error: insertError } = await supabase
              .from("notification_deliveries")
              .insert({
                customer_id: customer.id,
                notification_type: "reminder",
                related_expiry_type: expiry.type,
                related_expiry_date: expiry.date,
                reminder_rule_id: rule.id,
                channel,
                title,
                message,
                send_status: channel === "in_app" ? "sent" : "pending",
                sent_at: channel === "in_app" ? new Date().toISOString() : null,
              });

            if (insertError) {
              if (insertError.code === "23505") {
                skippedCount++;
                continue; // Duplicate - already sent
              }
              console.error("Insert error:", insertError);
              errors.push(`${customer.customer_name}/${expiry.type}/${channel}: ${insertError.message}`);
              continue;
            }

            // For in_app: create notification in the notifications table if customer has auth_user_id
            if (channel === "in_app" && customer.auth_user_id) {
              await supabase.from("notifications").insert({
                user_id: customer.auth_user_id,
                type: "renewal_reminder",
                title,
                message,
              });
            }

            // For email: send actual email if customer has email
            if (channel === "email" && customer.email) {
              try {
                // Use Supabase's built-in email or log for manual sending
                // For now, mark as sent and log - actual email integration can be added
                console.log(`Email reminder queued for ${customer.email}: ${title}`);
                
                // Update delivery status to sent
                await supabase
                  .from("notification_deliveries")
                  .update({ send_status: "sent", sent_at: new Date().toISOString() })
                  .eq("customer_id", customer.id)
                  .eq("reminder_rule_id", rule.id)
                  .eq("related_expiry_type", expiry.type)
                  .eq("related_expiry_date", expiry.date)
                  .eq("channel", "email")
                  .eq("send_status", "pending");
              } catch (emailError: any) {
                console.error(`Email send failed for ${customer.email}:`, emailError);
                await supabase
                  .from("notification_deliveries")
                  .update({ send_status: "failed", error_message: emailError.message })
                  .eq("customer_id", customer.id)
                  .eq("reminder_rule_id", rule.id)
                  .eq("related_expiry_type", expiry.type)
                  .eq("related_expiry_date", expiry.date)
                  .eq("channel", "email")
                  .eq("send_status", "pending");
              }
            }

            sentCount++;
          }
        }
      }
    }

    return new Response(JSON.stringify({ 
      sent: sentCount, 
      skipped: skippedCount,
      checked: customers.length,
      rules: rules.length,
      errors: errors.length > 0 ? errors : undefined,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Reminder check error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
