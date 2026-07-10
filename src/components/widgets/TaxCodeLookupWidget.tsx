import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, AlertCircle, Building2, MapPin, Globe, Hash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface BusinessData {
  id: string;
  name: string;
  internationalName?: string;
  shortName?: string;
  address?: string;
}

interface ApiResponse {
  code: string;
  desc: string;
  data?: BusinessData;
}

const TaxCodeLookupWidget = () => {
  const [taxCode, setTaxCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BusinessData | null>(null);

  const handleLookup = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const code = taxCode.trim();
    if (!code) return;
    if (!/^\d{10}(-\d{3})?$|^\d{13}$/.test(code)) {
      setError("Mã số thuế không hợp lệ (10 hoặc 13 chữ số).");
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(`https://api.vietqr.io/v2/business/${encodeURIComponent(code)}`);
      const json = (await res.json()) as ApiResponse;
      if (json.code === "00" && json.data) {
        setData(json.data);
      } else {
        setError(json.desc || "Không tìm thấy doanh nghiệp.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 w-full">
      <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={taxCode}
            onChange={(e) => setTaxCode(e.target.value)}
            placeholder="Nhập mã số thuế (VD: 0316794479)"
            className="pl-9"
            inputMode="numeric"
          />
        </div>
        <Button type="submit" disabled={loading || !taxCode.trim()}>
          {loading ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <Search className="h-4 w-4 mr-1.5" />
          )}
          Tra cứu
        </Button>
      </form>

      <p className="text-xs text-muted-foreground">
        Dữ liệu cung cấp bởi VietQR — tra cứu thông tin doanh nghiệp theo mã số thuế.
      </p>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-destructive">Không tra cứu được</p>
            <p className="mt-1 text-muted-foreground break-words">{error}</p>
          </div>
        </div>
      )}

      {data && (
        <div className="rounded-lg border bg-card p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base leading-snug break-words">
                {data.name}
              </h3>
              {data.shortName && (
                <p className="text-sm text-muted-foreground mt-0.5">{data.shortName}</p>
              )}
            </div>
          </div>

          <dl className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <Hash className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <dt className="text-xs text-muted-foreground">Mã số thuế</dt>
                <dd className="font-mono font-medium">{data.id}</dd>
              </div>
            </div>

            {data.internationalName && (
              <div className="flex items-start gap-3">
                <Globe className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <dt className="text-xs text-muted-foreground">Tên quốc tế</dt>
                  <dd className="break-words">{data.internationalName}</dd>
                </div>
              </div>
            )}

            {data.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <dt className="text-xs text-muted-foreground">Địa chỉ</dt>
                  <dd className="break-words leading-relaxed">{data.address}</dd>
                </div>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
};

export default TaxCodeLookupWidget;
