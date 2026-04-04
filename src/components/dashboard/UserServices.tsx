import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Globe, Server, Calendar, CheckCircle, AlertTriangle, Clock, ExternalLink } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";

interface CustomerRecord {
  id: string;
  customer_name: string;
  services: string[];
  website_url: string | null;
  hosting_provider: string | null;
  hosting_expiry_date: string | null;
  domain_provider_info: string | null;
  domain_expiry_date: string | null;
  is_active: boolean;
}

interface RenewalRecord {
  id: string;
  renewal_type: string;
  old_expiry_date: string | null;
  new_expiry_date: string;
  amount: number;
  note: string | null;
  created_at: string;
}

interface DeliveryRecord {
  id: string;
  notification_type: string;
  related_expiry_type: string;
  channel: string;
  title: string | null;
  message: string | null;
  send_status: string;
  created_at: string;
  is_read?: boolean;
}

function getExpiryBadge(dateStr: string | null) {
  if (!dateStr) return <Badge variant="secondary">N/A</Badge>;
  const days = differenceInDays(parseISO(dateStr), new Date());
  if (days < 0) return <Badge variant="destructive">Expired</Badge>;
  if (days <= 7) return <Badge variant="destructive" className="animate-pulse">≤7 days</Badge>;
  if (days <= 30) return <Badge className="bg-amber-500 text-white">≤30 days</Badge>;
  return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Active</Badge>;
}

const UserServices = () => {
  const { user } = useAuth();
  const [customer, setCustomer] = useState<CustomerRecord | null>(null);
  const [renewals, setRenewals] = useState<RenewalRecord[]>([]);
  const [notifications, setNotifications] = useState<DeliveryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // Fetch customer record linked to this auth user
      const { data: custData } = await supabase
        .from("customers" as any).select("*").eq("auth_user_id", user.id).maybeSingle();

      if (custData) {
        setCustomer(custData as any);
        // Fetch renewals
        const { data: renData } = await supabase
          .from("renewal_history" as any).select("*").eq("customer_id", (custData as any).id).order("created_at", { ascending: false });
        setRenewals((renData as any[]) || []);
        // Fetch notification deliveries
        const { data: notifData } = await supabase
          .from("notification_deliveries" as any).select("*").eq("customer_id", (custData as any).id).order("created_at", { ascending: false });
        setNotifications((notifData as any[]) || []);
        setUnreadCount(((notifData as any[]) || []).filter((n: any) => n.send_status === "sent").length);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
    </div>
  );

  if (!customer) return (
    <div className="text-center py-16">
      <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
      <h3 className="text-lg font-semibold mb-2">No Service Found</h3>
      <p className="text-muted-foreground text-sm">Your account is not linked to any customer profile yet. Please contact admin.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">My Services</h2>
        <p className="text-muted-foreground text-sm">View your services, renewals, and notifications</p>
      </div>

      <Tabs defaultValue="services">
        <TabsList>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="renewals">Renewals ({renewals.length})</TabsTrigger>
          <TabsTrigger value="notifications" className="relative">
            Notifications ({notifications.length})
            {unreadCount > 0 && <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">{unreadCount}</span>}
          </TabsTrigger>
        </TabsList>

        {/* SERVICES */}
        <TabsContent value="services" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Hosting Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Server className="h-4 w-4" /> Hosting</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Provider</span>
                  <span className="text-sm font-medium">{customer.hosting_provider || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Expiry Date</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{customer.hosting_expiry_date ? format(parseISO(customer.hosting_expiry_date), "dd/MM/yyyy") : "N/A"}</span>
                    {getExpiryBadge(customer.hosting_expiry_date)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Domain Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4" /> Domain</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Domain Info</span>
                  <span className="text-sm font-medium">{customer.domain_provider_info || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Expiry Date</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{customer.domain_expiry_date ? format(parseISO(customer.domain_expiry_date), "dd/MM/yyyy") : "N/A"}</span>
                    {getExpiryBadge(customer.domain_expiry_date)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Website & Services */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Website</span>
                {customer.website_url ? (
                  <a href={customer.website_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary flex items-center gap-1 hover:underline">
                    {customer.website_url} <ExternalLink className="h-3 w-3" />
                  </a>
                ) : <span className="text-sm">N/A</span>}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Active Services</span>
                <div className="flex gap-1 flex-wrap justify-end">
                  {customer.services?.map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>) || <span className="text-sm">None</span>}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status</span>
                {customer.is_active
                  ? <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Active</Badge>
                  : <Badge variant="destructive">Inactive</Badge>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* RENEWALS */}
        <TabsContent value="renewals">
          <Card>
            <CardContent className="pt-6">
              {renewals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No renewal history yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Old Expiry</TableHead>
                      <TableHead>New Expiry</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Note</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {renewals.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="text-xs">{format(new Date(r.created_at), "dd/MM/yyyy")}</TableCell>
                        <TableCell><Badge variant="outline" className="capitalize">{r.renewal_type}</Badge></TableCell>
                        <TableCell className="text-xs">{r.old_expiry_date ? format(parseISO(r.old_expiry_date), "dd/MM/yyyy") : "-"}</TableCell>
                        <TableCell className="text-xs">{format(parseISO(r.new_expiry_date), "dd/MM/yyyy")}</TableCell>
                        <TableCell>{r.amount ? `${Number(r.amount).toLocaleString()}₫` : "-"}</TableCell>
                        <TableCell className="text-xs max-w-[150px] truncate">{r.note || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* NOTIFICATIONS */}
        <TabsContent value="notifications">
          <Card>
            <CardContent className="pt-6">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No notifications yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map(n => (
                    <div key={n.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                      <div className="mt-0.5">
                        {n.send_status === "sent" ? <CheckCircle className="h-4 w-4 text-green-500" /> : 
                         n.send_status === "failed" ? <AlertTriangle className="h-4 w-4 text-destructive" /> :
                         <Clock className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{n.title || "Reminder"}</p>
                        {n.message && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>}
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge variant="outline" className="text-[10px]">{n.related_expiry_type}</Badge>
                          <Badge variant="secondary" className="text-[10px]">{n.channel}</Badge>
                          <span className="text-[10px] text-muted-foreground">{format(new Date(n.created_at), "dd/MM/yyyy HH:mm")}</span>
                        </div>
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

export default UserServices;
