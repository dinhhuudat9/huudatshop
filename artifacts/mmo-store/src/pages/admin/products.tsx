import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Link, useLocation } from "wouter";
import {
  useListProducts, getListProductsQueryKey,
  useDeleteProduct, useCreateProduct, useUpdateProduct,
  useListCategories, getListCategoriesQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatVND, formatDate } from "@/lib/format";
import { LayoutDashboard, Package, Plus, Search, Edit, Trash2, Eye, Loader2, ArrowLeft, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

type ProductFormData = {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: string;
  originalPrice: string;
  categoryId: string;
  status: "active" | "inactive" | "draft";
  featured: boolean;
  thumbnailUrl: string;
  downloadUrl: string;
  demoUrl: string;
  tags: string;
  techStack: string;
};

const emptyForm: ProductFormData = {
  name: "", slug: "", description: "", shortDescription: "",
  price: "", originalPrice: "", categoryId: "", status: "active",
  featured: false, thumbnailUrl: "", downloadUrl: "", demoUrl: "",
  tags: "", techStack: "",
};

function slugify(text: string) {
  return text.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

export default function AdminProducts() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductFormData>(emptyForm);

  const { data, isLoading } = useListProducts({ limit: 100 }, {
    query: {
      enabled: !!user && user.role === "admin",
      queryKey: getListProductsQueryKey({ limit: 100 }),
    },
  });

  const { data: categoriesData } = useListCategories({
    query: { enabled: !!user && user.role === "admin", queryKey: getListCategoriesQueryKey() },
  });

  const deleteProduct = useDeleteProduct();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  if (authLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!isAuthenticated || !user || user.role !== "admin") { setLocation("/"); return null; }

  const invalidateProducts = () => queryClient.invalidateQueries({ queryKey: getListProductsQueryKey({ limit: 100 }) });

  const handleDelete = (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) return;
    deleteProduct.mutate({ id }, {
      onSuccess: () => { toast({ title: "Đã xóa sản phẩm" }); invalidateProducts(); },
      onError: (err) => toast({ variant: "destructive", title: "Lỗi xóa", description: err.message }),
    });
  };

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setShowDialog(true); };

  const openEdit = (product: any) => {
    setEditingId(product.id);
    setForm({
      name: product.name || "",
      slug: product.slug || "",
      description: product.description || "",
      shortDescription: product.shortDescription || "",
      price: String(product.price || ""),
      originalPrice: String(product.originalPrice || ""),
      categoryId: String(product.categoryId || ""),
      status: product.status || "active",
      featured: product.featured || false,
      thumbnailUrl: product.thumbnailUrl || "",
      downloadUrl: product.downloadUrl || "",
      demoUrl: product.demoUrl || "",
      tags: (product.tags || []).join(", "),
      techStack: (product.techStack || []).join(", "),
    });
    setShowDialog(true);
  };

  const handleFormChange = (field: keyof ProductFormData, value: any) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "name" && !editingId) updated.slug = slugify(value);
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      description: form.description.trim(),
      shortDescription: form.shortDescription.trim(),
      price: parseFloat(form.price) || 0,
      originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : undefined,
      categoryId: form.categoryId ? parseInt(form.categoryId) : undefined,
      status: form.status,
      featured: form.featured,
      thumbnailUrl: form.thumbnailUrl.trim() || undefined,
      downloadUrl: form.downloadUrl.trim() || undefined,
      demoUrl: form.demoUrl.trim() || undefined,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      techStack: form.techStack ? form.techStack.split(",").map((t) => t.trim()).filter(Boolean) : [],
    };

    if (editingId) {
      updateProduct.mutate({ id: editingId, data: payload }, {
        onSuccess: () => { toast({ title: "Đã cập nhật sản phẩm" }); invalidateProducts(); setShowDialog(false); },
        onError: (err) => toast({ variant: "destructive", title: "Lỗi cập nhật", description: err.message }),
      });
    } else {
      createProduct.mutate({ data: payload }, {
        onSuccess: () => { toast({ title: "Đã thêm sản phẩm mới" }); invalidateProducts(); setShowDialog(false); },
        onError: (err) => toast({ variant: "destructive", title: "Lỗi thêm sản phẩm", description: err.message }),
      });
    }
  };

  const filteredProducts = (data?.products || []).filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const isSaving = createProduct.isPending || updateProduct.isPending;

  return (
    <div className="container mx-auto px-4 py-8 max-w-screen-2xl">
      <Button variant="ghost" asChild className="mb-4 -ml-4 text-muted-foreground">
        <Link href="/admin"><ArrowLeft className="mr-2 h-4 w-4" />Dashboard</Link>
      </Button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Package className="h-8 w-8 text-primary" />Quản lý Sản phẩm
        </h1>
        <Button className="box-glow" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />Thêm sản phẩm mới
        </Button>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-6">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Tìm kiếm sản phẩm..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="rounded-md border border-border/50 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[60px]">ID</TableHead>
                    <TableHead>Tên sản phẩm</TableHead>
                    <TableHead>Danh mục</TableHead>
                    <TableHead>Giá bán</TableHead>
                    <TableHead>Lượt mua</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-mono text-muted-foreground">#{product.id}</TableCell>
                      <TableCell>
                        <div className="font-medium line-clamp-1">{product.name}</div>
                        {product.featured && <Badge variant="secondary" className="text-[10px] mt-1 bg-primary/20 text-primary border-none">Nổi bật</Badge>}
                      </TableCell>
                      <TableCell><Badge variant="outline">{product.categoryName || "—"}</Badge></TableCell>
                      <TableCell className="font-mono text-primary font-bold">{formatVND(product.price)}</TableCell>
                      <TableCell>{product.soldCount}</TableCell>
                      <TableCell>
                        <Badge className={product.status === "active" ? "bg-green-500/20 text-green-500 border-none" : "bg-muted text-muted-foreground border-none"}>
                          {product.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/san-pham/${product.id}`}><Eye className="h-4 w-4" /></Link>
                          </Button>
                          <Button variant="ghost" size="icon" className="text-blue-400" onClick={() => openEdit(product)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(product.id)} disabled={deleteProduct.isPending}>
                            {deleteProduct.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredProducts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Không tìm thấy sản phẩm nào
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingId ? <Edit className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
              {editingId ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 sm:col-span-2">
                <Label>Tên sản phẩm *</Label>
                <Input value={form.name} onChange={(e) => handleFormChange("name", e.target.value)} placeholder="Ví dụ: Web MMO Auto Farm" required className="bg-background/50" />
              </div>

              <div className="space-y-1">
                <Label>Slug URL</Label>
                <Input value={form.slug} onChange={(e) => handleFormChange("slug", e.target.value)} placeholder="web-mmo-auto-farm" className="bg-background/50 font-mono text-sm" />
              </div>

              <div className="space-y-1">
                <Label>Danh mục</Label>
                <Select value={form.categoryId} onValueChange={(v) => handleFormChange("categoryId", v)}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {(categoriesData || []).map((cat: any) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Giá bán (VNĐ) *</Label>
                <Input type="number" value={form.price} onChange={(e) => handleFormChange("price", e.target.value)} placeholder="150000" required min={0} className="bg-background/50 font-mono" />
              </div>

              <div className="space-y-1">
                <Label>Giá gốc (VNĐ)</Label>
                <Input type="number" value={form.originalPrice} onChange={(e) => handleFormChange("originalPrice", e.target.value)} placeholder="200000" min={0} className="bg-background/50 font-mono" />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label>Mô tả ngắn</Label>
                <Input value={form.shortDescription} onChange={(e) => handleFormChange("shortDescription", e.target.value)} placeholder="Mô tả ngắn hiển thị trên thẻ sản phẩm" className="bg-background/50" />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label>Mô tả chi tiết</Label>
                <Textarea value={form.description} onChange={(e) => handleFormChange("description", e.target.value)} placeholder="Mô tả đầy đủ về sản phẩm, tính năng, hướng dẫn sử dụng..." className="bg-background/50 min-h-[100px]" />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label>URL Thumbnail</Label>
                <Input value={form.thumbnailUrl} onChange={(e) => handleFormChange("thumbnailUrl", e.target.value)} placeholder="https://example.com/image.jpg" className="bg-background/50" />
              </div>

              <div className="space-y-1">
                <Label>Link Download</Label>
                <Input value={form.downloadUrl} onChange={(e) => handleFormChange("downloadUrl", e.target.value)} placeholder="https://drive.google.com/..." className="bg-background/50" />
              </div>

              <div className="space-y-1">
                <Label>Link Demo</Label>
                <Input value={form.demoUrl} onChange={(e) => handleFormChange("demoUrl", e.target.value)} placeholder="https://demo.example.com" className="bg-background/50" />
              </div>

              <div className="space-y-1">
                <Label>Tags (cách nhau bởi dấu phẩy)</Label>
                <Input value={form.tags} onChange={(e) => handleFormChange("tags", e.target.value)} placeholder="react, nodejs, mongodb" className="bg-background/50" />
              </div>

              <div className="space-y-1">
                <Label>Tech Stack (cách nhau bởi dấu phẩy)</Label>
                <Input value={form.techStack} onChange={(e) => handleFormChange("techStack", e.target.value)} placeholder="React, Express, PostgreSQL" className="bg-background/50" />
              </div>

              <div className="space-y-1">
                <Label>Trạng thái</Label>
                <Select value={form.status} onValueChange={(v: any) => handleFormChange("status", v)}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active (Hiển thị)</SelectItem>
                    <SelectItem value="inactive">Inactive (Ẩn)</SelectItem>
                    <SelectItem value="draft">Draft (Nháp)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Switch id="featured" checked={form.featured} onCheckedChange={(v) => handleFormChange("featured", v)} />
                <Label htmlFor="featured">Sản phẩm nổi bật</Label>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                <X className="mr-2 h-4 w-4" />Hủy
              </Button>
              <Button type="submit" className="box-glow" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : editingId ? <Edit className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                {editingId ? "Lưu thay đổi" : "Thêm sản phẩm"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
