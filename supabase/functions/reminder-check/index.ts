import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { buildRenewalEmail } from "../_shared/email-template.ts";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function sendEmailViaSmtp(
  to: string,
  subject: string,
  htmlBody: string
): Promise<{ success: boolean; error?: string }> {
  const smtpUser = Deno.env.get("SMTP_USER");
  const smtpPass = Deno.env.get("SMTP_PASS");
  if (!smtpUser || !smtpPass) {
    return { success: false, error: "SMTP_USER or SMTP_PASS not configured" };
  }

  try {
    const { default: nodemailer } = await import("npm:nodemailer@6.9.16");
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.sendMail({
      from: `WebNhanh <${smtpUser}>`,
      to,
      subject,
      html: htmlBody,
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}


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

          const expiryDate = new Date(expiry.date + "T00:00:00Z");
          const todayMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
          const daysUntil = Math.round((expiryDate.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));

          if (daysUntil < 0 || Math.abs(daysUntil - rule.days_before_expiry) > 1) continue;

          // Build message from template
          const templateKey = `${expiry.type}_${rule.days_before_expiry}`;
          const template = templateMap[templateKey];
          let title = template?.subject || `Nhắc nhở: ${expiry.serviceName} sẽ hết hạn trong ${daysUntil} ngày`;
          let message = template?.body_template || `Dịch vụ ${expiry.serviceName} của ${customer.website_url || customer.customer_name} sẽ hết hạn trong ${daysUntil} ngày (${expiry.date}). Vui lòng gia hạn sớm.`;

          // Calculate pricing
          const unitPrice = expiry.type === "hosting" ? (customer.hosting_price || 0) : (customer.domain_price || 0);
          const taxRate = customer.tax_rate || 10;
          const taxAmount = Math.round(unitPrice * taxRate / 100);
          const totalAmount = unitPrice + taxAmount;

          const formatVND = (n: number) => n.toLocaleString("vi-VN") + "đ";

          const replacePlaceholders = (text: string) => text
            .replace(/\{\{customer_name\}\}/g, customer.customer_name || "")
            .replace(/\{\{website_url\}\}/g, customer.website_url || "")
            .replace(/\{\{hosting_expiry_date\}\}/g, customer.hosting_expiry_date || "")
            .replace(/\{\{domain_expiry_date\}\}/g, customer.domain_expiry_date || "")
            .replace(/\{\{days_remaining\}\}/g, String(daysUntil))
            .replace(/\{\{service_name\}\}/g, expiry.serviceName)
            .replace(/\{\{expiry_date\}\}/g, expiry.date || "")
            .replace(/\{\{unit_price\}\}/g, formatVND(unitPrice))
            .replace(/\{\{tax_amount\}\}/g, formatVND(taxAmount))
            .replace(/\{\{total_amount\}\}/g, formatVND(totalAmount))
            .replace(/\{\{tax_rate\}\}/g, String(taxRate));

          title = replacePlaceholders(title);
          message = replacePlaceholders(message);

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
                send_status: "pending",
              });

            if (insertError) {
              if (insertError.code === "23505") {
                skippedCount++;
                continue;
              }
              console.error("Insert error:", insertError);
              errors.push(`${customer.customer_name}/${expiry.type}/${channel}: ${insertError.message}`);
              continue;
            }

            // For in_app: create notification
            if (channel === "in_app" && customer.auth_user_id) {
              await supabase.from("notifications").insert({
                user_id: customer.auth_user_id,
                type: "renewal_reminder",
                title,
                message,
              });
              // Mark as sent
              await supabase
                .from("notification_deliveries")
                .update({ send_status: "sent", sent_at: new Date().toISOString() })
                .eq("customer_id", customer.id)
                .eq("reminder_rule_id", rule.id)
                .eq("related_expiry_type", expiry.type)
                .eq("related_expiry_date", expiry.date)
                .eq("channel", "in_app")
                .eq("send_status", "pending");
            }

            // For email: send via Resend
            if (channel === "email" && customer.email) {
              const htmlBody = buildRenewalEmail({ title, message, pricing: {
                serviceName: expiry.serviceName,
                expiryDate: expiry.date || "",
                unitPrice: formatVND(unitPrice),
                taxRate: String(taxRate),
                taxAmount: formatVND(taxAmount),
                totalAmount: formatVND(totalAmount),
              });
              const result = await sendEmailViaSmtp(customer.email, title, htmlBody);

              if (result.success) {
                await supabase
                  .from("notification_deliveries")
                  .update({ send_status: "sent", sent_at: new Date().toISOString() })
                  .eq("customer_id", customer.id)
                  .eq("reminder_rule_id", rule.id)
                  .eq("related_expiry_type", expiry.type)
                  .eq("related_expiry_date", expiry.date)
                  .eq("channel", "email")
                  .eq("send_status", "pending");
                console.log(`✅ Email sent to ${customer.email}: ${title}`);
              } else {
                await supabase
                  .from("notification_deliveries")
                  .update({ send_status: "failed", error_message: result.error })
                  .eq("customer_id", customer.id)
                  .eq("reminder_rule_id", rule.id)
                  .eq("related_expiry_type", expiry.type)
                  .eq("related_expiry_date", expiry.date)
                  .eq("channel", "email")
                  .eq("send_status", "pending");
                console.error(`❌ Email failed for ${customer.email}:`, result.error);
                errors.push(`${customer.customer_name}/email: ${result.error}`);
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
