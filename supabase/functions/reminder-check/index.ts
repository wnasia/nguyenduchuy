import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

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

function buildEmailHtml(title: string, message: string, pricing?: { serviceName: string; expiryDate: string; unitPrice: string; taxRate: string; taxAmount: string; totalAmount: string }): string {
  const pricingSection = pricing ? `
        <!-- Pricing Table -->
        <tr><td style="padding:0 40px 24px;">
          <table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
            <tr><td style="background:#1e40af;padding:14px 20px;">
              <p style="margin:0;color:#ffffff;font-size:15px;font-weight:700;">📋 Chi tiết gia hạn</p>
            </td></tr>
            <tr><td style="padding:0;">
              <table cellpadding="0" cellspacing="0" style="width:100%;">
                <tr>
                  <td style="padding:14px 20px;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:14px;width:40%;">Tên dịch vụ</td>
                  <td style="padding:14px 20px;border-bottom:1px solid #f1f5f9;color:#1e293b;font-size:14px;font-weight:600;">${pricing.serviceName}</td>
                </tr>
                <tr>
                  <td style="padding:14px 20px;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:14px;">Ngày hết hạn</td>
                  <td style="padding:14px 20px;border-bottom:1px solid #f1f5f9;color:#dc2626;font-size:14px;font-weight:600;">${pricing.expiryDate}</td>
                </tr>
                <tr>
                  <td style="padding:14px 20px;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:14px;">Đơn giá</td>
                  <td style="padding:14px 20px;border-bottom:1px solid #f1f5f9;color:#1e293b;font-size:14px;font-weight:600;">${pricing.unitPrice}</td>
                </tr>
                <tr>
                  <td style="padding:14px 20px;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:14px;">Tiền thuế (${pricing.taxRate}%)</td>
                  <td style="padding:14px 20px;border-bottom:1px solid #f1f5f9;color:#1e293b;font-size:14px;">${pricing.taxAmount}</td>
                </tr>
                <tr style="background:#f8fafc;">
                  <td style="padding:16px 20px;color:#1e40af;font-size:15px;font-weight:700;">Thành tiền</td>
                  <td style="padding:16px 20px;color:#1e40af;font-size:18px;font-weight:700;">${pricing.totalAmount}</td>
                </tr>
              </table>
            </td></tr>
          </table>
        </td></tr>` : '';

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:#eef2f7;font-family:'Segoe UI',Roboto,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;padding:48px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);max-width:600px;width:100%;">
        
        <!-- Header with gradient -->
        <tr><td style="background:linear-gradient(135deg,#1d4ed8 0%,#2563eb 50%,#3b82f6 100%);padding:36px 40px;text-align:center;">
          <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
            <tr>
              <td style="padding-right:12px;vertical-align:middle;">
                <div style="width:44px;height:44px;background:rgba(255,255,255,0.2);border-radius:12px;text-align:center;line-height:44px;font-size:22px;">🌐</div>
              </td>
              <td style="vertical-align:middle;">
                <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">WebNhanh</h1>
                <p style="margin:2px 0 0;color:rgba(255,255,255,0.8);font-size:12px;text-transform:uppercase;letter-spacing:1.5px;font-weight:500;">Thông báo dịch vụ</p>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Alert badge -->
        <tr><td style="padding:32px 40px 0;">
          <table cellpadding="0" cellspacing="0" style="background:#fef3c7;border:1px solid #fde68a;border-radius:10px;width:100%;">
            <tr>
              <td style="padding:14px 18px;vertical-align:middle;width:36px;">
                <div style="font-size:24px;line-height:1;">⚠️</div>
              </td>
              <td style="padding:14px 18px 14px 0;">
                <p style="margin:0;color:#92400e;font-size:14px;font-weight:600;">${title}</p>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Main content -->
        <tr><td style="padding:24px 40px 32px;">
          <div style="color:#475569;font-size:15px;line-height:1.7;">${message.replace(/\n/g, "<br>")}</div>
        </td></tr>

        \${pricingSection}

        <!-- Divider -->
        <tr><td style="padding:0 40px;">
          <div style="height:1px;background:linear-gradient(90deg,transparent,#e2e8f0,transparent);"></div>
        </td></tr>

        <!-- CTA Section -->
        <tr><td style="padding:32px 40px;">
          <table cellpadding="0" cellspacing="0" style="width:100%;background:linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%);border-radius:12px;border:1px solid #bfdbfe;">
            <tr><td style="padding:28px 24px;text-align:center;">
              <p style="margin:0 0 4px;font-size:13px;color:#3b82f6;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">Hỗ trợ gia hạn</p>
              <h3 style="margin:0 0 18px;color:#1e3a5f;font-size:20px;font-weight:700;">Liên hệ ngay để được hỗ trợ</h3>
              
              <!-- Contact cards -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;">
                <tr>
                  <td style="padding:0 8px;">
                    <table cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
                      <tr>
                        <td style="padding:10px 16px;vertical-align:middle;">
                          <span style="font-size:16px;">📞</span>
                        </td>
                        <td style="padding:10px 16px 10px 0;">
                          <a href="tel:0918795578" style="color:#1e40af;font-weight:700;font-size:15px;text-decoration:none;">0918 795 578</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td style="padding:0 8px;">
                    <table cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
                      <tr>
                        <td style="padding:10px 16px;vertical-align:middle;">
                          <span style="font-size:16px;">🌐</span>
                        </td>
                        <td style="padding:10px 16px 10px 0;">
                          <a href="https://webnhanh.net" style="color:#1e40af;font-weight:600;font-size:14px;text-decoration:none;">webnhanh.net</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr><td align="center" style="border-radius:10px;background:linear-gradient(135deg,#1d4ed8,#2563eb);">
                  <a href="https://webnhanh.net" style="display:inline-block;color:#ffffff;font-size:16px;font-weight:700;padding:16px 48px;text-decoration:none;letter-spacing:0.3px;">
                    ✨ Gia hạn ngay
                  </a>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 40px;background:#f8fafc;border-top:1px solid #f1f5f9;text-align:center;">
          <p style="margin:0 0 4px;color:#64748b;font-size:12px;">© ${new Date().getFullYear()} <strong>WebNhanh.asia</strong></p>
          <p style="margin:0;color:#94a3b8;font-size:11px;">Hệ thống nhắc nhở gia hạn tự động</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
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
              const htmlBody = buildEmailHtml(title, message, {
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
