import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Link, useLocation } from "wouter";
import { 
  useListProducts, getListProductsQueryKey, 
  useDeleteProduct,
  useListCategories, getListCategoriesQueryKey 
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatVND, formatDate } from "@/lib/format";
import { LayoutDashboard, Package, Plus, Search, Edit, Trash2, Eye, Loader2, ArrowLeft } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminProducts() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useListProducts({ limit: 100 }, {
    query: {
      enabled: !!user && user.role === 'admin',
      queryKey: getListProductsQueryKey({ limit: 100 })
    }
  });

  const deleteProduct = useDeleteProduct();

  if (authLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!isAuthenticated || !user || user.role !== 'admin') {
    setLocation("/");
    return null;
  }

  const handleDelete = (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) return;
    
    deleteProduct.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Đã xóa sản phẩm" });
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey({ limit: 100 }) });
      },
      onError: (err) => {
        toast({ variant: "destructive", title: "Lỗi", description: err.message });
      }
    });
  };

  const filteredProducts = data?.products?.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-screen-2xl">
      <Button variant="ghost" asChild className="mb-4 -ml-4 text-muted-foreground">
        <Link href="/admin">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Dashboard
        </Link>
      </Button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8 text-primary" />
            Quản lý Sản phẩm
          </h1>
        </div>
        <Button className="box-glow">
          <Plus className="mr-2 h-4 w-4" /> Thêm sản phẩm mới
        </Button>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-6">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Tìm kiếm sản phẩm..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
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
                    <TableHead className="w-[80px]">ID</TableHead>
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
                      <TableCell><Badge variant="outline">{product.categoryName}</Badge></TableCell>
                      <TableCell className="font-mono text-primary font-bold">{formatVND(product.price)}</TableCell>
                      <TableCell>{product.soldCount}</TableCell>
                      <TableCell>
                        <Badge className={product.status === 'active' ? "bg-green-500/20 text-green-500 border-none" : "bg-muted text-muted-foreground border-none"}>
                          {product.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/san-pham/${product.id}`}><Eye className="h-4 w-4" /></Link>
                          </Button>
                          <Button variant="ghost" size="icon" className="text-blue-400">
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
    </div>
  );
}
