import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Pencil, Trash2, Eye, Download, RefreshCw, Users, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
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

const emptyForm: Omit<Customer, "id" | "created_at" | "updated_at" | "created_by"> = {
  customer_name: "",
  services: [],
  website_url: "",
  hosting_provider: "",
  hosting_expiry_date: "",
  domain_provider_info: "",
  domain_expiry_date: "",
  notes: "",
  contact_name: "",
  phone: "",
  email: "",
  address: "",
  is_active: true,
};

const SERVICE_OPTIONS = [
  "Web Design", "Web Development", "Hosting", "Domain", "SEO", "Maintenance",
  "Email Hosting", "SSL Certificate", "Cloud Server", "Social Media", "Other"
];

function getExpiryBadge(dateStr: string | null) {
  if (!dateStr) return null;
  const days = differenceInDays(parseISO(dateStr), new Date());
  if (days < 0) return <Badge variant="destructive" className="text-xs">Expired</Badge>;
  if (days <= 30) return <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-xs">≤30 days</Badge>;
  if (days <= 90) return <Badge className="bg-yellow-400 hover:bg-yellow-500 text-black text-xs">≤90 days</Badge>;
  return <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Active</Badge>;
}

const PAGE_SIZE = 10;

const AdminCustomers = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterService, setFilterService] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
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

  const fetchCustomers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("customers" as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Failed to load customers");
      console.error(error);
    } else {
      setCustomers((data as any[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchCustomers(); }, []);

  // Summary
  const summary = useMemo(() => {
    const now = new Date();
    let active = 0, hostingExpiringSoon = 0, domainExpiringSoon = 0, expired = 0;
    customers.forEach(c => {
      if (c.is_active) active++;
      const hDays = c.hosting_expiry_date ? differenceInDays(parseISO(c.hosting_expiry_date), now) : null;
      const dDays = c.domain_expiry_date ? differenceInDays(parseISO(c.domain_expiry_date), now) : null;
      if ((hDays !== null && hDays < 0) || (dDays !== null && dDays < 0)) expired++;
      if (hDays !== null && hDays >= 0 && hDays <= 30) hostingExpiringSoon++;
      if (dDays !== null && dDays >= 0 && dDays <= 30) domainExpiringSoon++;
    });
    return { total: customers.length, active, hostingExpiringSoon, domainExpiringSoon, expired };
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
    if (filterService !== "all") {
      list = list.filter(c => c.services?.includes(filterService));
    }
    if (filterStatus === "active") list = list.filter(c => c.is_active);
    else if (filterStatus === "inactive") list = list.filter(c => !c.is_active);
    else if (filterStatus === "expired") {
      list = list.filter(c => {
        const now = new Date();
        const h = c.hosting_expiry_date ? differenceInDays(parseISO(c.hosting_expiry_date), now) < 0 : false;
        const d = c.domain_expiry_date ? differenceInDays(parseISO(c.domain_expiry_date), now) < 0 : false;
        return h || d;
      });
    }
    if (sortBy === "nearest_expiry") {
      list.sort((a, b) => {
        const aMin = Math.min(
          a.hosting_expiry_date ? new Date(a.hosting_expiry_date).getTime() : Infinity,
          a.domain_expiry_date ? new Date(a.domain_expiry_date).getTime() : Infinity
        );
        const bMin = Math.min(
          b.hosting_expiry_date ? new Date(b.hosting_expiry_date).getTime() : Infinity,
          b.domain_expiry_date ? new Date(b.domain_expiry_date).getTime() : Infinity
        );
        return aMin - bMin;
      });
    } else if (sortBy === "name") {
      list.sort((a, b) => a.customer_name.localeCompare(b.customer_name));
    } else {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return list;
  }, [customers, search, filterService, filterStatus, sortBy]);

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
      customer_name: c.customer_name,
      services: c.services || [],
      website_url: c.website_url || "",
      hosting_provider: c.hosting_provider || "",
      hosting_expiry_date: c.hosting_expiry_date || "",
      domain_provider_info: c.domain_provider_info || "",
      domain_expiry_date: c.domain_expiry_date || "",
      notes: c.notes || "",
      contact_name: c.contact_name || "",
      phone: c.phone || "",
      email: c.email || "",
      address: c.address || "",
      is_active: c.is_active,
    });
    setServicesInput((c.services || []).join(", "));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.customer_name.trim()) {
      toast.error("Customer name is required");
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      services: servicesInput ? servicesInput.split(",").map(s => s.trim()).filter(Boolean) : [],
      hosting_expiry_date: form.hosting_expiry_date || null,
      domain_expiry_date: form.domain_expiry_date || null,
      website_url: form.website_url || null,
      hosting_provider: form.hosting_provider || null,
      domain_provider_info: form.domain_provider_info || null,
      notes: form.notes || null,
      contact_name: form.contact_name || null,
      phone: form.phone || null,
      email: form.email || null,
      address: form.address || null,
    };

    if (editingCustomer) {
      const { error } = await supabase
        .from("customers" as any)
        .update(payload as any)
        .eq("id", editingCustomer.id);
      if (error) { toast.error("Update failed"); console.error(error); }
      else { toast.success("Customer updated"); setDialogOpen(false); fetchCustomers(); }
    } else {
      const { error } = await supabase
        .from("customers" as any)
        .insert({ ...payload, created_by: user?.id } as any);
      if (error) { toast.error("Create failed"); console.error(error); }
      else { toast.success("Customer created"); setDialogOpen(false); fetchCustomers(); }
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("customers" as any).delete().eq("id", deleteTarget.id);
    if (error) { toast.error("Delete failed"); console.error(error); }
    else { toast.success("Customer deleted"); setDeleteOpen(false); setDeleteTarget(null); fetchCustomers(); }
  };

  const handleRenew = async (c: Customer, field: "hosting_expiry_date" | "domain_expiry_date") => {
    const current = c[field] ? parseISO(c[field]!) : new Date();
    const newDate = new Date(current);
    newDate.setFullYear(newDate.getFullYear() + 1);
    const { error } = await supabase
      .from("customers" as any)
      .update({ [field]: format(newDate, "yyyy-MM-dd") } as any)
      .eq("id", c.id);
    if (error) { toast.error("Renew failed"); }
    else { toast.success(`Renewed ${field === "hosting_expiry_date" ? "hosting" : "domain"} for 1 year`); fetchCustomers(); }
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
    const a = document.createElement("a");
    a.href = url;
    a.download = `customers_${format(new Date(), "yyyyMMdd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
          <Users className="h-8 w-8 text-primary shrink-0" />
          <div><p className="text-2xl font-bold">{summary.total}</p><p className="text-xs text-muted-foreground">Total</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
          <CheckCircle className="h-8 w-8 text-green-500 shrink-0" />
          <div><p className="text-2xl font-bold">{summary.active}</p><p className="text-xs text-muted-foreground">Active</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-amber-500 shrink-0" />
          <div><p className="text-2xl font-bold">{summary.hostingExpiringSoon}</p><p className="text-xs text-muted-foreground">Hosting ≤30d</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-yellow-500 shrink-0" />
          <div><p className="text-2xl font-bold">{summary.domainExpiringSoon}</p><p className="text-xs text-muted-foreground">Domain ≤30d</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
          <XCircle className="h-8 w-8 text-destructive shrink-0" />
          <div><p className="text-2xl font-bold">{summary.expired}</p><p className="text-xs text-muted-foreground">Expired</p></div>
        </CardContent></Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search name, email, phone, website..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
        </div>
        <Select value={filterService} onValueChange={v => { setFilterService(v); setPage(0); }}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Service" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            {SERVICE_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); setPage(0); }}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="nearest_expiry">Nearest Expiry</SelectItem>
            <SelectItem value="name">Name A-Z</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={exportCSV} title="Export CSV"><Download className="h-4 w-4" /></Button>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-1" />Add Customer</Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
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
                  {paginated.map(c => (
                    <TableRow key={c.id} className="group">
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
                          <Button variant="ghost" size="icon" onClick={() => { setViewCustomer(c); setDetailOpen(true); }}><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => { setDeleteTarget(c); setDeleteOpen(true); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? "Edit Customer" : "Add Customer"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Customer Name *</Label>
              <Input value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Services (comma-separated)</Label>
              <Input value={servicesInput} onChange={e => setServicesInput(e.target.value)} placeholder="Hosting, Domain, SEO" />
            </div>
            <div className="space-y-1.5">
              <Label>Website URL</Label>
              <Input value={form.website_url || ""} onChange={e => setForm({ ...form, website_url: e.target.value })} placeholder="https://" />
            </div>
            <div className="space-y-1.5">
              <Label>Hosting Provider</Label>
              <Input value={form.hosting_provider || ""} onChange={e => setForm({ ...form, hosting_provider: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Hosting Expiry Date</Label>
              <Input type="date" value={form.hosting_expiry_date || ""} onChange={e => setForm({ ...form, hosting_expiry_date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Domain Provider</Label>
              <Input value={form.domain_provider_info || ""} onChange={e => setForm({ ...form, domain_provider_info: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Domain Expiry Date</Label>
              <Input type="date" value={form.domain_expiry_date || ""} onChange={e => setForm({ ...form, domain_expiry_date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Contact Name</Label>
              <Input value={form.contact_name || ""} onChange={e => setForm({ ...form, contact_name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={form.phone || ""} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label>Address</Label>
              <Input value={form.address || ""} onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} />
            </div>
            <div className="flex items-center gap-3">
              <Label>Active</Label>
              <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editingCustomer ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>
          {viewCustomer && (
            <div className="space-y-4">
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

              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-sm">Hosting</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-muted-foreground text-xs">Provider</p><p>{viewCustomer.hosting_provider || "—"}</p></div>
                  <div className="flex items-center justify-between">
                    <div><p className="text-muted-foreground text-xs">Expiry</p><div className="flex items-center gap-2">{getExpiryBadge(viewCustomer.hosting_expiry_date)}<span>{viewCustomer.hosting_expiry_date ? format(parseISO(viewCustomer.hosting_expiry_date), "dd/MM/yyyy") : "—"}</span></div></div>
                    {viewCustomer.hosting_expiry_date && (
                      <Button variant="outline" size="sm" onClick={() => handleRenew(viewCustomer, "hosting_expiry_date")} className="shrink-0">
                        <RefreshCw className="h-3 w-3 mr-1" />Renew +1yr
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-sm">Domain</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-muted-foreground text-xs">Provider</p><p>{viewCustomer.domain_provider_info || "—"}</p></div>
                  <div className="flex items-center justify-between">
                    <div><p className="text-muted-foreground text-xs">Expiry</p><div className="flex items-center gap-2">{getExpiryBadge(viewCustomer.domain_expiry_date)}<span>{viewCustomer.domain_expiry_date ? format(parseISO(viewCustomer.domain_expiry_date), "dd/MM/yyyy") : "—"}</span></div></div>
                    {viewCustomer.domain_expiry_date && (
                      <Button variant="outline" size="sm" onClick={() => handleRenew(viewCustomer, "domain_expiry_date")} className="shrink-0">
                        <RefreshCw className="h-3 w-3 mr-1" />Renew +1yr
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {viewCustomer.notes && (
                <div><p className="text-muted-foreground text-xs mb-1">Notes</p><p className="text-sm bg-muted/50 rounded-lg p-3">{viewCustomer.notes}</p></div>
              )}
              <p className="text-xs text-muted-foreground">Created: {format(parseISO(viewCustomer.created_at), "dd/MM/yyyy HH:mm")}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Customer</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure you want to delete <strong>{deleteTarget?.customer_name}</strong>? This action cannot be undone.</p>
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
