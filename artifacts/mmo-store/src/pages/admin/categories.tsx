import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Link, useLocation } from "wouter";
import { useListCategories, getListCategoriesQueryKey, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Tag, Plus, Edit, Trash2, Loader2, ArrowLeft, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

type CatForm = { name: string; description: string; iconName: string };
const emptyForm: CatForm = { name: "", description: "", iconName: "" };

export default function AdminCategories() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CatForm>(emptyForm);

  const { data: categories, isLoading } = useListCategories({
    query: { enabled: !!user && user.role === "admin", queryKey: getListCategoriesQueryKey() },
  });

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  if (authLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!isAuthenticated || !user || user.role !== "admin") { setLocation("/"); return null; }

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setShowDialog(true); };
  const openEdit = (cat: any) => { setEditingId(cat.id); setForm({ name: cat.name || "", description: cat.description || "", iconName: cat.iconName || "" }); setShowDialog(true); };

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`Xóa danh mục "${name}"? Tất cả sản phẩm trong danh mục này sẽ mất liên kết.`)) return;
    deleteCategory.mutate({ id }, {
      onSuccess: () => { toast({ title: "Đã xóa danh mục" }); invalidate(); },
      onError: (e) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name: form.name.trim(), description: form.description.trim() || undefined, iconName: form.iconName.trim() || undefined };
    if (editingId) {
      updateCategory.mutate({ id: editingId, data: payload }, {
        onSuccess: () => { toast({ title: "Đã cập nhật danh mục" }); invalidate(); setShowDialog(false); },
        onError: (e) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
      });
    } else {
      createCategory.mutate({ data: payload }, {
        onSuccess: () => { toast({ title: "Đã thêm danh mục" }); invalidate(); setShowDialog(false); },
        onError: (e) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
      });
    }
  };

  const isSaving = createCategory.isPending || updateCategory.isPending;

  return (
    <div className="container mx-auto px-4 py-8 max-w-screen-xl">
      <Button variant="ghost" asChild className="mb-4 -ml-4 text-muted-foreground">
        <Link href="/admin"><ArrowLeft className="mr-2 h-4 w-4" />Dashboard</Link>
      </Button>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold flex items-center gap-2"><Tag className="h-8 w-8 text-primary" />Quản lý Danh mục</h1>
        <Button className="box-glow" onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Thêm danh mục</Button>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardContent className="pt-6">
          {isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : (
            <div className="rounded-md border border-border/50 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[60px]">ID</TableHead>
                    <TableHead>Tên danh mục</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead>Icon</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(categories || []).map((cat) => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-mono text-muted-foreground">#{cat.id}</TableCell>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">{cat.slug}</TableCell>
                      <TableCell className="text-muted-foreground text-sm line-clamp-1">{cat.description || "—"}</TableCell>
                      <TableCell className="text-sm">{cat.iconName || "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="text-blue-400" onClick={() => openEdit(cat)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(cat.id, cat.name)} disabled={deleteCategory.isPending}>
                            {deleteCategory.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!categories || categories.length === 0) && (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Chưa có danh mục nào</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingId ? <Edit className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
              {editingId ? "Sửa danh mục" : "Thêm danh mục mới"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Tên danh mục *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ví dụ: Web MMO" required className="bg-background/50" />
            </div>
            <div className="space-y-1">
              <Label>Mô tả</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Mô tả ngắn về danh mục" className="bg-background/50" />
            </div>
            <div className="space-y-1">
              <Label>Icon (Lucide icon name)</Label>
              <Input value={form.iconName} onChange={(e) => setForm({ ...form, iconName: e.target.value })} placeholder="ví dụ: Globe, Code, Bot..." className="bg-background/50" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}><X className="mr-2 h-4 w-4" />Hủy</Button>
              <Button type="submit" className="box-glow" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                {editingId ? "Lưu thay đổi" : "Thêm danh mục"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
