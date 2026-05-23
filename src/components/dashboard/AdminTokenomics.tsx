import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Save, Play, AlertTriangle, Ban, RefreshCw, Activity } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TokenomicsConfig {
  id: string;
  total_supply: number;
  phase1_budget: number;
  phase2_budget: number;
  phase1_days: number;
  phase2_days: number;
  base_views_per_token: number;
  min_read_time_seconds: number;
  heartbeat_interval_seconds: number;
  difficulty_increase_percent: number;
  phase_start_date: string;
  is_active: boolean;
}

interface SuspiciousActivity {
  id: string;
  ip_address: unknown;
  fingerprint: string | null;
  user_id: string | null;
  activity_type: string;
  details: any;
  severity: string;
  resolved: boolean;
  created_at: string;
}

interface DailySettlement {
  id: string;
  settlement_date: string;
  total_valid_views: number;
  daily_budget: number;
  tokens_per_view: number;
  total_tokens_distributed: number;
  unique_users: number;
  phase: number;
  created_at: string;
}

interface AdminMetrics {
  totalValidViews: number;
  todayValidViews: number;
  pendingViews: number;
  totalTokensDistributed: number;
  totalUsersRewarded: number;
  usersWithBalance: number;
  activeSessions: number;
  currentPhase: number;
  dailyBudget: number;
  tokensPerView: number;
  lastSettlement: DailySettlement | null;
}

const AdminTokenomics = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [config, setConfig] = useState<TokenomicsConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settling, setSettling] = useState(false);
  const [suspiciousActivity, setSuspiciousActivity] = useState<SuspiciousActivity[]>([]);
  const [blockedEntities, setBlockedEntities] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<DailySettlement[]>([]);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [pendingViews, setPendingViews] = useState<any[]>([]);
  const [pendingProfiles, setPendingProfiles] = useState<Record<string, { email?: string; display_name?: string }>>({});

  useEffect(() => {
    fetchConfig();
    fetchSuspiciousActivity();
    fetchBlockedEntities();
    fetchSettlements();
    fetchMetrics();
    fetchPendingViews();
  }, []);

  const fetchPendingViews = async () => {
    try {
      const sb: any = supabase;
      const { data } = await sb
        .from('valid_views')
        .select('id, user_id, post_id, view_date, created_at, ip_address')
        .eq('settled', false)
        .order('created_at', { ascending: false })
        .limit(200);
      const views = (data || []) as any[];

      const userIds = Array.from(new Set(views.map((v) => v.user_id).filter(Boolean))) as string[];
      const postIds = Array.from(new Set(views.map((v) => v.post_id).filter(Boolean))) as string[];

      const profsRes = userIds.length
        ? await sb.from('profiles').select('user_id, display_name, email').in('user_id', userIds)
        : { data: [] };
      const postsRes = postIds.length
        ? await sb.from('posts').select('id, title').in('id', postIds)
        : { data: [] };

      const profMap: Record<string, any> = {};
      (profsRes.data || []).forEach((p: any) => { profMap[p.user_id] = p; });
      const postMap: Record<string, any> = {};
      (postsRes.data || []).forEach((p: any) => { postMap[p.id] = p; });

      setPendingViews(views.map((v) => ({ ...v, _post: postMap[v.post_id], _profile: profMap[v.user_id] })));
    } catch (error) {
      console.error('Error fetching pending views:', error);
    }
  };

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('tokenomics_config')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setConfig(data);
    } catch (error) {
      console.error('Error fetching config:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải cấu hình tokenomics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSuspiciousActivity = async () => {
    try {
      const { data } = await supabase
        .from('suspicious_activity')
        .select('*')
        .eq('resolved', false)
        .order('created_at', { ascending: false })
        .limit(50);

      setSuspiciousActivity(data || []);
    } catch (error) {
      console.error('Error fetching suspicious activity:', error);
    }
  };

  const fetchBlockedEntities = async () => {
    try {
      const { data } = await supabase
        .from('blocked_entities')
        .select('*')
        .order('created_at', { ascending: false });

      setBlockedEntities(data || []);
    } catch (error) {
      console.error('Error fetching blocked entities:', error);
    }
  };

  const fetchSettlements = async () => {
    try {
      const { data } = await supabase
        .from('daily_settlements')
        .select('*')
        .order('settlement_date', { ascending: false })
        .limit(30);

      setSettlements(data || []);
    } catch (error) {
      console.error('Error fetching settlements:', error);
    }
  };

  const fetchMetrics = async () => {
    if (!session?.access_token) return;
    
    setMetricsLoading(true);
    try {
      const response = await fetch(
        'https://onihezlpgofqzutuxahv.supabase.co/functions/v1/mining-stats?type=admin',
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );
      
      const data = await response.json();
      if (data.success) {
        setMetrics(data.data);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setMetricsLoading(false);
    }
  };

  const refreshAll = () => {
    fetchSettlements();
    fetchSuspiciousActivity();
    fetchMetrics();
    fetchPendingViews();
  };

  const handleSaveConfig = async () => {
    if (!config) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('tokenomics_config')
        .update({
          base_views_per_token: config.base_views_per_token,
          min_read_time_seconds: config.min_read_time_seconds,
          heartbeat_interval_seconds: config.heartbeat_interval_seconds,
          difficulty_increase_percent: config.difficulty_increase_percent,
          updated_at: new Date().toISOString(),
        })
        .eq('id', config.id);

      if (error) throw error;

      toast({
        title: 'Thành công',
        description: 'Đã lưu cấu hình tokenomics',
      });
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể lưu cấu hình',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRunSettlement = async () => {
    if (!session?.access_token) return;

    setSettling(true);
    try {
      const response = await fetch(
        'https://onihezlpgofqzutuxahv.supabase.co/functions/v1/mining-settlement',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Settlement hoàn tất',
          description: `Đã phân phối ${data.tokensDistributed.toFixed(4)} tokens cho ${data.uniqueUsers} users`,
        });
        fetchSettlements(); // Refresh settlements
      } else if (data.error === 'already_settled') {
        toast({
          title: 'Đã settle',
          description: data.message,
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Settlement error:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể chạy settlement',
        variant: 'destructive',
      });
    } finally {
      setSettling(false);
    }
  };

  const handleBlockEntity = async (type: 'ip' | 'fingerprint', value: string) => {
    try {
      const { error } = await supabase
        .from('blocked_entities')
        .insert({
          entity_type: type,
          entity_value: value,
          reason: 'Suspicious activity',
        });

      if (error) throw error;

      toast({
        title: 'Đã chặn',
        description: `Đã chặn ${type}: ${value}`,
      });

      fetchBlockedEntities();
    } catch (error) {
      console.error('Error blocking entity:', error);
    }
  };

  const handleUnblock = async (id: string) => {
    try {
      const { error } = await supabase
        .from('blocked_entities')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Đã bỏ chặn',
      });

      fetchBlockedEntities();
    } catch (error) {
      console.error('Error unblocking:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Get yesterday's settlement for proof
  const yesterdaySettlement = settlements.find(s => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return s.settlement_date === yesterday.toISOString().split('T')[0];
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Content Mining - Tokenomics</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshAll}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleRunSettlement} disabled={settling}>
            <Play className="h-4 w-4 mr-2" />
            {settling ? 'Đang chạy...' : 'Chạy Settlement'}
          </Button>
        </div>
      </div>

      {/* Real-time Metrics Dashboard */}
      {metricsLoading ? (
        <Card>
          <CardContent className="p-6 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      ) : metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total Valid Views</p>
              <p className="text-2xl font-bold">{metrics.totalValidViews.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Today Views</p>
              <p className="text-2xl font-bold text-primary">{metrics.todayValidViews.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Pending Settlement</p>
              <p className="text-2xl font-bold text-amber-600">{metrics.pendingViews.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Tokens Distributed</p>
              <p className="text-2xl font-bold">{metrics.totalTokensDistributed.toFixed(4)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Users Rewarded</p>
              <p className="text-2xl font-bold">{metrics.totalUsersRewarded}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Activity className="h-3 w-3" /> Active Now
              </p>
              <p className="text-2xl font-bold text-primary">{metrics.activeSessions}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="config" className="w-full">
        <TabsList>
          <TabsTrigger value="config" className="transition-all duration-200">Cấu hình</TabsTrigger>
          <TabsTrigger value="settlements" className="transition-all duration-200">Settlement Proof</TabsTrigger>
          <TabsTrigger value="pending" className="transition-all duration-200">
            Chờ quyết toán {pendingViews.length > 0 && <Badge variant="secondary" className="ml-2">{pendingViews.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="security" className="transition-all duration-200">Bảo mật</TabsTrigger>
          <TabsTrigger value="blocked" className="transition-all duration-200">Danh sách chặn</TabsTrigger>
        </TabsList>

        <TabsContent value="config">
          {config && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Cấu hình Mining</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Số lượt đọc / 1 Token</Label>
                    <Input
                      type="number"
                      value={config.base_views_per_token}
                      onChange={(e) =>
                        setConfig({ ...config, base_views_per_token: parseInt(e.target.value) })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Hiện tại: {config.base_views_per_token} lượt = 1 token
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Thời gian đọc tối thiểu (giây)</Label>
                    <Input
                      type="number"
                      value={config.min_read_time_seconds}
                      onChange={(e) =>
                        setConfig({ ...config, min_read_time_seconds: parseInt(e.target.value) })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Heartbeat interval (giây)</Label>
                    <Input
                      type="number"
                      value={config.heartbeat_interval_seconds}
                      onChange={(e) =>
                        setConfig({ ...config, heartbeat_interval_seconds: parseInt(e.target.value) })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tăng độ khó Phase 2 (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={config.difficulty_increase_percent}
                      onChange={(e) =>
                        setConfig({ ...config, difficulty_increase_percent: parseFloat(e.target.value) })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Độ khó tăng mỗi 6 tháng trong Phase 2
                    </p>
                  </div>

                  <Button onClick={handleSaveConfig} disabled={saving} className="w-full transition-all duration-200 hover:translate-x-0.5">
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Thông tin Tokenomics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Tổng cung</p>
                      <p className="text-xl font-bold">{(config.total_supply / 1000000).toFixed(0)}M</p>
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Phase 1 Budget</p>
                      <p className="text-xl font-bold">{(config.phase1_budget / 1000000).toFixed(0)}M</p>
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Phase 2 Budget</p>
                      <p className="text-xl font-bold">{(config.phase2_budget / 1000000).toFixed(0)}M</p>
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Ngày bắt đầu</p>
                      <p className="text-sm font-bold">
                        {new Date(config.phase_start_date).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-amber-700">
                      <AlertTriangle className="h-4 w-4" />
                      <p className="text-sm font-medium">Lưu ý</p>
                    </div>
                    <p className="text-xs text-amber-600 mt-1">
                      Thay đổi cấu hình sẽ ảnh hưởng đến tất cả các lượt đọc từ thời điểm này.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Settlement Proof Tab */}
        <TabsContent value="settlements">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Settlement History (Proof of Fairness)</CardTitle>
              <CardDescription>
                Lịch sử phân phối token hàng ngày - chứng minh hệ thống tuân thủ emission cap
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Yesterday's Summary */}
              {yesterdaySettlement && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <h4 className="font-semibold text-emerald-800 mb-3">Settlement hôm qua ({yesterdaySettlement.settlement_date})</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Valid Views</p>
                      <p className="font-bold text-lg">{yesterdaySettlement.total_valid_views.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Daily Budget</p>
                      <p className="font-bold text-lg">{yesterdaySettlement.daily_budget.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Token/View</p>
                      <p className="font-bold text-lg text-emerald-600">{yesterdaySettlement.tokens_per_view.toFixed(6)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tokens Distributed</p>
                      <p className="font-bold text-lg">{yesterdaySettlement.total_tokens_distributed.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Settlement History Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ngày</TableHead>
                    <TableHead className="text-right">Valid Views</TableHead>
                    <TableHead className="text-right">Daily Budget</TableHead>
                    <TableHead className="text-right">Token/View</TableHead>
                    <TableHead className="text-right">Tokens Emitted</TableHead>
                    <TableHead className="text-right">Users</TableHead>
                    <TableHead>Phase</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settlements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        Chưa có settlement nào
                      </TableCell>
                    </TableRow>
                  ) : (
                    settlements.map((s) => (
                      <TableRow key={s.id} className="transition-colors duration-200 hover:bg-muted/50">
                        <TableCell className="font-mono text-sm">{s.settlement_date}</TableCell>
                        <TableCell className="text-right">{s.total_valid_views.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{s.daily_budget.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono">{s.tokens_per_view.toFixed(6)}</TableCell>
                        <TableCell className="text-right font-semibold">{s.total_tokens_distributed.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{s.unique_users}</TableCell>
                        <TableCell>
                          <Badge variant={s.phase === 1 ? 'default' : 'secondary'}>
                            Phase {s.phase}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hoạt động đáng ngờ</CardTitle>
              <CardDescription>
                Các hoạt động được phát hiện có thể là gian lận
              </CardDescription>
            </CardHeader>
            <CardContent>
              {suspiciousActivity.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Không có hoạt động đáng ngờ
                </p>
              ) : (
                <div className="space-y-3">
                  {suspiciousActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-4 bg-muted rounded-lg transition-all duration-200 hover:bg-muted/80"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              activity.severity === 'critical'
                                ? 'destructive'
                                : activity.severity === 'high'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {activity.severity}
                          </Badge>
                          <span className="font-medium">{activity.activity_type}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          IP: {String(activity.ip_address)} | Fingerprint: {activity.fingerprint?.substring(0, 20)}...
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.created_at).toLocaleString('vi-VN')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleBlockEntity('ip', String(activity.ip_address))}
                          className="transition-all duration-200 hover:translate-x-0.5"
                        >
                          <Ban className="h-4 w-4 mr-1" />
                          Chặn IP
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blocked">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Danh sách chặn</CardTitle>
            </CardHeader>
            <CardContent>
              {blockedEntities.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Chưa có IP/Fingerprint nào bị chặn
                </p>
              ) : (
                <div className="space-y-3">
                  {blockedEntities.map((entity) => (
                    <div
                      key={entity.id}
                      className="flex items-center justify-between p-4 bg-muted rounded-lg transition-all duration-200 hover:bg-muted/80"
                    >
                      <div>
                        <Badge>{entity.entity_type.toUpperCase()}</Badge>
                        <p className="font-mono text-sm mt-1">{entity.entity_value}</p>
                        <p className="text-xs text-muted-foreground">{entity.reason}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleUnblock(entity.id)}
                        className="transition-all duration-200 hover:text-red-500"
                      >
                        Bỏ chặn
                      </Button>
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

export default AdminTokenomics;
