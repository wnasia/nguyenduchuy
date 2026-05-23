import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

interface UserMiningStats {
  balance: number;
  totalEarned: number;
  totalValidViews: number;
  todayViews: number;
  transactions: any[];
  readingHistory: any[];
  pendingViews: number;
}

const UserMiningDashboard = () => {
  const { session } = useAuth();
  const [stats, setStats] = useState<UserMiningStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async (showRefresh = false) => {
    if (!session?.access_token) {
      setLoading(false);
      return;
    }

    if (showRefresh) setRefreshing(true);

    try {
      const response = await fetch(
        'https://onihezlpgofqzutuxahv.supabase.co/functions/v1/mining-stats?type=user',
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );
      
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching mining stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [session?.access_token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Không thể tải dữ liệu mining
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Content Mining</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => fetchStats(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
          <CardContent className="p-6">
            <div>
              <p className="text-primary-foreground/70 text-sm">Số dư Token</p>
              <p className="text-3xl font-bold mt-1">
                {parseFloat(String(stats.balance)).toFixed(4)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-muted-foreground text-sm">Tổng đã kiếm</p>
              <p className="text-2xl font-bold text-primary mt-1">
                {parseFloat(String(stats.totalEarned)).toFixed(4)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-muted-foreground text-sm">Lượt đọc hợp lệ</p>
              <p className="text-2xl font-bold mt-1">{stats.totalValidViews}</p>
              {stats.pendingViews > 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  {stats.pendingViews} chờ quyết toán
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-muted-foreground text-sm">Hôm nay</p>
              <p className="text-2xl font-bold mt-1">{stats.todayViews} lượt</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info banner */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="p-4 space-y-2 text-sm text-muted-foreground">
          <p>
            💡 <strong>Lượt đọc hợp lệ:</strong> cần ít nhất 30 giây đọc thực sự (timer dừng khi chuyển tab).
            Mỗi IP chỉ tính 1 lượt/bài/ngày. Mọi mục hiển thị bên dưới đều đã được xác nhận là <strong>hợp lệ</strong>.
          </p>
          <p>
            🕒 <strong>Chờ quyết toán:</strong> lượt đọc đã hợp lệ nhưng <em>chưa được phân phối token</em>.
            Hệ thống tự động quyết toán vào cuối mỗi ngày (00:00 UTC) — sau đó badge sẽ chuyển thành số token bạn nhận được.
          </p>
        </CardContent>
      </Card>


      {/* Tabs */}
      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="history">Lịch sử đọc</TabsTrigger>
          <TabsTrigger value="transactions">Lịch sử giao dịch</TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lịch sử đọc bài</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.readingHistory.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Chưa có lịch sử đọc. Bắt đầu đọc bài để kiếm token!
                </p>
              ) : (
                <div className="space-y-3">
                  {stats.readingHistory.map((item: any) => (
                    <div 
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <Link 
                          to={`/story/${item.post_id}`}
                          className="font-medium text-sm hover:text-primary truncate block"
                        >
                          {item.posts?.title || 'Bài viết'}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.created_at).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        {item.settled ? (
                          <Badge variant="secondary" className="bg-primary/10 text-primary">
                            +{parseFloat(item.tokens_earned || 0).toFixed(6)}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 border-amber-300">
                            Chờ quyết toán
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lịch sử giao dịch</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.transactions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Chưa có giao dịch nào. Token sẽ được ghi nhận sau khi quyết toán hàng ngày.
                </p>
              ) : (
                <div className="space-y-3">
                  {stats.transactions.map((tx: any) => (
                    <div 
                      key={tx.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {tx.transaction_type === 'mining_reward' ? 'Phần thưởng đọc bài' : tx.transaction_type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.created_at).toLocaleDateString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {tx.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {tx.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge 
                          className={parseFloat(tx.amount) > 0 
                            ? 'bg-primary/10 text-primary' 
                            : 'bg-destructive/10 text-destructive'
                          }
                        >
                          {parseFloat(tx.amount) > 0 ? '+' : ''}{parseFloat(tx.amount).toFixed(6)}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          Số dư: {parseFloat(tx.balance_after).toFixed(4)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserMiningDashboard;
