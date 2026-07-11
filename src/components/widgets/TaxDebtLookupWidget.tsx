import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

interface TaxDebtLookupWidgetProps {
  initialQuery?: string;
  autoSearch?: boolean;
}

const TaxDebtLookupWidget = ({ initialQuery = "", autoSearch = false }: TaxDebtLookupWidgetProps = {}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FetchResponse | null>(null);
  const [query, setQuery] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(autoSearch ? initialQuery : "");
  const [page, setPage] = useState(1);

  const load = async (search: string, targetPage: number) => {
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

  // Initial load + reload only when submittedQuery or page changes
  useEffect(() => {
    load(submittedQuery, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submittedQuery, page]);

  const handleSearch = () => {
    setPage(1);
    if (query === submittedQuery) {
      // force reload even when value unchanged
      load(query, 1);
    } else {
      setSubmittedQuery(query);
    }
  };

  const handleReset = () => {
    setQuery("");
    setPage(1);
    setSubmittedQuery("");
  };

  const columns = useMemo(() => {
    if (!data?.rows?.length) return [];
    return Object.keys(data.rows[0]);
  }, [data]);

  const totalMatches = data?.matchedCount ?? data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalMatches / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = data?.rows ?? [];

  if (error) {
    return (
      <div className="flex flex-col sm:flex-row items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
        <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-destructive">Không tải được dữ liệu</p>
          <p className="mt-1 text-muted-foreground break-words">{error}</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => load(submittedQuery, page)}>
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
    <div className="space-y-4 w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
        className="flex flex-col sm:flex-row gap-2 w-full"
      >
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nhập MST hoặc tên DN rồi bấm Tìm..."
            className="pl-9 w-full"
            inputMode="search"
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" className="flex-1 sm:flex-none" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Search className="h-4 w-4 mr-1.5" />
            )}
            Tìm
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Đặt lại</span>
          </Button>
        </div>
      </form>

      <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
        <span>
          Tổng: <strong>{data?.count ?? 0}</strong> bản ghi
        </span>
        <span>
          Khớp: <strong>{totalMatches}</strong>
        </span>
        {data?.fetchedAt && (
          <span className="truncate">
            Cập nhật: {new Date(data.fetchedAt).toLocaleString("vi-VN")}
          </span>
        )}
      </div>

      <div className="relative min-h-[320px]">
        {pageRows.length === 0 ? (
          <div className="rounded-lg border bg-muted/20 p-8 text-center text-sm text-muted-foreground min-h-[320px] flex items-center justify-center">
            {loading
              ? "Đang tải dữ liệu..."
              : submittedQuery
                ? "Không tìm thấy kết quả phù hợp."
                : "Nhập từ khoá và bấm Tìm để tra cứu."}
          </div>
        ) : (
          <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
            {/* Desktop table */}
            <div className="hidden md:block rounded-lg border overflow-auto max-h-[55vh]">
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
                      <TableCell className="text-muted-foreground align-top">
                        {(currentPage - 1) * PAGE_SIZE + idx + 1}
                      </TableCell>
                      {columns.map((col) => (
                        <TableCell key={col} className="text-sm align-top break-words">
                          {String(row[col] ?? "")}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {pageRows.map((row, idx) => (
                <div
                  key={(currentPage - 1) * PAGE_SIZE + idx}
                  className="rounded-lg border bg-card p-3 text-sm"
                >
                  <div className="text-xs text-muted-foreground mb-2">
                    #{(currentPage - 1) * PAGE_SIZE + idx + 1}
                  </div>
                  <dl className="space-y-1.5">
                    {columns.map((col) => (
                      <div key={col} className="grid grid-cols-3 gap-2">
                        <dt className="col-span-1 text-xs text-muted-foreground truncate">
                          {col}
                        </dt>
                        <dd className="col-span-2 break-words">
                          {String(row[col] ?? "")}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && pageRows.length > 0 && (
          <div className="absolute top-2 right-2 bg-background/80 backdrop-blur rounded-md border px-2 py-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Đang tải...
          </div>
        )}
      </div>

      {pageRows.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                Trang {currentPage} / {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Trước
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === totalPages || loading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Sau
                </Button>
              </div>
        </div>
      )}
    </div>
  );
};

export default TaxDebtLookupWidget;
