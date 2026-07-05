import { useAuth } from "@/lib/auth";
import { Link, useLocation } from "wouter";
import { useGetUserDownloads, getGetUserDownloadsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { Wallet, Settings, LogOut, ShoppingBag, Download, Loader2, CloudDownload, Terminal } from "lucide-react";

export default function Downloads() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();

  const { data: downloads, isLoading } = useGetUserDownloads({
    query: {
      enabled: !!user,
      queryKey: getGetUserDownloadsQueryKey()
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
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/tai-khoan/don-hang">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Lịch sử mua hàng
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-primary bg-primary/10" asChild>
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
                <Download className="h-5 w-5 text-primary" />
                Sản phẩm đã tải xuống
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-32 rounded-lg bg-muted/50 animate-pulse border border-border/50" />
                  ))}
                </div>
              ) : downloads && downloads.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {downloads.map((item) => (
                    <div key={`${item.orderId}-${item.productId}`} className="flex gap-4 p-4 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 transition-colors">
                      <div className="w-20 h-20 rounded-md overflow-hidden bg-background flex-none border border-border/50 flex items-center justify-center">
                        {item.productThumbnail ? (
                          <img src={item.productThumbnail} alt={item.productName} className="w-full h-full object-cover" />
                        ) : (
                          <Terminal className="h-8 w-8 text-muted-foreground opacity-50" />
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-sm line-clamp-2 leading-snug hover:text-primary transition-colors cursor-pointer" onClick={() => setLocation(`/san-pham/${item.productId}`)}>
                            {item.productName}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">Mua ngày: {formatDate(item.purchasedAt)}</p>
                        </div>
                        <Button size="sm" className="w-full sm:w-auto self-start mt-2 bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30" asChild>
                          <a href={item.downloadUrl} target="_blank" rel="noopener noreferrer">
                            <CloudDownload className="mr-2 h-4 w-4" />
                            Tải file (.zip)
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-muted/10 rounded-lg border border-dashed border-border/50">
                  <Download className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
                  <h3 className="text-lg font-medium mb-2">Kho lưu trữ trống</h3>
                  <p className="text-muted-foreground mb-6">Bạn chưa sở hữu mã nguồn nào. Hãy mua sản phẩm để tải xuống.</p>
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
