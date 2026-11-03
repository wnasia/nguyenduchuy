// Shared professional email template for all outbound emails (CRM reminders, AI chat follow-up).

const BRAND = {
  name: "WebNhanh",
  tagline: "Thiết kế website · Dịch vụ CNTT · Quảng cáo",
  site: "https://webnhanh.net",
  siteLabel: "webnhanh.net",
  zalo: "0918795578",
  zaloLabel: "Zalo 0918 795 578",
  telegram: "https://t.me/tkwni",
  telegramLabel: "Telegram: t.me/tkwni",
};

// Navy #0f172a header, slate greys, single blue accent #1d4ed8 — no gradients (Outlook-safe).
export function buildEmailShell(opts: {
  preheader?: string;
  badge?: { label: string; tone?: "warning" | "info" };
  bodyHtml: string;
  cta?: { label: string; href: string };
}): string {
  const tone = opts.badge?.tone ?? "info";
  const badge = opts.badge
    ? `
      <tr><td style="padding:0 32px 8px;">
        <table cellpadding="0" cellspacing="0" width="100%">
          <tr><td style="padding:12px 16px;border-radius:8px;${
            tone === "warning"
              ? "background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;"
              : "background:#eff6ff;border:1px solid #bfdbfe;color:#1e40af;"
          }font-size:13px;font-weight:600;line-height:1.5;">${opts.badge.label}</td></tr>
        </table>
      </td></tr>`
    : "";

  const cta = opts.cta
    ? `
      <tr><td style="padding:8px 32px 32px;">
        <table cellpadding="0" cellspacing="0">
          <tr><td align="center" style="border-radius:8px;background:#1d4ed8;">
            <a href="${opts.cta.href}" style="display:inline-block;color:#ffffff;font-size:15px;font-weight:600;padding:14px 36px;text-decoration:none;">${opts.cta.label}</a>
          </td></tr>
        </table>
      </td></tr>`
    : `<tr><td style="padding:8px 32px 32px;">&#8203;</td></tr>`;

  return `<!DOCTYPE html>
<html lang="vi" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${opts.preheader ?? BRAND.tagline}</div>
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f1f5f9;padding:40px 12px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="width:600px;max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0;">

        <!-- Header -->
        <tr><td style="background:#0f172a;padding:26px 32px;">
          <table cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="vertical-align:middle;width:46px;">
                <table cellpadding="0" cellspacing="0"><tr><td style="width:42px;height:42px;background:#1d4ed8;border-radius:10px;text-align:center;font-size:17px;font-weight:700;color:#ffffff;line-height:42px;">WN</td></tr></table>
              </td>
              <td style="vertical-align:middle;padding-left:14px;">
                <div style="color:#ffffff;font-size:19px;font-weight:700;letter-spacing:-0.2px;">WebNhanh</div>
                <div style="color:#94a3b8;font-size:11px;letter-spacing:0.6px;text-transform:uppercase;padding-top:2px;">${BRAND.tagline}</div>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Accent rule -->
        <tr><td style="height:3px;background:#1d4ed8;font-size:0;line-height:0;">&nbsp;</td></tr>

        ${badge}

        <!-- Body -->
        <tr><td style="padding:24px 32px 8px;">
          ${opts.bodyHtml}
        </td></tr>

        ${cta}

        <!-- Contact strip -->
        <tr><td style="padding:0 32px 28px;">
          <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
            <tr><td style="padding:16px 18px;">
              <div style="color:#64748b;font-size:11px;font-weight:600;letter-spacing:0.8px;text-transform:uppercase;padding-bottom:10px;">Liên hệ trực tiếp</div>
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding:2px 0;color:#334155;font-size:14px;font-weight:600;">
                    <a href="tel:${BRAND.zalo}" style="color:#1d4ed8;text-decoration:none;">${BRAND.zaloLabel}</a>
                    <span style="color:#cbd5e1;">&nbsp;·&nbsp;</span>
                    <a href="${BRAND.telegram}" style="color:#1d4ed8;text-decoration:none;font-weight:500;">${BRAND.telegramLabel}</a>
                  </td>
                </tr>
                <tr><td style="padding-top:4px;">
                  <a href="${BRAND.site}" style="color:#64748b;font-size:13px;text-decoration:none;">${BRAND.siteLabel}</a>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:18px 32px;background:#0f172a;text-align:center;">
          <div style="color:#94a3b8;font-size:12px;">© ${new Date().getFullYear()} WebNhanh — Thiết kế website &amp; dịch vụ công nghệ</div>
          <div style="color:#64748b;font-size:11px;padding-top:4px;">Email được gửi tự động từ hệ thống WebNhanh.</div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function buildRenewalEmail(opts: {
  title: string;
  message: string;
  pricing?: {
    serviceName: string;
    expiryDate: string;
    unitPrice: string;
    taxRate: string;
    taxAmount: string;
    totalAmount: string;
  };
}): string {
  const pricingSection = opts.pricing
    ? `
      <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin:20px 0 8px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
        <tr><td style="background:#f8fafc;padding:12px 18px;color:#0f172a;font-size:13px;font-weight:700;letter-spacing:0.3px;border-bottom:1px solid #e2e8f0;">CHI TIẾT GIA HẠN</td></tr>
        <tr>
          <td style="padding:13px 18px;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:13px;width:42%;">Tên dịch vụ</td>
          <td style="padding:13px 18px;border-bottom:1px solid #f1f5f9;color:#0f172a;font-size:13px;font-weight:600;">${opts.pricing.serviceName}</td>
        </tr>
        <tr>
          <td style="padding:13px 18px;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:13px;">Ngày hết hạn</td>
          <td style="padding:13px 18px;border-bottom:1px solid #f1f5f9;color:#b91c1c;font-size:13px;font-weight:600;">${opts.pricing.expiryDate}</td>
        </tr>
        <tr>
          <td style="padding:13px 18px;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:13px;">Đơn giá</td>
          <td style="padding:13px 18px;border-bottom:1px solid #f1f5f9;color:#0f172a;font-size:13px;font-weight:600;">${opts.pricing.unitPrice}</td>
        </tr>
        <tr>
          <td style="padding:13px 18px;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:13px;">Tiền thuế (${opts.pricing.taxRate}%)</td>
          <td style="padding:13px 18px;border-bottom:1px solid #f1f5f9;color:#0f172a;font-size:13px;">${opts.pricing.taxAmount}</td>
        </tr>
        <tr style="background:#eff6ff;">
          <td style="padding:15px 18px;color:#1d4ed8;font-size:14px;font-weight:700;">Thành tiền</td>
          <td style="padding:15px 18px;color:#1d4ed8;font-size:16px;font-weight:700;">${opts.pricing.totalAmount}</td>
        </tr>
      </table>`
    : "";

  return buildEmailShell({
    preheader: opts.title,
    badge: { label: opts.title, tone: "warning" },
    bodyHtml: `
      <h2 style="margin:0 0 12px;color:#0f172a;font-size:21px;font-weight:700;letter-spacing:-0.2px;line-height:1.35;">Đối tác của chúng tôi sắp đến kỳ gia hạn</h2>
      <div style="color:#475569;font-size:15px;line-height:1.7;">${opts.message.replace(/\n/g, "<br>")}</div>
      ${pricingSection}
      <p style="margin:16px 0 0;color:#94a3b8;font-size:12px;">Nếu quý khách đã gia hạn, vui lòng bỏ qua email này.</p>`,
    cta: { label: "Gia hạn ngay", href: BRAND.site },
  });
}

export function buildWelcomeEmail(): string {
  return buildEmailShell({
    preheader: "Cảm ơn bạn đã để lại thông tin liên hệ với WebNhanh.",
    bodyHtml: `
      <h2 style="margin:0 0 12px;color:#0f172a;font-size:21px;font-weight:700;letter-spacing:-0.2px;line-height:1.35;">Cảm ơn bạn đã để lại thông tin</h2>
      <p style="margin:0 0 14px;color:#475569;font-size:15px;line-height:1.7;">Xin chào,</p>
      <p style="margin:0 0 14px;color:#475569;font-size:15px;line-height:1.7;">Cảm ơn bạn đã trò chuyện cùng trợ lý AI của WebNhanh. Tư vấn viên của chúng tôi sẽ liên hệ lại với bạn trong thời gian sớm nhất về nhu cầu <strong>thiết kế website, dịch vụ công nghệ thông tin hoặc quảng cáo Google/Facebook</strong>.</p>
      <p style="margin:0;color:#475569;font-size:15px;line-height:1.7;">Nếu cần hỗ trợ ngay, bạn có thể nhắn trực tiếp qua Zalo hoặc Telegram ở phần thông tin liên hệ bên dưới.</p>`,
    cta: { label: "Xem dịch vụ của chúng tôi", href: BRAND.site },
  });
}
