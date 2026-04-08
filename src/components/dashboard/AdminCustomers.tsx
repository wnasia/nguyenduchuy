import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Plus, Search, Pencil, Trash2, Eye, Download, RefreshCw, Users, AlertTriangle, CheckCircle, XCircle, Clock, Send, History } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";

interface Customer {
  id: string;
  customer_name: string;
  services: string[];
  website_url: string | null;
  hosting_provider: string | null;
  hosting_expiry_date: string | null;
  domain_provider_info: string | null;
  domain_expiry_date: string | null;
  hosting_price: number;
  domain_price: number;
  tax_rate: number;
  notes: string | null;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface CustomerNote {
  id: string;
  customer_id: string;
  note_content: string;
  created_by: string | null;
  created_at: string;
}

interface RenewalRecord {
  id: string;
  customer_id: string;
  renewal_type: string;
  old_expiry_date: string | null;
  new_expiry_date: string;
  amount: number;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

const emptyForm: Omit<Customer, "id" | "created_at" | "updated_at" | "created_by"> = {
  customer_name: "", services: [], website_url: "", hosting_provider: "",
  hosting_expiry_date: "", domain_provider_info: "", domain_expiry_date: "",
  hosting_price: 0, domain_price: 0, tax_rate: 10,
  notes: "", contact_name: "", phone: "", email: "", address: "", is_active: true,
};

const SERVICE_OPTIONS = [
  "Web Design", "Web Development", "Hosting", "Domain", "SEO", "Maintenance",
  "Email Hosting", "SSL Certificate", "Cloud Server", "Social Media", "Other"
];

const EXPIRY_FILTERS = [
  { key: "all", label: "All" },
  { key: "expired", label: "Expired" },
  { key: "7d", label: "≤7 days" },
  { key: "15d", label: "≤15 days" },
  { key: "30d", label: "≤30 days" },
  { key: "90d", label: "≤90 days" },
];

function getExpiryDays(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return differenceInDays(parseISO(dateStr), new Date());
}

function getExpiryBadge(dateStr: string | null) {
  const days = getExpiryDays(dateStr);
  if (days === null) return null;
  if (days < 0) return <Badge variant="destructive" className="text-xs">Expired</Badge>;
  if (days <= 7) return <Badge variant="destructive" className="text-xs animate-pulse">≤7 days</Badge>;
  if (days <= 15) return <Badge className="bg-orange-500 hover:bg-orange-600 text-white text-xs">≤15 days</Badge>;
  if (days <= 30) return <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-xs">≤30 days</Badge>;
  if (days <= 90) return <Badge className="bg-yellow-400 hover:bg-yellow-500 text-black text-xs">≤90 days</Badge>;
  return <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Active</Badge>;
}

function matchesExpiryFilter(c: Customer, filter: string): boolean {
  if (filter === "all") return true;
  const hDays = getExpiryDays(c.hosting_expiry_date);
  const dDays = getExpiryDays(c.domain_expiry_date);
  const minDays = Math.min(hDays ?? Infinity, dDays ?? Infinity);
  if (minDays === Infinity) return false;
  if (filter === "expired") return minDays < 0;
  if (filter === "7d") return minDays >= 0 && minDays <= 7;
  if (filter === "15d") return minDays >= 0 && minDays <= 15;
  if (filter === "30d") return minDays >= 0 && minDays <= 30;
  if (filter === "90d") return minDays >= 0 && minDays <= 90;
  return true;
}

const PAGE_SIZE = 10;

const AdminCustomers = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterService, setFilterService] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterExpiry, setFilterExpiry] = useState("all");
  const [sortBy, setSortBy] = useState("nearest_expiry");
  const [page, setPage] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [servicesInput, setServicesInput] = useState("");

  // Notes state
  const [customerNotes, setCustomerNotes] = useState<CustomerNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);

  // Renewal state
  const [renewalHistory, setRenewalHistory] = useState<RenewalRecord[]>([]);
  const [renewDialogOpen, setRenewDialogOpen] = useState(false);
  const [renewType, setRenewType] = useState<"hosting" | "domain">("hosting");
  const [renewAmount, setRenewAmount] = useState("");
  const [renewNote, setRenewNote] = useState("");
  const [renewTarget, setRenewTarget] = useState<Customer | null>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("customers" as any).select("*").order("created_at", { ascending: false });
    if (error) { toast.error("Failed to load customers"); console.error(error); }
    else setCustomers((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchCustomers(); }, []);

  const fetchNotes = async (customerId: string) => {
    const { data } = await supabase
      .from("customer_notes" as any).select("*").eq("customer_id", customerId).order("created_at", { ascending: false });
    setCustomerNotes((data as any[]) || []);
  };

  const fetchRenewals = async (customerId: string) => {
    const { data } = await supabase
      .from("renewal_history" as any).select("*").eq("customer_id", customerId).order("created_at", { ascending: false });
    setRenewalHistory((data as any[]) || []);
  };

  // Summary with extended expiry counts
  const summary = useMemo(() => {
    const now = new Date();
    let active = 0, expired = 0, d7 = 0, d15 = 0, d30 = 0, d90 = 0;
    customers.forEach(c => {
      if (c.is_active) active++;
      const hDays = getExpiryDays(c.hosting_expiry_date);
      const dDays = getExpiryDays(c.domain_expiry_date);
      const minDays = Math.min(hDays ?? Infinity, dDays ?? Infinity);
      if (minDays === Infinity) return;
      if (minDays < 0) expired++;
      else if (minDays <= 7) d7++;
      else if (minDays <= 15) d15++;
      else if (minDays <= 30) d30++;
      else if (minDays <= 90) d90++;
    });
    return { total: customers.length, active, expired, d7, d15, d30, d90 };
  }, [customers]);

  // Filter + Search + Sort
  const filtered = useMemo(() => {
    let list = [...customers];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(c =>
        c.customer_name.toLowerCase().includes(s) ||
        (c.email || "").toLowerCase().includes(s) ||
        (c.phone || "").includes(s) ||
        (c.website_url || "").toLowerCase().includes(s)
      );
    }
    if (filterService !== "all") list = list.filter(c => c.services?.includes(filterService));
    if (filterStatus === "active") list = list.filter(c => c.is_active);
    else if (filterStatus === "inactive") list = list.filter(c => !c.is_active);
    list = list.filter(c => matchesExpiryFilter(c, filterExpiry));
    if (sortBy === "nearest_expiry") {
      list.sort((a, b) => {
        const aMin = Math.min(a.hosting_expiry_date ? new Date(a.hosting_expiry_date).getTime() : Infinity, a.domain_expiry_date ? new Date(a.domain_expiry_date).getTime() : Infinity);
        const bMin = Math.min(b.hosting_expiry_date ? new Date(b.hosting_expiry_date).getTime() : Infinity, b.domain_expiry_date ? new Date(b.domain_expiry_date).getTime() : Infinity);
        return aMin - bMin;
      });
    } else if (sortBy === "name") list.sort((a, b) => a.customer_name.localeCompare(b.customer_name));
    else list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return list;
  }, [customers, search, filterService, filterStatus, filterExpiry, sortBy]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const openAdd = () => {
    setEditingCustomer(null);
    setForm({ ...emptyForm });
    setServicesInput("");
    setDialogOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditingCustomer(c);
    setForm({
      customer_name: c.customer_name, services: c.services || [], website_url: c.website_url || "",
      hosting_provider: c.hosting_provider || "", hosting_expiry_date: c.hosting_expiry_date || "",
      domain_provider_info: c.domain_provider_info || "", domain_expiry_date: c.domain_expiry_date || "",
      hosting_price: c.hosting_price || 0, domain_price: c.domain_price || 0, tax_rate: c.tax_rate ?? 10,
      notes: c.notes || "", contact_name: c.contact_name || "", phone: c.phone || "",
      email: c.email || "", address: c.address || "", is_active: c.is_active,
    });
    setServicesInput((c.services || []).join(", "));
    setDialogOpen(true);
  };

  const openDetail = async (c: Customer) => {
    setViewCustomer(c);
    setDetailOpen(true);
    setNewNote("");
    await Promise.all([fetchNotes(c.id), fetchRenewals(c.id)]);
  };

  const handleSave = async () => {
    if (!form.customer_name.trim()) { toast.error("Customer name is required"); return; }
    setSaving(true);
    const payload = {
      ...form,
      services: servicesInput ? servicesInput.split(",").map(s => s.trim()).filter(Boolean) : [],
      hosting_expiry_date: form.hosting_expiry_date || null,
      domain_expiry_date: form.domain_expiry_date || null,
      hosting_price: form.hosting_price || 0,
      domain_price: form.domain_price || 0,
      tax_rate: form.tax_rate ?? 10,
      website_url: form.website_url || null, hosting_provider: form.hosting_provider || null,
      domain_provider_info: form.domain_provider_info || null, notes: form.notes || null,
      contact_name: form.contact_name || null, phone: form.phone || null,
      email: form.email || null, address: form.address || null,
    };
    if (editingCustomer) {
      const { error } = await supabase.from("customers" as any).update(payload as any).eq("id", editingCustomer.id);
      if (error) toast.error("Update failed");
      else { toast.success("Customer updated"); setDialogOpen(false); fetchCustomers(); }
    } else {
      const { error } = await supabase.from("customers" as any).insert({ ...payload, created_by: user?.id } as any);
      if (error) toast.error("Create failed");
      else { toast.success("Customer created"); setDialogOpen(false); fetchCustomers(); }
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("customers" as any).delete().eq("id", deleteTarget.id);
    if (error) toast.error("Delete failed");
    else { toast.success("Customer deleted"); setDeleteOpen(false); setDeleteTarget(null); fetchCustomers(); }
  };

  // Renew with history
  const openRenewDialog = (c: Customer, type: "hosting" | "domain") => {
    setRenewTarget(c);
    setRenewType(type);
    setRenewAmount("");
    setRenewNote("");
    setRenewDialogOpen(true);
  };

  const handleRenew = async () => {
    if (!renewTarget) return;
    const field = renewType === "hosting" ? "hosting_expiry_date" : "domain_expiry_date";
    const oldDate = renewTarget[field];
    const current = oldDate ? parseISO(oldDate) : new Date();
    const newDate = new Date(current);
    newDate.setFullYear(newDate.getFullYear() + 1);
    const newDateStr = format(newDate, "yyyy-MM-dd");

    // Update customer expiry
    const { error: updateErr } = await supabase
      .from("customers" as any).update({ [field]: newDateStr } as any).eq("id", renewTarget.id);
    if (updateErr) { toast.error("Renew failed"); return; }

    // Create renewal history record
    await supabase.from("renewal_history" as any).insert({
      customer_id: renewTarget.id,
      renewal_type: renewType,
      old_expiry_date: oldDate || null,
      new_expiry_date: newDateStr,
      amount: renewAmount ? parseFloat(renewAmount) : 0,
      note: renewNote || null,
      created_by: user?.id,
    } as any);

    toast.success(`Renewed ${renewType} for 1 year`);
    setRenewDialogOpen(false);
    fetchCustomers();
    // Refresh detail if open
    if (viewCustomer?.id === renewTarget.id) {
      const updated = { ...renewTarget, [field]: newDateStr };
      setViewCustomer(updated as Customer);
      fetchRenewals(renewTarget.id);
    }
  };

  // Add note
  const handleAddNote = async () => {
    if (!viewCustomer || !newNote.trim()) return;
    setNoteSaving(true);
    const { error } = await supabase.from("customer_notes" as any).insert({
      customer_id: viewCustomer.id,
      note_content: newNote.trim(),
      created_by: user?.id,
    } as any);
    if (error) toast.error("Failed to add note");
    else { toast.success("Note added"); setNewNote(""); fetchNotes(viewCustomer.id); }
    setNoteSaving(false);
  };

  const exportCSV = () => {
    const headers = ["Customer Name", "Services", "Website", "Hosting Provider", "Hosting Expiry", "Domain Provider", "Domain Expiry", "Contact", "Phone", "Email", "Address", "Active", "Notes"];
    const rows = filtered.map(c => [
      c.customer_name, (c.services || []).join("; "), c.website_url || "", c.hosting_provider || "",
      c.hosting_expiry_date || "", c.domain_provider_info || "", c.domain_expiry_date || "",
      c.contact_name || "", c.phone || "", c.email || "", c.address || "",
      c.is_active ? "Yes" : "No", c.notes || ""
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `customers_${format(new Date(), "yyyyMMdd")}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { icon: Users, label: "Total", value: summary.total, color: "text-primary" },
          { icon: CheckCircle, label: "Active", value: summary.active, color: "text-green-500" },
          { icon: XCircle, label: "Expired", value: summary.expired, color: "text-destructive", clickFilter: "expired" },
          { icon: AlertTriangle, label: "≤7 days", value: summary.d7, color: "text-red-500", clickFilter: "7d" },
          { icon: AlertTriangle, label: "≤15 days", value: summary.d15, color: "text-orange-500", clickFilter: "15d" },
          { icon: Clock, label: "≤30 days", value: summary.d30, color: "text-amber-500", clickFilter: "30d" },
          { icon: Clock, label: "≤90 days", value: summary.d90, color: "text-yellow-500", clickFilter: "90d" },
        ].map(({ icon: Icon, label, value, color, clickFilter }) => (
          <Card
            key={label}
            className={`cursor-pointer transition-all hover:shadow-md ${filterExpiry === clickFilter ? "ring-2 ring-primary" : ""}`}
            onClick={() => { setFilterExpiry(clickFilter || "all"); setPage(0); }}
          >
            <CardContent className="pt-3 pb-2 px-3 flex items-center gap-2">
              <Icon className={`h-6 w-6 shrink-0 ${color}`} />
              <div>
                <p className="text-xl font-bold leading-none">{value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick expiry filter chips */}
      <div className="flex flex-wrap gap-2">
        {EXPIRY_FILTERS.map(f => (
          <Button
            key={f.key}
            variant={filterExpiry === f.key ? "default" : "outline"}
            size="sm"
            onClick={() => { setFilterExpiry(f.key); setPage(0); }}
            className="text-xs h-7"
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search name, email, phone, website..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
        </div>
        <Select value={filterService} onValueChange={v => { setFilterService(v); setPage(0); }}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Service" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            {SERVICE_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); setPage(0); }}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="nearest_expiry">Nearest Expiry</SelectItem>
            <SelectItem value="name">Name A-Z</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={exportCSV} title="Export CSV"><Download className="h-4 w-4" /></Button>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-1" />Add</Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="text-lg font-medium">No customers found</p>
              <p className="text-sm">Add your first customer or adjust filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Services</TableHead>
                    <TableHead>Website</TableHead>
                    <TableHead>Hosting Expiry</TableHead>
                    <TableHead>Domain Expiry</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((c, index) => (
                    <TableRow key={c.id} className="group">
                      <TableCell className="text-muted-foreground text-sm">{page * PER_PAGE + index + 1}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{c.customer_name}</p>
                          {c.contact_name && <p className="text-xs text-muted-foreground">{c.contact_name}</p>}
                          {c.email && <p className="text-xs text-muted-foreground">{c.email}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(c.services || []).map(s => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {c.website_url ? <a href={c.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">{c.website_url.replace(/^https?:\/\//, "")}</a> : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getExpiryBadge(c.hosting_expiry_date)}
                          <span className="text-sm">{c.hosting_expiry_date ? format(parseISO(c.hosting_expiry_date), "dd/MM/yyyy") : "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getExpiryBadge(c.domain_expiry_date)}
                          <span className="text-sm">{c.domain_expiry_date ? format(parseISO(c.domain_expiry_date), "dd/MM/yyyy") : "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {c.is_active
                          ? <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Active</Badge>
                          : <Badge variant="secondary">Inactive</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openDetail(c)} title="View"><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(c)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => openRenewDialog(c, "hosting")} title="Renew Hosting"><RefreshCw className="h-4 w-4 text-blue-500" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => { setDeleteTarget(c); setDeleteOpen(true); }} title="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{filtered.length} customer(s)</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <span className="text-sm flex items-center px-2">{page + 1} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      {/* ============ Add/Edit Dialog ============ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingCustomer ? "Edit Customer" : "Add Customer"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Customer Name *</Label><Input value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Services (comma-separated)</Label><Input value={servicesInput} onChange={e => setServicesInput(e.target.value)} placeholder="Hosting, Domain, SEO" /></div>
            <div className="space-y-1.5"><Label>Website URL</Label><Input value={form.website_url || ""} onChange={e => setForm({ ...form, website_url: e.target.value })} placeholder="https://" /></div>
            <div className="space-y-1.5"><Label>Hosting Provider</Label><Input value={form.hosting_provider || ""} onChange={e => setForm({ ...form, hosting_provider: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Hosting Expiry</Label><Input type="date" value={form.hosting_expiry_date || ""} onChange={e => setForm({ ...form, hosting_expiry_date: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Domain Provider</Label><Input value={form.domain_provider_info || ""} onChange={e => setForm({ ...form, domain_provider_info: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Domain Expiry</Label><Input type="date" value={form.domain_expiry_date || ""} onChange={e => setForm({ ...form, domain_expiry_date: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Contact Name</Label><Input value={form.contact_name || ""} onChange={e => setForm({ ...form, contact_name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone || ""} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div className="md:col-span-2 space-y-1.5"><Label>Address</Label><Input value={form.address || ""} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
            <div className="md:col-span-2"><Separator /><p className="text-sm font-semibold text-muted-foreground">Giá dịch vụ</p></div>
            <div className="space-y-1.5"><Label>Giá Hosting (VNĐ)</Label><Input type="number" value={form.hosting_price || ""} onChange={e => setForm({ ...form, hosting_price: Number(e.target.value) || 0 })} placeholder="0" /></div>
            <div className="space-y-1.5"><Label>Giá Domain (VNĐ)</Label><Input type="number" value={form.domain_price || ""} onChange={e => setForm({ ...form, domain_price: Number(e.target.value) || 0 })} placeholder="0" /></div>
            <div className="space-y-1.5"><Label>Thuế suất (%)</Label><Input type="number" value={form.tax_rate} onChange={e => setForm({ ...form, tax_rate: Number(e.target.value) || 0 })} placeholder="10" /></div>
            <div className="flex items-center gap-3"><Label>Active</Label><Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editingCustomer ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ Detail Dialog with Notes & Renewal History ============ */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Customer Details</DialogTitle></DialogHeader>
          {viewCustomer && (
            <div className="space-y-5">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground text-xs">Name</p><p className="font-medium">{viewCustomer.customer_name}</p></div>
                <div><p className="text-muted-foreground text-xs">Status</p>{viewCustomer.is_active ? <Badge className="bg-green-100 text-green-700">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}</div>
                <div><p className="text-muted-foreground text-xs">Contact</p><p>{viewCustomer.contact_name || "—"}</p></div>
                <div><p className="text-muted-foreground text-xs">Phone</p><p>{viewCustomer.phone || "—"}</p></div>
                <div><p className="text-muted-foreground text-xs">Email</p><p>{viewCustomer.email || "—"}</p></div>
                <div><p className="text-muted-foreground text-xs">Website</p>{viewCustomer.website_url ? <a href={viewCustomer.website_url} target="_blank" className="text-primary hover:underline">{viewCustomer.website_url}</a> : "—"}</div>
                <div><p className="text-muted-foreground text-xs">Address</p><p>{viewCustomer.address || "—"}</p></div>
                <div><p className="text-muted-foreground text-xs">Services</p><div className="flex flex-wrap gap-1">{(viewCustomer.services || []).map(s => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}</div></div>
              </div>

              {/* Hosting & Domain with Renew */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">Hosting</h4>
                  <p className="text-xs text-muted-foreground">Provider: {viewCustomer.hosting_provider || "—"}</p>
                  <div className="flex items-center gap-2">{getExpiryBadge(viewCustomer.hosting_expiry_date)}<span className="text-sm">{viewCustomer.hosting_expiry_date ? format(parseISO(viewCustomer.hosting_expiry_date), "dd/MM/yyyy") : "—"}</span></div>
                  {viewCustomer.hosting_expiry_date && (
                    <Button variant="outline" size="sm" onClick={() => openRenewDialog(viewCustomer, "hosting")} className="w-full mt-2">
                      <RefreshCw className="h-3 w-3 mr-1" />Renew Hosting
                    </Button>
                  )}
                </div>
                <div className="border rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">Domain</h4>
                  <p className="text-xs text-muted-foreground">Provider: {viewCustomer.domain_provider_info || "—"}</p>
                  <div className="flex items-center gap-2">{getExpiryBadge(viewCustomer.domain_expiry_date)}<span className="text-sm">{viewCustomer.domain_expiry_date ? format(parseISO(viewCustomer.domain_expiry_date), "dd/MM/yyyy") : "—"}</span></div>
                  {viewCustomer.domain_expiry_date && (
                    <Button variant="outline" size="sm" onClick={() => openRenewDialog(viewCustomer, "domain")} className="w-full mt-2">
                      <RefreshCw className="h-3 w-3 mr-1" />Renew Domain
                    </Button>
                  )}
                </div>
              </div>

              {viewCustomer.notes && (
                <div><p className="text-muted-foreground text-xs mb-1">General Notes</p><p className="text-sm bg-muted/50 rounded-lg p-3">{viewCustomer.notes}</p></div>
              )}

              <Separator />

              {/* Internal Care Notes */}
              <div>
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2"><Send className="h-4 w-4" />Internal Notes / Care Logs</h4>
                <div className="flex gap-2 mb-4">
                  <Textarea
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    placeholder="Add an internal note..."
                    rows={2}
                    className="flex-1"
                  />
                  <Button onClick={handleAddNote} disabled={noteSaving || !newNote.trim()} size="sm" className="self-end">
                    {noteSaving ? "..." : "Add"}
                  </Button>
                </div>
                {customerNotes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No notes yet.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {customerNotes.map(n => (
                      <div key={n.id} className="border rounded-lg p-3 bg-muted/30">
                        <p className="text-sm whitespace-pre-wrap">{n.note_content}</p>
                        <p className="text-xs text-muted-foreground mt-1">{format(parseISO(n.created_at), "dd/MM/yyyy HH:mm")}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Renewal History */}
              <div>
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2"><History className="h-4 w-4" />Renewal History</h4>
                {renewalHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No renewal records.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Type</TableHead>
                          <TableHead className="text-xs">Old Expiry</TableHead>
                          <TableHead className="text-xs">New Expiry</TableHead>
                          <TableHead className="text-xs">Amount</TableHead>
                          <TableHead className="text-xs">Note</TableHead>
                          <TableHead className="text-xs">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {renewalHistory.map(r => (
                          <TableRow key={r.id}>
                            <TableCell><Badge variant="outline" className="text-xs capitalize">{r.renewal_type}</Badge></TableCell>
                            <TableCell className="text-xs">{r.old_expiry_date ? format(parseISO(r.old_expiry_date), "dd/MM/yyyy") : "—"}</TableCell>
                            <TableCell className="text-xs">{format(parseISO(r.new_expiry_date), "dd/MM/yyyy")}</TableCell>
                            <TableCell className="text-xs">{r.amount ? `${Number(r.amount).toLocaleString()} ₫` : "—"}</TableCell>
                            <TableCell className="text-xs max-w-[150px] truncate">{r.note || "—"}</TableCell>
                            <TableCell className="text-xs">{format(parseISO(r.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground">Created: {format(parseISO(viewCustomer.created_at), "dd/MM/yyyy HH:mm")}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ============ Renew Dialog ============ */}
      <Dialog open={renewDialogOpen} onOpenChange={setRenewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Renew {renewType === "hosting" ? "Hosting" : "Domain"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm">Customer: <strong>{renewTarget?.customer_name}</strong></p>
            <p className="text-sm text-muted-foreground">
              Current expiry: {renewTarget && renewTarget[renewType === "hosting" ? "hosting_expiry_date" : "domain_expiry_date"]
                ? format(parseISO(renewTarget[renewType === "hosting" ? "hosting_expiry_date" : "domain_expiry_date"]!), "dd/MM/yyyy")
                : "Not set"
              }
            </p>
            <p className="text-sm font-medium text-primary">→ Will extend by 1 year</p>
            <div className="space-y-1.5">
              <Label>Amount (VND)</Label>
              <Input type="number" value={renewAmount} onChange={e => setRenewAmount(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label>Note (optional)</Label>
              <Textarea value={renewNote} onChange={e => setRenewNote(e.target.value)} rows={2} placeholder="Payment info, invoice #..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenewDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRenew}><RefreshCw className="h-4 w-4 mr-1" />Confirm Renewal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Customer</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure you want to delete <strong>{deleteTarget?.customer_name}</strong>? All notes and renewal history will also be deleted.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCustomers;
