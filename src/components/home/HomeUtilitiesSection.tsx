import { Link } from "react-router-dom";
import { ArrowRight, Building2, FileSearch, Calendar } from "lucide-react";
import TaxCodeLookupWidget from "@/components/widgets/TaxCodeLookupWidget";
import TaxDebtLookupWidget from "@/components/widgets/TaxDebtLookupWidget";
import LunarCalendarWidget from "@/components/LunarCalendarWidget";

const HomeUtilitiesSection = () => {
  return (
    <section className="py-8 sm:py-10">
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Tiện ích nhanh</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Tra cứu mã số thuế, nợ thuế và xem lịch âm ngay tại trang chủ.
          </p>
        </div>
        <Link
          to="/utilities"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline shrink-0"
        >
          Xem tất cả
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Tra cứu MST */}
        <div className="rounded-xl border bg-card p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-sky-500/10">
              <Building2 className="h-5 w-5 text-sky-600" />
            </div>
            <h3 className="font-semibold text-foreground">Tra cứu mã số thuế</h3>
          </div>
          <div className="flex-1">
            <TaxCodeLookupWidget />
          </div>
        </div>

        {/* Tra cứu nợ thuế */}
        <div className="rounded-xl border bg-card p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-rose-500/10">
              <FileSearch className="h-5 w-5 text-rose-600" />
            </div>
            <h3 className="font-semibold text-foreground">Tra cứu nợ thuế</h3>
          </div>
          <div className="flex-1">
            <TaxDebtLookupWidget />
          </div>
        </div>

        {/* Lịch âm */}
        <div className="rounded-xl border bg-card overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 px-5 pt-5 pb-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <h3 className="font-semibold text-foreground">Lịch âm hôm nay</h3>
          </div>
          <div className="px-2 pb-2 flex-1">
            <LunarCalendarWidget />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeUtilitiesSection;
