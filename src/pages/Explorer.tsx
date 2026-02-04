import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { usePageTitle } from '@/hooks/usePageTitle';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

interface OverviewStats {
  totalSupply: number;
  totalIssued: number;
  remainingSupply: number;
  currentPhase: number;
  dailyBudget: number;
  viewsPerToken: number;
  tokensPerView: number;
  daysRemaining: number;
  todayValidViews: number;
  totalValidViews: number;
  activeReaders: number;
  phaseStartDate: string;
  minReadTime: number;
}

interface EmissionHistory {
  stat_date: string;
  total_tokens_issued: number;
  cumulative_tokens_issued: number;
  total_valid_views: number;
  unique_readers: number;
  average_read_time: number;
}

interface DailySettlement {
  settlement_date: string;
  total_valid_views: number;
  daily_budget: number;
  tokens_per_view: number;
  total_tokens_distributed: number;
  unique_users: number;
  phase: number;
}

const Explorer = () => {
  usePageTitle('Content Mining Explorer');
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [history, setHistory] = useState<EmissionHistory[]>([]);
  const [settlements, setSettlements] = useState<DailySettlement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch overview
        const overviewRes = await fetch(
          'https://onihezlpgofqzutuxahv.supabase.co/functions/v1/mining-stats?type=overview'
        );
        const overviewData = await overviewRes.json();
        if (overviewData.success) {
          setOverview(overviewData.data);
        }

        // Fetch history
        const historyRes = await fetch(
          'https://onihezlpgofqzutuxahv.supabase.co/functions/v1/mining-stats?type=history&days=30'
        );
        const historyData = await historyRes.json();
        if (historyData.success) {
          setHistory(historyData.data.reverse());
        }

        // Fetch settlements
        const settlementsRes = await fetch(
          'https://onihezlpgofqzutuxahv.supabase.co/functions/v1/mining-stats?type=settlements&days=30'
        );
        const settlementsData = await settlementsRes.json();
        if (settlementsData.success) {
          setSettlements(settlementsData.data);
        }
      } catch (error) {
        console.error('Error fetching explorer data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(2) + 'K';
    }
    return num.toFixed(2);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
            Content Mining Explorer
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Minh bạch về phân phối token. Theo dõi tổng lượng token đã phát hành, 
            lịch sử emission và các thống kê hệ thống.
          </p>
        </div>

        {overview && (
          <>
            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-emerald-600 to-teal-700 border-0 text-white">
                <CardContent className="p-6">
                  <div>
                    <p className="text-emerald-200 text-sm">Tổng cung</p>
                    <p className="text-3xl font-bold mt-1">
                      {formatNumber(overview.totalSupply)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6">
                  <div>
                    <p className="text-slate-400 text-sm">Đã phát hành</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">
                      {formatNumber(overview.totalIssued)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {((overview.totalIssued / overview.totalSupply) * 100).toFixed(4)}%
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6">
                  <div>
                    <p className="text-slate-400 text-sm">Còn lại</p>
                    <p className="text-2xl font-bold text-blue-400 mt-1">
                      {formatNumber(overview.remainingSupply)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6">
                  <div>
                    <p className="text-slate-400 text-sm">Phase hiện tại</p>
                    <p className="text-2xl font-bold text-amber-400 mt-1">
                      Phase {overview.currentPhase}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Còn {overview.daysRemaining} ngày
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tokenomics Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-slate-800/50 border-slate-700 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-white">
                    Tokenomics hiện tại
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <p className="text-slate-400 text-xs">Ngân sách/ngày</p>
                    <p className="text-xl font-bold text-white">
                      {formatNumber(overview.dailyBudget)}
                    </p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <p className="text-slate-400 text-xs">Lượt/Token</p>
                    <p className="text-xl font-bold text-white">
                      {overview.viewsPerToken}
                    </p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <p className="text-slate-400 text-xs">Token/Lượt</p>
                    <p className="text-xl font-bold text-emerald-400">
                      {overview.tokensPerView.toFixed(4)}
                    </p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <p className="text-slate-400 text-xs">Thời gian đọc tối thiểu</p>
                    <p className="text-xl font-bold text-white">
                      {overview.minReadTime}s
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">
                    Hôm nay
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Lượt đọc hợp lệ</span>
                    <Badge className="bg-emerald-500/20 text-emerald-400">
                      {overview.todayValidViews}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Người đọc active</span>
                    <Badge className="bg-blue-500/20 text-blue-400">
                      {overview.activeReaders}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Tổng lượt đọc</span>
                    <Badge className="bg-amber-500/20 text-amber-400">
                      {formatNumber(overview.totalValidViews)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts + Daily Data */}
            <Tabs defaultValue="emission" className="w-full">
              <TabsList className="bg-slate-800 border-slate-700">
                <TabsTrigger value="emission" className="data-[state=active]:bg-emerald-600 transition-all duration-200">
                  Lịch sử Emission
                </TabsTrigger>
                <TabsTrigger value="views" className="data-[state=active]:bg-emerald-600 transition-all duration-200">
                  Lượt đọc
                </TabsTrigger>
                <TabsTrigger value="daily" className="data-[state=active]:bg-emerald-600 transition-all duration-200">
                  Chi tiết theo ngày
                </TabsTrigger>
              </TabsList>

              <TabsContent value="emission">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Token phát hành theo ngày</CardTitle>
                    <CardDescription className="text-slate-400">
                      30 ngày gần nhất
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={history}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis 
                            dataKey="stat_date" 
                            stroke="#94a3b8"
                            tickFormatter={(value) => new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                          />
                          <YAxis stroke="#94a3b8" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1e293b', 
                              border: '1px solid #334155',
                              borderRadius: '8px'
                            }}
                            labelStyle={{ color: '#94a3b8' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="total_tokens_issued" 
                            stroke="#10b981" 
                            strokeWidth={2}
                            dot={false}
                            name="Tokens"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="views">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Lượt đọc hợp lệ theo ngày</CardTitle>
                    <CardDescription className="text-slate-400">
                      30 ngày gần nhất
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={history}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis 
                            dataKey="stat_date" 
                            stroke="#94a3b8"
                            tickFormatter={(value) => new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                          />
                          <YAxis stroke="#94a3b8" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1e293b', 
                              border: '1px solid #334155',
                              borderRadius: '8px'
                            }}
                            labelStyle={{ color: '#94a3b8' }}
                          />
                          <Bar 
                            dataKey="total_valid_views" 
                            fill="#3b82f6" 
                            radius={[4, 4, 0, 0]}
                            name="Lượt đọc"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Daily Detail Table - Explorer Settlement Proof */}
              <TabsContent value="daily">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Chi tiết Settlement theo ngày</CardTitle>
                    <CardDescription className="text-slate-400">
                      Chứng minh minh bạch: daily_budget, token_per_view, total_emitted
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-slate-700">
                            <TableHead className="text-slate-300">Ngày</TableHead>
                            <TableHead className="text-slate-300 text-right">Valid Views</TableHead>
                            <TableHead className="text-slate-300 text-right">Daily Budget</TableHead>
                            <TableHead className="text-slate-300 text-right">Token/View</TableHead>
                            <TableHead className="text-slate-300 text-right">Tokens Emitted</TableHead>
                            <TableHead className="text-slate-300 text-right">Users</TableHead>
                            <TableHead className="text-slate-300">Phase</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {settlements.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center text-slate-400 py-8">
                                Chưa có dữ liệu settlement
                              </TableCell>
                            </TableRow>
                          ) : (
                            settlements.map((s, i) => (
                              <TableRow key={i} className="border-slate-700 hover:bg-slate-700/30 transition-colors duration-200">
                                <TableCell className="font-mono text-sm text-slate-200">{s.settlement_date}</TableCell>
                                <TableCell className="text-right text-slate-200">{s.total_valid_views.toLocaleString()}</TableCell>
                                <TableCell className="text-right text-slate-200">{s.daily_budget.toLocaleString()}</TableCell>
                                <TableCell className="text-right font-mono text-emerald-400">{s.tokens_per_view.toFixed(6)}</TableCell>
                                <TableCell className="text-right font-semibold text-slate-100">{s.total_tokens_distributed.toLocaleString()}</TableCell>
                                <TableCell className="text-right text-slate-200">{s.unique_users}</TableCell>
                                <TableCell>
                                  <Badge className={s.phase === 1 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}>
                                    Phase {s.phase}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Phase Info */}
            <Card className="bg-gradient-to-r from-slate-800 to-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Roadmap Tokenomics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className={`p-6 rounded-lg border transition-all duration-200 ${overview.currentPhase === 1 ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-600 bg-slate-700/30'}`}>
                    <div className="flex items-center gap-2 mb-4">
                      <Badge className={overview.currentPhase === 1 ? 'bg-emerald-500' : 'bg-slate-600'}>
                        Phase 1
                      </Badge>
                      <span className="text-slate-300">Growth Stage</span>
                    </div>
                    <ul className="space-y-2 text-sm text-slate-400">
                      <li>• Thời gian: 3 năm (1095 ngày)</li>
                      <li>• Ngân sách: 200,000,000 tokens</li>
                      <li>• Tỷ lệ: 10 lượt đọc = 1 token</li>
                      <li>• Daily budget: ~182,648 tokens/ngày (CAPPED)</li>
                    </ul>
                  </div>

                  <div className={`p-6 rounded-lg border transition-all duration-200 ${overview.currentPhase === 2 ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-600 bg-slate-700/30'}`}>
                    <div className="flex items-center gap-2 mb-4">
                      <Badge className={overview.currentPhase === 2 ? 'bg-emerald-500' : 'bg-slate-600'}>
                        Phase 2
                      </Badge>
                      <span className="text-slate-300">Scarcity Stage</span>
                    </div>
                    <ul className="space-y-2 text-sm text-slate-400">
                      <li>• Thời gian: 2 năm (730 ngày)</li>
                      <li>• Ngân sách: 100,000,000 tokens</li>
                      <li>• Độ khó tăng +20% mỗi 6 tháng</li>
                      <li>• Daily cap: ~136,986 tokens/ngày (CAPPED)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default Explorer;
