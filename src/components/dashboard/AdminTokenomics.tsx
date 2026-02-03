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
import {
  Settings,
  Save,
  Play,
  AlertTriangle,
  Coins,
  Eye,
  Users,
  Shield,
  Ban,
  RefreshCw,
} from 'lucide-react';

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

const AdminTokenomics = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [config, setConfig] = useState<TokenomicsConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settling, setSettling] = useState(false);
  const [suspiciousActivity, setSuspiciousActivity] = useState<SuspiciousActivity[]>([]);
  const [blockedEntities, setBlockedEntities] = useState<any[]>([]);

  useEffect(() => {
    fetchConfig();
    fetchSuspiciousActivity();
    fetchBlockedEntities();
  }, []);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Content Mining - Tokenomics</h2>
        <Button onClick={handleRunSettlement} disabled={settling}>
          <Play className="h-4 w-4 mr-2" />
          {settling ? 'Đang chạy...' : 'Chạy Settlement'}
        </Button>
      </div>

      <Tabs defaultValue="config" className="w-full">
        <TabsList>
          <TabsTrigger value="config">Cấu hình</TabsTrigger>
          <TabsTrigger value="security">Bảo mật</TabsTrigger>
          <TabsTrigger value="blocked">Danh sách chặn</TabsTrigger>
        </TabsList>

        <TabsContent value="config">
          {config && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Cấu hình Mining
                  </CardTitle>
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

                  <Button onClick={handleSaveConfig} disabled={saving} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Coins className="h-5 w-5" />
                    Thông tin Tokenomics
                  </CardTitle>
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
                      Các lượt đọc đã được tính vẫn giữ nguyên.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Hoạt động đáng ngờ
              </CardTitle>
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
                      className="flex items-center justify-between p-4 bg-muted rounded-lg"
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
              <CardTitle className="flex items-center gap-2">
                <Ban className="h-5 w-5" />
                Danh sách chặn
              </CardTitle>
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
                      className="flex items-center justify-between p-4 bg-muted rounded-lg"
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
