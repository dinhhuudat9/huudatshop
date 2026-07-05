import { useAuth } from "@/lib/auth";
import { Link, useLocation } from "wouter";
import { useListOrders, getListOrdersQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatVND, formatDate } from "@/lib/format";
import { Wallet, Settings, LogOut, ShoppingBag, Download, Loader2 } from "lucide-react";

export default function Orders() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();

  const { data: orders, isLoading } = useListOrders({
    query: {
      enabled: !!user,
      queryKey: getListOrdersQueryKey()
    }
  });

  if (authLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!isAuthenticated || !user) {
    setLocation("/dang-nhap");
    return null;
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30 border-none">Thành công</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30 border-none">Chờ xử lý</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500/20 text-red-500 hover:bg-red-500/30 border-none">Đã hủy</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-screen-xl">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-none space-y-6">
          <Card className="bg-card/40 backdrop-blur border-border/50">
            <div className="p-2">
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/tai-khoan">
                  <Settings className="mr-2 h-4 w-4" />
                  Tổng quan
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/tai-khoan/nap-tien">
                  <Wallet className="mr-2 h-4 w-4" />
                  Nạp tiền
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-primary bg-primary/10" asChild>
                <Link href="/tai-khoan/don-hang">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Lịch sử mua hàng
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/tai-khoan/tai-xuong">
                  <Download className="mr-2 h-4 w-4" />
                  Quản lý tải xuống
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Đăng xuất
              </Button>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <Card className="bg-card/40 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                Lịch sử mua hàng
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : orders && orders.length > 0 ? (
                <div className="rounded-md border border-border/50 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Mã đơn</TableHead>
                        <TableHead>Sản phẩm</TableHead>
                        <TableHead>Ngày mua</TableHead>
                        <TableHead>Số tiền</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-muted-foreground">#{order.id}</TableCell>
                          <TableCell>
                            <div className="font-medium line-clamp-1">{order.productName}</div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">{formatDate(order.createdAt)}</TableCell>
                          <TableCell className="font-mono text-primary font-bold">{formatVND(order.amount)}</TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/san-pham/${order.productId}`}>Xem SP</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-16 bg-muted/10 rounded-lg border border-dashed border-border/50">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
                  <h3 className="text-lg font-medium mb-2">Chưa có đơn hàng nào</h3>
                  <p className="text-muted-foreground mb-6">Bạn chưa thực hiện bất kỳ giao dịch mua nào.</p>
                  <Button asChild className="box-glow">
                    <Link href="/san-pham">Khám phá sản phẩm</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
