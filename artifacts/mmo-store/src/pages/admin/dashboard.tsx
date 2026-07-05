import { useAuth } from "@/lib/auth";
import { Link, useLocation } from "wouter";
import { useGetStoreStats, getGetStoreStatsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatVND } from "@/lib/format";
import { LayoutDashboard, Package, FileText, Users, ShoppingCart, Loader2, ArrowUpRight, Tag, Wallet } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: stats, isLoading } = useGetStoreStats({
    query: {
      enabled: !!user && user.role === 'admin',
      queryKey: getGetStoreStatsQueryKey()
    }
  });

  if (authLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!isAuthenticated || !user || user.role !== 'admin') {
    setLocation("/");
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-screen-2xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-primary">
            <LayoutDashboard className="h-8 w-8" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">Quản lý toàn bộ hệ thống MMO Store</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/san-pham"><Package className="mr-1.5 h-3.5 w-3.5" />Sản phẩm</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/bai-viet"><FileText className="mr-1.5 h-3.5 w-3.5" />Bài viết</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/danh-muc"><Tag className="mr-1.5 h-3.5 w-3.5" />Danh mục</Link>
          </Button>
          <Button asChild className="box-glow" size="sm">
            <Link href="/admin/nap-tien"><Wallet className="mr-1.5 h-3.5 w-3.5" />Duyệt Nạp tiền</Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : stats ? (
        <div className="space-y-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Tổng doanh thu</CardTitle>
                <WalletIcon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono text-primary text-glow">{formatVND(stats.totalRevenue)}</div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Sản phẩm</CardTitle>
                <Package className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">{stats.totalProducts}</div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Đơn hàng</CardTitle>
                <ShoppingCart className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">{stats.totalOrders}</div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Người dùng</CardTitle>
                <Users className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">{stats.totalUsers}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Chart */}
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle>Sản phẩm theo danh mục</CardTitle>
                <CardDescription>Số lượng mã nguồn được phân bổ trong các danh mục</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.categoryCounts || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                      <XAxis dataKey="categoryName" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        cursor={{fill: '#222'}} 
                        contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '8px' }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Recent Orders */}
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle>Đơn hàng gần đây</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.recentOrders?.map(order => (
                    <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/40">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center text-primary font-bold font-mono text-xs">
                          #{order.id}
                        </div>
                        <div>
                          <p className="font-medium text-sm line-clamp-1">{order.productName}</p>
                          <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
                        </div>
                      </div>
                      <div className="font-mono font-bold text-primary text-sm">{formatVND(order.amount)}</div>
                    </div>
                  ))}
                  {(!stats.recentOrders || stats.recentOrders.length === 0) && (
                    <div className="text-center py-6 text-muted-foreground text-sm">Không có đơn hàng nào</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      ) : (
        <div className="text-center py-20">Không thể tải dữ liệu</div>
      )}
    </div>
  );
}

// Separate component to avoid Lucide conflict
function WalletIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a8 8 0 0 1-8 8H5a2 2 0 0 1-2-2V4"/><path d="M22 12v4"/><path d="M22 14h-3"/></svg>
}
