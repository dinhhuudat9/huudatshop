import { useAuth } from "@/lib/auth";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGetUserStats, getGetUserStatsQueryKey } from "@workspace/api-client-react";
import { formatVND } from "@/lib/format";
import { Wallet, ShoppingBag, Download, Settings, LogOut, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Account() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();

  const { data: stats, isLoading: statsLoading } = useGetUserStats({
    query: {
      enabled: !!user,
      queryKey: getGetUserStatsQueryKey()
    }
  });

  if (authLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!isAuthenticated || !user) {
    setLocation("/dang-nhap");
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-screen-xl">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-none space-y-6">
          <Card className="bg-card/40 backdrop-blur border-border/50 overflow-hidden">
            <div className="bg-muted p-6 flex flex-col items-center justify-center text-center border-b border-border/50">
              <Avatar className="h-20 w-20 border-2 border-background shadow-lg mb-3">
                <AvatarImage src={user.avatarUrl || undefined} />
                <AvatarFallback className="text-2xl bg-primary/20 text-primary">
                  {user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-bold text-lg">{user.username}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              
              <div className="mt-4 px-4 py-2 bg-background rounded-full border border-border/50 flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary" />
                <span className="font-bold font-mono text-primary text-glow">{formatVND(user.balance || 0)}</span>
              </div>
            </div>
            
            <div className="p-2">
              <Button variant="ghost" className="w-full justify-start text-primary bg-primary/10" asChild>
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
              <Button variant="ghost" className="w-full justify-start" asChild>
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
        <div className="flex-1 space-y-6">
          <h1 className="text-2xl font-bold">Tổng quan tài khoản</h1>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="bg-card/40 border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Tổng sản phẩm đã mua
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.purchaseCount || 0}</div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/40 border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                  <Wallet className="mr-2 h-4 w-4" />
                  Tổng tiền đã chi tiêu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono text-primary text-glow">
                  {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : formatVND(stats?.totalSpent || 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card/40 border-border/50 mt-8">
            <CardHeader>
              <CardTitle>Nạp tiền vào tài khoản</CardTitle>
              <CardDescription>
                Số dư dùng để mua mã nguồn và các sản phẩm số trên MMO Store mà không cần thanh toán lại mỗi lần.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 items-center p-4 bg-muted/30 rounded-lg border border-border/50">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Số dư hiện tại:</p>
                  <p className="text-2xl font-bold font-mono text-primary text-glow">{formatVND(user.balance || 0)}</p>
                </div>
                <Button size="lg" className="w-full sm:w-auto box-glow" asChild>
                  <Link href="/tai-khoan/nap-tien">Nạp thêm tiền</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
