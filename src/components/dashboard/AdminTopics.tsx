import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";

interface Topic {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

const AdminTopics = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "", is_active: true, sort_order: 0 });

  const fetchTopics = async () => {
    const { data, error } = await supabase
      .from("topics")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) {
      toast.error("Failed to load topics");
      return;
    }
    setTopics(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchTopics(); }, []);

  const generateSlug = (name: string) =>
    name.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d").replace(/Đ/g, "D")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const openCreate = () => {
    setEditingTopic(null);
    setForm({ name: "", slug: "", description: "", is_active: true, sort_order: topics.length });
    setDialogOpen(true);
  };

  const openEdit = (topic: Topic) => {
    setEditingTopic(topic);
    setForm({ name: topic.name, slug: topic.slug, description: topic.description || "", is_active: topic.is_active, sort_order: topic.sort_order });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Topic name is required"); return; }
    const slug = form.slug.trim() || generateSlug(form.name);

    if (editingTopic) {
      const { error } = await supabase.from("topics").update({ name: form.name, slug, description: form.description || null, is_active: form.is_active, sort_order: form.sort_order }).eq("id", editingTopic.id);
      if (error) { toast.error("Failed to update topic"); return; }
      toast.success("Topic updated");
    } else {
      const { error } = await supabase.from("topics").insert({ name: form.name, slug, description: form.description || null, is_active: form.is_active, sort_order: form.sort_order });
      if (error) { toast.error("Failed to create topic"); return; }
      toast.success("Topic created");
    }
    setDialogOpen(false);
    fetchTopics();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this topic?")) return;
    const { error } = await supabase.from("topics").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Topic deleted");
    fetchTopics();
  };

  const handleToggleActive = async (topic: Topic) => {
    await supabase.from("topics").update({ is_active: !topic.is_active }).eq("id", topic.id);
    fetchTopics();
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Topics</h2>
          <p className="text-muted-foreground">Manage article topics/categories</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add Topic</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTopic ? "Edit Topic" : "Create Topic"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Name</Label>
                <Input value={form.name} onChange={e => { setForm(f => ({ ...f, name: e.target.value, slug: generateSlug(e.target.value) })); }} placeholder="e.g. Kinh tế" />
              </div>
              <div>
                <Label>Slug</Label>
                <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="auto-generated" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
              </div>
              <div>
                <Label>Sort Order</Label>
                <Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                <Label>Active</Label>
              </div>
              <Button onClick={handleSave} className="w-full">{editingTopic ? "Update" : "Create"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topics.map(topic => (
                <TableRow key={topic.id}>
                  <TableCell className="text-muted-foreground">{topic.sort_order}</TableCell>
                  <TableCell className="font-medium">{topic.name}</TableCell>
                  <TableCell className="text-muted-foreground">{topic.slug}</TableCell>
                  <TableCell>
                    <Switch checked={topic.is_active} onCheckedChange={() => handleToggleActive(topic)} />
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(topic)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(topic.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTopics;
