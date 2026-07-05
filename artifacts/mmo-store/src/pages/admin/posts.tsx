import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Link, useLocation } from "wouter";
import { useListPosts, getListPostsQueryKey, useCreatePost, useUpdatePost, useDeletePost } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/format";
import { FileText, Plus, Search, Edit, Trash2, Eye, Loader2, ArrowLeft, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

type PostForm = { title: string; excerpt: string; content: string; thumbnailUrl: string; tags: string };
const emptyForm: PostForm = { title: "", excerpt: "", content: "", thumbnailUrl: "", tags: "" };

export default function AdminPosts() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<PostForm>(emptyForm);

  const { data, isLoading } = useListPosts({ limit: 100 }, {
    query: { enabled: !!user && user.role === "admin", queryKey: getListPostsQueryKey({ limit: 100 }) },
  });

  const createPost = useCreatePost();
  const updatePost = useUpdatePost();
  const deletePost = useDeletePost();

  if (authLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!isAuthenticated || !user || user.role !== "admin") { setLocation("/"); return null; }

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListPostsQueryKey({ limit: 100 }) });

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setShowDialog(true); };
  const openEdit = (post: any) => {
    setEditingId(post.id);
    setForm({ title: post.title || "", excerpt: post.excerpt || "", content: post.content || "", thumbnailUrl: post.thumbnailUrl || "", tags: (post.tags || []).join(", ") });
    setShowDialog(true);
  };

  const handleDelete = (id: number) => {
    if (!confirm("Xóa bài viết này?")) return;
    deletePost.mutate({ id }, {
      onSuccess: () => { toast({ title: "Đã xóa bài viết" }); invalidate(); },
      onError: (e) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: form.title.trim(),
      excerpt: form.excerpt.trim() || undefined,
      content: form.content.trim(),
      thumbnailUrl: form.thumbnailUrl.trim() || undefined,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    };
    if (editingId) {
      updatePost.mutate({ id: editingId, data: payload }, {
        onSuccess: () => { toast({ title: "Đã cập nhật bài viết" }); invalidate(); setShowDialog(false); },
        onError: (e) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
      });
    } else {
      createPost.mutate({ data: payload }, {
        onSuccess: () => { toast({ title: "Đã đăng bài viết mới" }); invalidate(); setShowDialog(false); },
        onError: (e) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
      });
    }
  };

  const filtered = (data?.posts || []).filter((p) => p.title.toLowerCase().includes(search.toLowerCase()));
  const isSaving = createPost.isPending || updatePost.isPending;

  return (
    <div className="container mx-auto px-4 py-8 max-w-screen-2xl">
      <Button variant="ghost" asChild className="mb-4 -ml-4 text-muted-foreground">
        <Link href="/admin"><ArrowLeft className="mr-2 h-4 w-4" />Dashboard</Link>
      </Button>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold flex items-center gap-2"><FileText className="h-8 w-8 text-primary" />Quản lý Bài viết</h1>
        <Button className="box-glow" onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Thêm bài viết</Button>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Tìm kiếm bài viết..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : (
            <div className="rounded-md border border-border/50 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[60px]">ID</TableHead>
                    <TableHead>Tiêu đề</TableHead>
                    <TableHead>Tác giả</TableHead>
                    <TableHead>Lượt xem</TableHead>
                    <TableHead>Ngày đăng</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-mono text-muted-foreground">#{post.id}</TableCell>
                      <TableCell><div className="font-medium line-clamp-1">{post.title}</div></TableCell>
                      <TableCell>{post.authorName || "Admin"}</TableCell>
                      <TableCell>{post.viewCount || 0}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(post.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild><Link href={`/tin-tuc/${post.id}`}><Eye className="h-4 w-4" /></Link></Button>
                          <Button variant="ghost" size="icon" className="text-blue-400" onClick={() => openEdit(post)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(post.id)} disabled={deletePost.isPending}>
                            {deletePost.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Không tìm thấy bài viết nào</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingId ? <Edit className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
              {editingId ? "Sửa bài viết" : "Thêm bài viết mới"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Tiêu đề *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Tiêu đề bài viết" required className="bg-background/50" />
            </div>
            <div className="space-y-1">
              <Label>Mô tả ngắn (excerpt)</Label>
              <Input value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} placeholder="Tóm tắt ngắn về bài viết" className="bg-background/50" />
            </div>
            <div className="space-y-1">
              <Label>Nội dung *</Label>
              <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Nội dung chi tiết bài viết (hỗ trợ HTML)" required className="bg-background/50 min-h-[200px] font-mono text-sm" />
            </div>
            <div className="space-y-1">
              <Label>URL ảnh bìa</Label>
              <Input value={form.thumbnailUrl} onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })} placeholder="https://example.com/image.jpg" className="bg-background/50" />
            </div>
            <div className="space-y-1">
              <Label>Tags (cách nhau bởi dấu phẩy)</Label>
              <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="mmo, tool, hướng dẫn" className="bg-background/50" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}><X className="mr-2 h-4 w-4" />Hủy</Button>
              <Button type="submit" className="box-glow" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : editingId ? <Edit className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                {editingId ? "Lưu thay đổi" : "Đăng bài"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
