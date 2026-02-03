import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, Pause, Coins, AlertCircle } from 'lucide-react';
import { useMiningSession } from '@/hooks/useMiningSession';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface MiningTimerProps {
  postId: string;
  className?: string;
}

const MiningTimer = ({ postId, className }: MiningTimerProps) => {
  const { user } = useAuth();
  const { 
    activeSeconds, 
    isValid, 
    isActive, 
    minRequired, 
    progress, 
    alreadyCounted 
  } = useMiningSession(postId);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!user) {
    return (
      <div className={cn(
        "bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4",
        className
      )}>
        <div className="flex items-center gap-2 text-amber-700">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm font-medium">Đăng nhập để kiếm token khi đọc bài</span>
        </div>
      </div>
    );
  }

  if (alreadyCounted) {
    return (
      <div className={cn(
        "bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4",
        className
      )}>
        <div className="flex items-center gap-2 text-blue-700">
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-sm font-medium">Bạn đã đọc bài này hôm nay</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-4 space-y-3",
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-emerald-600" />
          <span className="font-semibold text-emerald-800">Content Mining</span>
        </div>
        
        {isValid ? (
          <Badge className="bg-emerald-500 hover:bg-emerald-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Hợp lệ
          </Badge>
        ) : !isActive ? (
          <Badge variant="secondary" className="bg-amber-100 text-amber-700">
            <Pause className="h-3 w-3 mr-1" />
            Tạm dừng
          </Badge>
        ) : (
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            <Clock className="h-3 w-3 mr-1" />
            Đang đọc
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Tiến độ</span>
          <span className="font-mono text-emerald-700">
            {formatTime(activeSeconds)} / {formatTime(minRequired)}
          </span>
        </div>
        <Progress 
          value={progress} 
          className="h-2 bg-emerald-100"
        />
      </div>

      {!isActive && (
        <p className="text-xs text-amber-600">
          ⚠️ Timer đã tạm dừng vì bạn chuyển tab. Quay lại để tiếp tục.
        </p>
      )}

      {isValid && (
        <p className="text-xs text-emerald-600">
          ✓ Lượt đọc hợp lệ! Token sẽ được tính vào cuối ngày.
        </p>
      )}

      {!isValid && activeSeconds < minRequired && (
        <p className="text-xs text-muted-foreground">
          Đọc ít nhất {minRequired} giây để nhận token. Timer sẽ dừng nếu bạn chuyển tab.
        </p>
      )}
    </div>
  );
};

export default MiningTimer;
