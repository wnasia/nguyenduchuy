import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Bell, Clock, Mail, Monitor, Send, History, AlertTriangle, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface ReminderRule {
  id: string;
  name: string;
  reminder_type: string;
  days_before_expiry: number;
  channel: string;
  is_default: boolean;
  is_enabled: boolean;
  applies_to_all: boolean;
  customer_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface ReminderTemplate {
  id: string;
  template_key: string;
  subject: string;
  body_template: string;
  created_at: string;
  updated_at: string;
}

interface NotificationDelivery {
  id: string;
  customer_id: string;
  notification_type: string;
  related_expiry_type: string;
  related_expiry_date: string | null;
  reminder_rule_id: string | null;
  channel: string;
  title: string | null;
  message: string | null;
  send_status: string;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

const emptyRuleForm = {
  name: "",
  reminder_type: "both",
  days_before_expiry: 30,
  channel: "both",
  is_enabled: true,
  applies_to_all: true,
  customer_id: null as string | null,
};

const channelLabel = (ch: string) => {
  if (ch === "email") return "Email";
  if (ch === "in_app") return "In-App";
  return "Both";
};

const channelIcon = (ch: string) => {
  if (ch === "email") return <Mail className="h-3.5 w-3.5" />;
  if (ch === "in_app") return <Monitor className="h-3.5 w-3.5" />;
  return <Bell className="h-3.5 w-3.5" />;
};

const typeLabel = (t: string) => {
  if (t === "hosting") return "Hosting";
  if (t === "domain") return "Domain";
  return "Both";
};

const AdminReminderSettings = () => {
  const { user } = useAuth();
  const [rules, setRules] = useState<ReminderRule[]>([]);
  const [templates, setTemplates] = useState<ReminderTemplate[]>([]);
  const [deliveries, setDeliveries] = useState<NotificationDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ReminderRule | null>(null);
  const [form, setForm] = useState(emptyRuleForm);
  const [saving, setSaving] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ReminderTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({ subject: "", body_template: "" });
  const [runningCheck, setRunningCheck] = useState(false);

  const fetchRules = async () => {
    const { data } = await supabase.from("reminder_rules" as any).select("*").order("days_before_expiry", { ascending: true });
    setRules((data as any[]) || []);
  };

  const fetchTemplates = async () => {
    const { data } = await supabase.from("reminder_templates" as any).select("*").order("template_key");
    setTemplates((data as any[]) || []);
  };

  const fetchDeliveries = async () => {
    const { data } = await supabase.from("notification_deliveries" as any).select("*").order("created_at", { ascending: false }).limit(100);
    setDeliveries((data as any[]) || []);
  };

  useEffect(() => {
    Promise.all([fetchRules(), fetchTemplates(), fetchDeliveries()]).then(() => setLoading(false));
  }, []);

  const handleToggleRule = async (rule: ReminderRule) => {
    const { error } = await supabase.from("reminder_rules" as any).update({ is_enabled: !rule.is_enabled } as any).eq("id", rule.id);
    if (error) toast.error("Failed to update rule");
    else { toast.success(`Rule ${!rule.is_enabled ? "enabled" : "disabled"}`); fetchRules(); }
  };

  const handleSaveRule = async () => {
    setSaving(true);
    if (editingRule) {
      const { error } = await supabase.from("reminder_rules" as any).update({
        name: form.name, reminder_type: form.reminder_type, days_before_expiry: form.days_before_expiry,
        channel: form.channel, is_enabled: form.is_enabled, applies_to_all: form.applies_to_all,
        customer_id: form.customer_id || null,
      } as any).eq("id", editingRule.id);
      if (error) toast.error("Failed to update"); else toast.success("Rule updated");
    } else {
      const { error } = await supabase.from("reminder_rules" as any).insert({
        ...form, is_default: false, created_by: user?.id, customer_id: form.customer_id || null,
      } as any);
      if (error) toast.error("Failed to create"); else toast.success("Rule created");
    }
    setSaving(false);
    setDialogOpen(false);
    setEditingRule(null);
    setForm(emptyRuleForm);
    fetchRules();
  };

  const handleDeleteRule = async (rule: ReminderRule) => {
    if (rule.is_default) { toast.error("Cannot delete default rules. Disable instead."); return; }
    const { error } = await supabase.from("reminder_rules" as any).delete().eq("id", rule.id);
    if (error) toast.error("Failed to delete"); else { toast.success("Rule deleted"); fetchRules(); }
  };

  const handleEditRule = (rule: ReminderRule) => {
    setEditingRule(rule);
    setForm({
      name: rule.name, reminder_type: rule.reminder_type, days_before_expiry: rule.days_before_expiry,
      channel: rule.channel, is_enabled: rule.is_enabled, applies_to_all: rule.applies_to_all,
      customer_id: rule.customer_id,
    });
    setDialogOpen(true);
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;
    setSaving(true);
    const { error } = await supabase.from("reminder_templates" as any).update({
      subject: templateForm.subject, body_template: templateForm.body_template,
    } as any).eq("id", editingTemplate.id);
    if (error) toast.error("Failed to update template"); else toast.success("Template updated");
    setSaving(false);
    setTemplateDialogOpen(false);
    fetchTemplates();
  };

  const handleRunReminderCheck = async () => {
    setRunningCheck(true);
    try {
      const { data, error } = await supabase.functions.invoke("reminder-check");
      if (error) throw error;
      toast.success(`Reminder check completed: ${data?.sent || 0} reminders sent`);
      fetchDeliveries();
    } catch (e: any) {
      toast.error("Reminder check failed: " + (e.message || "Unknown error"));
    }
    setRunningCheck(false);
  };

  if (loading) return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
    </div>
  );

  const defaultRules = rules.filter(r => r.is_default);
  const customRules = rules.filter(r => !r.is_default);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Reminder Settings</h2>
          <p className="text-muted-foreground text-sm">Manage renewal reminder rules, templates, and delivery history</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRunReminderCheck} disabled={runningCheck}>
            <Send className="h-4 w-4 mr-2" />
            {runningCheck ? "Running..." : "Run Check Now"}
          </Button>
          <Button onClick={() => { setEditingRule(null); setForm(emptyRuleForm); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Add Rule
          </Button>
        </div>
      </div>

      <Tabs defaultValue="rules">
        <TabsList>
          <TabsTrigger value="rules">Rules ({rules.length})</TabsTrigger>
          <TabsTrigger value="templates">Templates ({templates.length})</TabsTrigger>
          <TabsTrigger value="history">History ({deliveries.length})</TabsTrigger>
        </TabsList>

        {/* RULES TAB */}
        <TabsContent value="rules" className="space-y-6">
          {/* Default Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Clock className="h-5 w-5" /> Default Reminder Rules</CardTitle>
              <CardDescription>System default rules. You can enable/disable or change channel.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Days Before</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {defaultRules.map(rule => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell><Badge variant="outline">{typeLabel(rule.reminder_type)}</Badge></TableCell>
                      <TableCell><Badge variant="secondary">{rule.days_before_expiry} days</Badge></TableCell>
                      <TableCell><span className="flex items-center gap-1.5">{channelIcon(rule.channel)} {channelLabel(rule.channel)}</span></TableCell>
                      <TableCell>
                        <Switch checked={rule.is_enabled} onCheckedChange={() => handleToggleRule(rule)} />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleEditRule(rule)}><Pencil className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Custom Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Bell className="h-5 w-5" /> Custom Reminder Rules</CardTitle>
              <CardDescription>Admin-created reminder rules.</CardDescription>
            </CardHeader>
            <CardContent>
              {customRules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No custom rules yet. Click "Add Rule" to create one.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Days Before</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead>Scope</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customRules.map(rule => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium">{rule.name}</TableCell>
                        <TableCell><Badge variant="outline">{typeLabel(rule.reminder_type)}</Badge></TableCell>
                        <TableCell><Badge variant="secondary">{rule.days_before_expiry} days</Badge></TableCell>
                        <TableCell><span className="flex items-center gap-1.5">{channelIcon(rule.channel)} {channelLabel(rule.channel)}</span></TableCell>
                        <TableCell>{rule.applies_to_all ? "All customers" : "Specific"}</TableCell>
                        <TableCell>
                          <Switch checked={rule.is_enabled} onCheckedChange={() => handleToggleRule(rule)} />
                        </TableCell>
                        <TableCell className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEditRule(rule)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteRule(rule)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TEMPLATES TAB */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Message Templates</CardTitle>
              <CardDescription>Edit reminder message templates. Use placeholders: {"{{customer_name}}, {{website_url}}, {{hosting_expiry_date}}, {{domain_expiry_date}}, {{days_remaining}}"}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Body (preview)</TableHead>
                    <TableHead className="w-20">Edit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map(t => (
                    <TableRow key={t.id}>
                      <TableCell><Badge variant="outline">{t.template_key}</Badge></TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">{t.subject}</TableCell>
                      <TableCell className="max-w-[300px] truncate text-muted-foreground text-xs">{t.body_template}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => {
                          setEditingTemplate(t);
                          setTemplateForm({ subject: t.subject, body_template: t.body_template });
                          setTemplateDialogOpen(true);
                        }}><Pencil className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* HISTORY TAB */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><History className="h-5 w-5" /> Delivery History</CardTitle>
              <CardDescription>Recent reminder notifications sent to customers</CardDescription>
            </CardHeader>
            <CardContent>
              {deliveries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No deliveries yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Expiry Type</TableHead>
                        <TableHead>Channel</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deliveries.map(d => (
                        <TableRow key={d.id}>
                          <TableCell className="text-xs whitespace-nowrap">{format(new Date(d.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{d.notification_type}</Badge></TableCell>
                          <TableCell>{d.related_expiry_type}</TableCell>
                          <TableCell><span className="flex items-center gap-1">{channelIcon(d.channel)} {channelLabel(d.channel)}</span></TableCell>
                          <TableCell className="max-w-[200px] truncate text-xs">{d.title || "-"}</TableCell>
                          <TableCell>
                            {d.send_status === "sent" && <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"><CheckCircle className="h-3 w-3 mr-1" />Sent</Badge>}
                            {d.send_status === "pending" && <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>}
                            {d.send_status === "failed" && <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Failed</Badge>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Rule Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRule ? "Edit Rule" : "Add Custom Rule"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. 15-day hosting reminder" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={form.reminder_type} onValueChange={v => setForm(f => ({ ...f, reminder_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hosting">Hosting</SelectItem>
                    <SelectItem value="domain">Domain</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Days Before Expiry</Label>
                <Input type="number" min={1} max={365} value={form.days_before_expiry} onChange={e => setForm(f => ({ ...f, days_before_expiry: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
            <div>
              <Label>Channel</Label>
              <Select value={form.channel} onValueChange={v => setForm(f => ({ ...f, channel: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Both (Email + In-App)</SelectItem>
                  <SelectItem value="email">Email only</SelectItem>
                  <SelectItem value="in_app">In-App only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.applies_to_all} onCheckedChange={v => setForm(f => ({ ...f, applies_to_all: v }))} />
              <Label>Apply to all customers</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_enabled} onCheckedChange={v => setForm(f => ({ ...f, is_enabled: v }))} />
              <Label>Enabled</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveRule} disabled={saving || !form.name}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Template: {editingTemplate?.template_key}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Subject</Label>
              <Input value={templateForm.subject} onChange={e => setTemplateForm(f => ({ ...f, subject: e.target.value }))} />
            </div>
            <div>
              <Label>Body Template</Label>
              <Textarea rows={6} value={templateForm.body_template} onChange={e => setTemplateForm(f => ({ ...f, body_template: e.target.value }))} />
              <p className="text-xs text-muted-foreground mt-1">
                Placeholders: {"{{customer_name}}, {{website_url}}, {{hosting_expiry_date}}, {{domain_expiry_date}}, {{days_remaining}}"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveTemplate} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReminderSettings;
