import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Loader2, Building2, FileSearch, Calendar, ArrowRight, Sun, Moon, Clock, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import TaxCodeLookupWidget from "@/components/widgets/TaxCodeLookupWidget";
import TaxDebtLookupWidget from "@/components/widgets/TaxDebtLookupWidget";
import LunarCalendarFull from "@/components/LunarCalendarFull";
import {
  solarToLunar,
  getDayCanChi,
  getLuckyHours,
  isGoodDay,
  dateToJd,
  GIO_HOANG_DAO_TIMES,
  type LunarDate,
} from "@/lib/vietnameseLunar";

type ModalId = "tax-code" | "tax-debt" | "lunar" | null;

const CompactCard = ({
  icon: Icon,
  iconClass,
  title,
  children,
}: {
  icon: React.ElementType;
  iconClass: string;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="group rounded-xl border bg-card p-4 flex flex-col gap-3 hover:border-primary/40 transition-colors">
    <div className="flex items-center gap-2">
      <div className={`p-1.5 rounded-md ${iconClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
    {children}
  </div>
);

const TaxCodeMini = ({ onOpen }: { onOpen: (q: string) => void }) => {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = q.trim();
    if (!code) return;
    setLoading(true);
    // Delegate — open modal with prefilled code (modal widget will re-query)
    onOpen(code);
    setLoading(false);
  };
  return (
    <form onSubmit={submit} className="flex flex-col gap-2 flex-1">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nhập MST (VD: 0316794479)"
          className="pl-9 h-9 text-sm"
          inputMode="numeric"
        />
      </div>
      <Button type="submit" size="sm" className="h-8 w-full" disabled={loading}>
        {loading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Search className="h-3.5 w-3.5 mr-1.5" />}
        Tra cứu
      </Button>
    </form>
  );
};

const TaxDebtMini = ({ onOpen }: { onOpen: (q: string) => void }) => {
  const [q, setQ] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onOpen(q.trim());
  };
  return (
    <form onSubmit={submit} className="flex flex-col gap-2 flex-1">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="MST hoặc tên doanh nghiệp"
          className="pl-9 h-9 text-sm"
        />
      </div>
      <Button type="submit" size="sm" variant="secondary" className="h-8 w-full">
        <FileSearch className="h-3.5 w-3.5 mr-1.5" />
        Kiểm tra nợ thuế
      </Button>
    </form>
  );
};

interface MiniLunar {
  solar: Date;
  lunar: LunarDate;
  dayCanChi: string;
  luckyHours: string[];
  good: boolean;
}

const LunarMini = ({ onOpen }: { onOpen: () => void }) => {
  const [info, setInfo] = useState<MiniLunar | null>(null);
  useEffect(() => {
    const now = new Date();
    const vn = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    const y = vn.getFullYear(), m = vn.getMonth() + 1, d = vn.getDate();
    const lunar = solarToLunar(y, m, d);
    const jd = dateToJd(y, m, d);
    setInfo({
      solar: vn,
      lunar,
      dayCanChi: getDayCanChi(jd),
      luckyHours: getLuckyHours(jd),
      good: isGoodDay(lunar.day),
    });
  }, []);

  if (!info) return <div className="h-[104px] animate-pulse bg-muted/50 rounded-md" />;

  return (
    <div className="flex flex-col gap-2.5 flex-1">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-md border bg-muted/30 px-2.5 py-2">
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Sun className="h-3 w-3 text-amber-500" /> Dương lịch
          </div>
          <div className="text-sm font-semibold mt-0.5 tabular-nums">
            {String(info.solar.getDate()).padStart(2, "0")}/{String(info.solar.getMonth() + 1).padStart(2, "0")}
          </div>
        </div>
        <div className="rounded-md border bg-muted/30 px-2.5 py-2">
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Moon className="h-3 w-3 text-blue-500" /> Âm lịch
          </div>
          <div className="text-sm font-semibold mt-0.5 tabular-nums">
            {String(info.lunar.day).padStart(2, "0")}/{String(info.lunar.month).padStart(2, "0")}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${info.good ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-amber-500/10 text-amber-700 dark:text-amber-400"}`}>
          <CheckCircle2 className="h-3 w-3" />
          {info.good ? "Ngày tốt" : "Bình thường"}
        </span>
        <span className="text-muted-foreground truncate">{info.dayCanChi}</span>
      </div>

      <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
        <Clock className="h-3 w-3 mt-0.5 shrink-0 text-primary" />
        <span className="truncate">
          Giờ HĐ:{" "}
          <span className="text-foreground font-medium">
            {info.luckyHours.slice(0, 3).map((h) => h).join(", ")}
            {info.luckyHours.length > 3 ? "…" : ""}
          </span>
        </span>
      </div>

      <Button variant="outline" size="sm" className="h-8 w-full mt-auto" onClick={onOpen}>
        Xem lịch tháng
      </Button>
    </div>
  );
};

const HomeUtilitiesSection = () => {
  const [modal, setModal] = useState<ModalId>(null);
  const [prefill, setPrefill] = useState<string>("");

  const openWith = (id: ModalId, q = "") => {
    setPrefill(q);
    setModal(id);
  };

  const titleFor = (id: ModalId) =>
    id === "tax-code" ? "Tra cứu mã số thuế doanh nghiệp"
    : id === "tax-debt" ? "Tra cứu doanh nghiệp nợ thuế"
    : id === "lunar" ? "Lịch âm dương"
    : "";

  return (
    <section className="py-6 sm:py-8">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="h-5 w-1 rounded-full bg-primary" />
          <h2 className="text-base sm:text-lg font-bold text-foreground">Tiện ích nhanh</h2>
        </div>
        <Link
          to="/utilities"
          className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-primary hover:underline shrink-0"
        >
          Xem tất cả
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <CompactCard icon={Building2} iconClass="bg-sky-500/10 text-sky-600" title="Tra cứu mã số thuế">
          <TaxCodeMini onOpen={(q) => openWith("tax-code", q)} />
        </CompactCard>
        <CompactCard icon={FileSearch} iconClass="bg-rose-500/10 text-rose-600" title="Tra cứu nợ thuế">
          <TaxDebtMini onOpen={(q) => openWith("tax-debt", q)} />
        </CompactCard>
        <CompactCard icon={Calendar} iconClass="bg-orange-500/10 text-orange-600" title="Lịch âm hôm nay">
          <LunarMini onOpen={() => openWith("lunar")} />
        </CompactCard>
      </div>

      <Dialog open={modal !== null} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">{titleFor(modal)}</DialogTitle>
          </DialogHeader>
          <div className="mt-3">
            {modal === "tax-code" && <TaxCodeLookupWidget initialCode={prefill} autoLookup />}
            {modal === "tax-debt" && <TaxDebtLookupWidget initialQuery={prefill} autoSearch />}
            {modal === "lunar" && <LunarCalendarFull />}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default HomeUtilitiesSection;
