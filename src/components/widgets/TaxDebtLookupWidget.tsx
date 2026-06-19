import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Search, RefreshCw, AlertCircle } from "lucide-react";

type Row = Record<string, unknown>;

interface FetchResponse {
  configured: boolean;
  rows: Row[];
  count?: number;
  matchedCount?: number;
  page?: number;
  pageSize?: number;
  fetchedAt?: string;
  message?: string;
  error?: string;
}

const PAGE_SIZE = 25;

const TaxDebtLookupWidget = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FetchResponse | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const debouncedQuery = useDebounce(query, 350);

  const load = async (search = debouncedQuery, targetPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const { data: res, error: fnError } = await supabase.functions.invoke(
        "tax-debt-fetch",
        { body: { q: search, page: targetPage, pageSize: PAGE_SIZE } },
      );
      if (fnError) throw fnError;
      setData(res as FetchResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(debouncedQuery, page);
  }, [debouncedQuery, page]);

  const columns = useMemo(() => {
    if (!data?.rows?.length) return [];
    return Object.keys(data.rows[0]);
  }, [data]);

  const totalMatches = data?.matchedCount ?? data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalMatches / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = data?.rows ?? [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-3 text-sm text-muted-foreground">
          Đang tải dữ liệu...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
        <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium text-destructive">Không tải được dữ liệu</p>
          <p className="mt-1 text-muted-foreground">{error}</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => load()}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Thử lại
        </Button>
      </div>
    );
  }

  if (data && !data.configured) {
    return (
      <div className="rounded-lg border bg-muted/30 p-6 text-center">
        <p className="font-medium">Chưa có dữ liệu</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Quản trị viên cần cấu hình link Google Drive tại{" "}
          <span className="font-mono">Admin → Settings</span> để bắt đầu tra cứu.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm theo mã số thuế, tên doanh nghiệp..."
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => load()}>
          <RefreshCw className="h-4 w-4 mr-1.5" />
          Tải lại
        </Button>
      </div>

      <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
        <span>
          Tổng: <strong>{data?.count ?? 0}</strong> bản ghi
        </span>
        <span>
          Khớp: <strong>{totalMatches}</strong>
        </span>
        {data?.fetchedAt && (
          <span>
            Cập nhật: {new Date(data.fetchedAt).toLocaleString("vi-VN")}
          </span>
        )}
      </div>

      {pageRows.length === 0 ? (
        <div className="rounded-lg border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
          Không tìm thấy kết quả phù hợp.
        </div>
      ) : (
        <>
          <div className="rounded-lg border overflow-auto max-h-[55vh]">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  {columns.map((col) => (
                    <TableHead key={col} className="whitespace-nowrap">
                      {col}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((row, idx) => (
                  <TableRow key={(currentPage - 1) * PAGE_SIZE + idx}>
                    <TableCell className="text-muted-foreground">
                      {(currentPage - 1) * PAGE_SIZE + idx + 1}
                    </TableCell>
                    {columns.map((col) => (
                      <TableCell key={col} className="text-sm">
                        {String(row[col] ?? "")}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Trang {currentPage} / {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Trước
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TaxDebtLookupWidget;
