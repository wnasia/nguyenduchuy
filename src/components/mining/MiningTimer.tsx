import { useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMiningSession } from '@/hooks/useMiningSession';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import LoginPromptModal from '@/components/LoginPromptModal';

interface MiningTimerProps {
  postId: string;
  className?: string;
}

const MiningTimer = ({ postId, className }: MiningTimerProps) => {
  const { user, profile } = useAuth();
  const [showDebug, setShowDebug] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const {
    sessionId,
    activeSeconds, 
    isValid, 
    isActive, 
    minRequired, 
    progress, 
    alreadyCounted,
    heartbeatCount,
  } = useMiningSession(postId);

  // Check if user is admin (for debug toggle)
  const isAdmin = profile?.role === 'admin';

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatus = (): { label: string; reason: string } => {
    if (alreadyCounted) {
      return { label: 'Đã tính', reason: 'Bạn đã đọc bài viết này hôm nay (1 IP + fingerprint / bài / 24h)' };
    }
    if (isValid) {
      return { label: 'Hợp lệ', reason: 'Đã đọc đủ thời gian, token sẽ được tính vào cuối ngày' };
    }
    if (!isActive) {
      return { label: 'Tạm dừng', reason: 'Tab không visible hoặc window bị minimize' };
    }
    if (activeSeconds < minRequired) {
      return { label: 'Đang đọc', reason: `Cần đọc thêm ${minRequired - activeSeconds}s nữa` };
    }
    return { label: 'Đang xử lý', reason: 'Đang xác thực heartbeat...' };
  };

  const status = getStatus();

  if (!user) {
    return (
      <div className={cn(
        "bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4",
        className
      )}>
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <span className="text-sm font-medium">Đăng nhập để kiếm token khi đọc bài</span>
        </div>
      </div>
    );
  }

  if (alreadyCounted) {
    return (
      <div className={cn(
        "bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4",
        className
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
            <span className="text-sm font-medium">✓ Bạn đã đọc bài này hôm nay</span>
          </div>
          {isAdmin && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowDebug(!showDebug)}
              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
            >
              {showDebug ? 'Ẩn Debug' : 'Debug'}
            </Button>
          )}
        </div>
        {showDebug && isAdmin && (
          <DebugPanel 
            sessionId={sessionId}
            activeSeconds={activeSeconds}
            heartbeatCount={heartbeatCount}
            status={status}
          />
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3",
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">Content Mining</span>
        </div>
        
        <div className="flex items-center gap-2">
          {isValid ? (
            <Badge className="bg-primary hover:bg-primary/90">
              Hợp lệ
            </Badge>
          ) : !isActive ? (
            <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
              Tạm dừng
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              Đang đọc
            </Badge>
          )}
          {isAdmin && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowDebug(!showDebug)}
              className="text-xs text-primary hover:text-primary/80 px-2 h-6"
            >
              {showDebug ? 'Ẩn' : 'Debug'}
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Tiến độ</span>
          <span className="font-mono text-primary">
            {formatTime(activeSeconds)} / {formatTime(minRequired)}
          </span>
        </div>
        <Progress 
          value={progress} 
          className="h-2"
        />
      </div>

      {!isActive && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          ⚠️ Timer đã tạm dừng vì bạn chuyển tab. Quay lại để tiếp tục.
        </p>
      )}

      {isValid && (
        <p className="text-xs text-primary">
          ✓ Lượt đọc hợp lệ! Token sẽ được tính vào cuối ngày.
        </p>
      )}

      {!isValid && isActive && activeSeconds < minRequired && (
        <p className="text-xs text-muted-foreground">
          Đọc ít nhất {minRequired} giây để nhận token. Timer sẽ dừng nếu bạn chuyển tab.
        </p>
      )}

      {/* Debug Panel - Admin only */}
      {showDebug && isAdmin && (
        <DebugPanel 
          sessionId={sessionId}
          activeSeconds={activeSeconds}
          heartbeatCount={heartbeatCount}
          status={status}
        />
      )}
    </div>
  );
};

// Debug Panel Component
const DebugPanel = ({ 
  sessionId, 
  activeSeconds, 
  heartbeatCount,
  status 
}: { 
  sessionId: string | null;
  activeSeconds: number;
  heartbeatCount: number;
  status: { label: string; reason: string };
}) => {
  return (
    <div className="mt-3 p-3 bg-muted text-foreground rounded-lg text-xs font-mono space-y-1 border">
      <p className="text-muted-foreground uppercase tracking-wider text-[10px] mb-2">Debug Info (Admin Only)</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <span className="text-muted-foreground">session_id:</span>
        <span className="truncate">{sessionId || 'null'}</span>
        <span className="text-muted-foreground">active_seconds:</span>
        <span>{activeSeconds}</span>
        <span className="text-muted-foreground">heartbeat_count:</span>
        <span>{heartbeatCount}</span>
        <span className="text-muted-foreground">last_heartbeat:</span>
        <span>{new Date().toISOString()}</span>
        <span className="text-muted-foreground">status:</span>
        <span className={
          status.label === 'Hợp lệ' ? 'text-primary' :
          status.label === 'Tạm dừng' ? 'text-amber-500' :
          status.label === 'Đã tính' ? 'text-blue-500' : ''
        }>{status.label}</span>
        <span className="text-muted-foreground">reason:</span>
        <span className="col-span-1">{status.reason}</span>
      </div>
    </div>
  );
};

export default MiningTimer;
