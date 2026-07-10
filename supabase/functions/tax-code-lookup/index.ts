import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let taxCode = url.searchParams.get('taxCode') || '';
    if (!taxCode && (req.method === 'POST')) {
      try {
        const body = await req.json();
        taxCode = body?.taxCode || '';
      } catch (_) {}
    }
    taxCode = String(taxCode).trim();

    if (!/^\d{10}(-\d{3})?$|^\d{13}$/.test(taxCode)) {
      return new Response(
        JSON.stringify({ code: '400', desc: 'Mã số thuế không hợp lệ (10 hoặc 13 chữ số).' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const upstream = await fetch(`https://api.vietqr.io/v2/business/${encodeURIComponent(taxCode)}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; HuyBlog/1.0)',
      },
    });

    const text = await upstream.text();
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      return new Response(
        JSON.stringify({
          code: 'UPSTREAM_ERROR',
          desc: `VietQR trả về không hợp lệ (HTTP ${upstream.status}). Vui lòng thử lại sau.`,
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(JSON.stringify(json), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ code: 'ERROR', desc: err instanceof Error ? err.message : 'Lỗi máy chủ' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
