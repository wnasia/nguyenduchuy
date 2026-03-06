import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Wallet, 
  TrendingUp, 
  Calendar, 
  Clock, 
  Gift, 
  Star,
  CreditCard,
  ArrowUpRight,
  Sparkles,
  Info,
  CheckCircle2,
  RefreshCw,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TokenBalance {
  balance: number;
  total_earned: number;
  total_valid_views: number;
}

interface LedgerEntry {
  id: string;
  transaction_type: string;
  amount: number;
  balance_after: number;
  description: string | null;
  created_at: string;
}

const UserWallet = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [tokenBalance, setTokenBalance] = useState<TokenBalance | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [pendingViews, setPendingViews] = useState(0);
  const [todayViews, setTodayViews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWalletData = async (showRefresh = false) => {
    if (!user) return;
    if (showRefresh) setRefreshing(true);

    try {
      // Fetch token balance (mining system - source of truth)
      const { data: balanceData } = await supabase
        .from('token_balances')
        .select('balance, total_earned, total_valid_views')
        .eq('user_id', user.id)
        .maybeSingle();

      setTokenBalance(balanceData || { balance: 0, total_earned: 0, total_valid_views: 0 });

      // Fetch token ledger (transaction history)
      const { data: ledgerData } = await supabase
        .from('token_ledger')
        .select('id, transaction_type, amount, balance_after, description, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      setLedger(ledgerData || []);

      // Fetch pending views (unsettled)
      const { count: pending } = await supabase
        .from('valid_views')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('settled', false);

      setPendingViews(pending || 0);

      // Today's valid views
      const today = new Date().toISOString().split('T')[0];
      const { count: todayCount } = await supabase
        .from('valid_views')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('view_date', today);

      setTodayViews(todayCount || 0);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu ví",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-primary via-blue-500 to-indigo-600">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <Wallet className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1 text-white">
              <h2 className="text-2xl font-bold mb-2">Ví Token HUY</h2>
              <p className="text-white/80 text-sm sm:text-base max-w-xl">
                Quản lý token kiếm được từ Content Mining. 
                Đọc bài ít nhất 30 giây để nhận token. Token được quyết toán vào cuối mỗi ngày.
              </p>
            </div>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => fetchWalletData(true)}
              disabled={refreshing}
              className="shrink-0"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
              Làm mới
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Balance Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                <CreditCard className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
                Khả dụng
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Số dư Token</p>
            <p className="text-3xl font-bold text-foreground">
              {parseFloat(String(tokenBalance?.balance || 0)).toFixed(4)}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Tổng đã kiếm</p>
            <p className="text-3xl font-bold text-foreground">
              {parseFloat(String(tokenBalance?.total_earned || 0)).toFixed(4)}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-500/20">
                <Eye className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Lượt đọc hợp lệ</p>
            <p className="text-3xl font-bold text-foreground">
              {tokenBalance?.total_valid_views || 0}
            </p>
            {pendingViews > 0 && (
              <p className="text-xs text-amber-600 mt-1">
                {pendingViews} chờ quyết toán
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                <Calendar className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Hôm nay</p>
            <p className="text-3xl font-bold text-foreground">{todayViews} lượt</p>
          </CardContent>
        </Card>
      </div>

      {/* Info */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Cách hoạt động:</strong> Đọc bài viết ít nhất 30 giây (timer dừng khi chuyển tab). 
            Mỗi IP chỉ tính 1 lượt/bài/ngày. Token được quyết toán vào 00:00 UTC hàng ngày.
          </p>
        </CardContent>
      </Card>

      {/* How to Earn */}
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Gift className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Cách kiếm Token</CardTitle>
              <CardDescription>Đọc bài viết để nhận thưởng token</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: Star,
                title: "Đọc bài viết",
                description: "Đọc bài ít nhất 30 giây để ghi nhận 1 lượt đọc hợp lệ",
                color: "text-yellow-500",
                bg: "bg-yellow-500/10"
              },
              {
                icon: Sparkles,
                title: "Token tự động",
                description: "Hệ thống tự động quyết toán và cộng token vào cuối ngày",
                color: "text-purple-500",
                bg: "bg-purple-500/10"
              },
              {
                icon: TrendingUp,
                title: "Đọc nhiều hơn",
                description: "Càng đọc nhiều bài, càng kiếm nhiều token trong ngày",
                color: "text-green-500",
                bg: "bg-green-500/10"
              },
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg shrink-0", item.bg)}>
                  <item.icon className={cn("h-5 w-5", item.color)} />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Withdrawal Section */}
      <Card className="shadow-md border-dashed border-2 border-primary/30">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <ArrowUpRight className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-lg font-semibold text-foreground mb-2">Rút Token</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Tính năng rút token đang được phát triển và sẽ sớm ra mắt.
              </p>
              <Button disabled size="lg" className="gap-2">
                <Clock className="h-4 w-4" />
                Sắp ra mắt
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History from Token Ledger */}
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Lịch sử giao dịch Token</CardTitle>
              <CardDescription>20 giao dịch gần nhất từ hệ thống quyết toán</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {ledger.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <Wallet className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-foreground mb-1">Chưa có giao dịch</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Bắt đầu đọc bài viết để kiếm token. Token sẽ được ghi nhận sau quyết toán hàng ngày.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {ledger.map((tx) => (
                <div 
                  key={tx.id} 
                  className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {tx.transaction_type === 'mining_reward' ? 'Phần thưởng đọc bài' : tx.transaction_type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </p>
                      {tx.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{tx.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={parseFloat(String(tx.amount)) > 0 
                      ? 'bg-primary/10 text-primary' 
                      : 'bg-destructive/10 text-destructive'
                    }>
                      {parseFloat(String(tx.amount)) > 0 ? '+' : ''}{parseFloat(String(tx.amount)).toFixed(6)}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center justify-end gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      Số dư: {parseFloat(String(tx.balance_after)).toFixed(4)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserWallet;
