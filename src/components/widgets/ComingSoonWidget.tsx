import { AlertCircle } from "lucide-react";

interface ComingSoonWidgetProps {
  title: string;
  reason: string;
  needs?: string[];
}

const ComingSoonWidget = ({ title, reason, needs }: ComingSoonWidgetProps) => {
  return (
    <div className="flex flex-col items-start gap-4 py-6">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
        <AlertCircle className="h-3.5 w-3.5" />
        Đang phát triển
      </div>
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground leading-relaxed">
        <strong className="text-foreground">Vì sao chưa làm được:</strong> {reason}
      </p>
      {needs && needs.length > 0 && (
        <div className="w-full">
          <p className="text-sm font-medium text-foreground mb-2">Cần bạn cung cấp / xác nhận:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            {needs.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ComingSoonWidget;
