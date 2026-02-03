import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Coins, Eye, TrendingUp, History, BookOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

interface UserMiningStats {
  balance: number;
  totalEarned: number;
  totalValidViews: number;
  todayViews: number;
  transactions: any[];
  readingHistory: any[];
}

const UserMiningDashboard = () => {
  const { session } = useAuth();
  const [stats, setStats] = useState<UserMiningStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!session?.access_token) {
        setLoading(false);
        return;
      }

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
      }
    };

    fetchStats();
  }, [session?.access_token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm">Số dư Token</p>
                <p className="text-3xl font-bold mt-1">
                  {parseFloat(String(stats.balance)).toFixed(4)}
                </p>
              </div>
              <Coins className="h-10 w-10 text-emerald-200" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Tổng đã kiếm</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  {parseFloat(String(stats.totalEarned)).toFixed(4)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Lượt đọc hợp lệ</p>
                <p className="text-2xl font-bold mt-1">{stats.totalValidViews}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Hôm nay</p>
                <p className="text-2xl font-bold mt-1">{stats.todayViews} lượt</p>
              </div>
              <BookOpen className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="history">Lịch sử đọc</TabsTrigger>
          <TabsTrigger value="transactions">Lịch sử giao dịch</TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Lịch sử đọc bài
              </CardTitle>
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
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
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
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 ml-2">
                        +{parseFloat(item.tokens_earned || 0).toFixed(6)}
                      </Badge>
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
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5" />
                Lịch sử giao dịch
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.transactions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Chưa có giao dịch nào
                </p>
              ) : (
                <div className="space-y-3">
                  {stats.transactions.map((tx: any) => (
                    <div 
                      key={tx.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {tx.transaction_type === 'mining_reward' ? 'Phần thưởng Mining' : tx.transaction_type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.created_at).toLocaleDateString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge 
                          className={tx.amount > 0 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-red-100 text-red-700'
                          }
                        >
                          {tx.amount > 0 ? '+' : ''}{parseFloat(tx.amount).toFixed(6)}
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
