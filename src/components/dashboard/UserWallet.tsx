import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Clock, 
  Gift, 
  Star,
  CreditCard,
  ArrowUpRight,
  Sparkles,
  Info,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  created_at: string;
}

interface WalletData {
  balance: number;
  total_earned: number;
}

const UserWallet = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWalletData = async () => {
      if (!user) return;

      try {
        const { data: walletData, error: walletError } = await supabase
          .from('wallet')
          .select('balance, total_earned')
          .eq('user_id', user.id)
          .single();

        if (walletError && walletError.code !== 'PGRST116') {
          console.error('Error fetching wallet:', walletError);
          toast({
            title: "Error",
            description: "Failed to load wallet data",
            variant: "destructive",
          });
        } else {
          setWallet(walletData);
        }

        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (transactionsError) {
          console.error('Error fetching transactions:', transactionsError);
          toast({
            title: "Error",
            description: "Failed to load transaction history",
            variant: "destructive",
          });
        } else {
          setTransactions(transactionsData || []);
        }
      } catch (error) {
        console.error('Error:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWalletData();
  }, [user, toast]);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earning':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'withdrawal':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'topup':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      default:
        return <Calendar className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'earning':
      case 'topup':
        return 'text-green-600 dark:text-green-400';
      case 'withdrawal':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-muted-foreground';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Feature Introduction Banner */}
      <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-primary via-blue-500 to-indigo-600">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <Wallet className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1 text-white">
              <h2 className="text-2xl font-bold mb-2">Ví điện tử HUY</h2>
              <p className="text-white/80 text-sm sm:text-base max-w-xl">
                Quản lý thu nhập từ bài viết và hoạt động của bạn trên nền tảng. 
                Theo dõi số dư, lịch sử giao dịch và rút tiền khi đủ điều kiện.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wallet Balance Cards */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Current Balance */}
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
            <p className="text-sm text-muted-foreground mb-1">Số dư hiện tại</p>
            <p className="text-3xl sm:text-4xl font-bold text-foreground">
              {formatCurrency(wallet?.balance || 0)}
              <span className="text-lg font-normal text-muted-foreground ml-2">VND</span>
            </p>
          </CardContent>
        </Card>

        {/* Total Earned */}
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                Tổng cộng
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Tổng thu nhập</p>
            <p className="text-3xl sm:text-4xl font-bold text-foreground">
              {formatCurrency(wallet?.total_earned || 0)}
              <span className="text-lg font-normal text-muted-foreground ml-2">VND</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* How to Earn Section */}
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Gift className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Cách kiếm tiền</CardTitle>
              <CardDescription>Nhận thu nhập từ các hoạt động trên nền tảng</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Star,
                title: "Viết bài chất lượng",
                description: "Nhận thưởng khi bài viết được duyệt và có nhiều lượt xem",
                color: "text-yellow-500",
                bg: "bg-yellow-500/10"
              },
              {
                icon: TrendingUp,
                title: "Tương tác cao",
                description: "Thưởng thêm khi bài viết nhận được nhiều bình luận và yêu thích",
                color: "text-green-500",
                bg: "bg-green-500/10"
              },
              {
                icon: Sparkles,
                title: "Hoạt động thường xuyên",
                description: "Bonus cho người dùng hoạt động tích cực hàng tháng",
                color: "text-purple-500",
                bg: "bg-purple-500/10"
              }
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
              <h3 className="text-lg font-semibold text-foreground mb-2">Rút tiền</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Tính năng rút tiền đang được phát triển và sẽ sớm ra mắt. 
                Bạn có thể rút tiền khi số dư đạt tối thiểu 100.000 VND.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Button disabled size="lg" className="gap-2 w-full sm:w-auto">
                  <Clock className="h-4 w-4" />
                  Sắp ra mắt
                </Button>
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5" />
                  Chúng tôi sẽ thông báo khi tính năng sẵn sàng
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Lịch sử giao dịch</CardTitle>
              <CardDescription>10 giao dịch gần nhất của bạn</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <Wallet className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-foreground mb-1">Chưa có giao dịch</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Bắt đầu viết bài và tương tác để nhận thu nhập đầu tiên của bạn
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {transactions.map((transaction) => (
                <div 
                  key={transaction.id} 
                  className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl",
                      transaction.type === 'earning' ? "bg-green-500/10" :
                      transaction.type === 'withdrawal' ? "bg-red-500/10" :
                      transaction.type === 'topup' ? "bg-blue-500/10" : "bg-muted"
                    )}>
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("font-semibold", getTransactionColor(transaction.type))}>
                      {transaction.type === 'withdrawal' ? '-' : '+'}
                      {formatCurrency(transaction.amount)} VND
                    </p>
                    <p className="text-xs flex items-center justify-end gap-1 mt-0.5">
                      {transaction.status === 'completed' ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                          <span className="text-green-600 dark:text-green-400">Hoàn thành</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground capitalize">{transaction.status}</span>
                      )}
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
