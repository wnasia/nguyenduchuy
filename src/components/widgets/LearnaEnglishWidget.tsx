import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const LEARNA_URL = "https://ailearna.com/";

const LearnaEnglishWidget = () => {
  const [blocked, setBlocked] = useState(false);
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[15px] text-muted-foreground">
          Học tiếng Anh cùng Learna AI ngay trên trang.
        </p>
        <Button asChild variant="outline" size="sm">
          <a href={LEARNA_URL} target="_blank" rel="noopener noreferrer">
            Mở tab mới
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </div>

      {blocked ? (
        <div className="rounded-xl border border-border/60 bg-muted/40 p-6 text-center">
          <p className="text-[16px] font-medium mb-2">
            Learna AI không cho phép nhúng trực tiếp
          </p>
          <p className="text-[15px] text-muted-foreground mb-4">
            Bạn có thể mở trang học tiếng Anh trong tab mới.
          </p>
          <Button asChild>
            <a href={LEARNA_URL} target="_blank" rel="noopener noreferrer">
              Vào học ngay
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-xl border border-border/60 bg-background">
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center text-[15px] text-muted-foreground">
              Đang tải Learna AI...
            </div>
          )}
          <iframe
            src={LEARNA_URL}
            title="Học tiếng Anh - Learna AI"
            className="w-full h-[70vh] min-h-[520px]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            onLoad={() => setLoaded(true)}
            onError={() => setBlocked(true)}
          />
        </div>
      )}
    </div>
  );
};

export default LearnaEnglishWidget;
