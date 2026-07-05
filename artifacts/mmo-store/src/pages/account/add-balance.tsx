import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Link, useLocation } from "wouter";
import { useCreateBalanceRequest } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Wallet, Settings, LogOut, ShoppingBag, Download, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { formatVND } from "@/lib/format";

const AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 2000000];

export default function AddBalance() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [amount, setAmount] = useState<number>(100000);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [method, setMethod] = useState<"bank_transfer" | "momo" | "vnpay" | "zalopay">("bank_transfer");
  const [note, setNote] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState(false);

  const createRequest = useCreateBalanceRequest();

  if (authLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!isAuthenticated || !user) {
    setLocation("/dang-nhap");
    return null;
  }

  const handleAmountSelect = (val: number) => { setAmount(val); setCustomAmount(""); };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    setCustomAmount(val);
    if (val) setAmount(parseInt(val, 10));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount < 50000) {
      toast({ variant: "destructive", title: "Số tiền không hợp lệ", description: "Số tiền nạp tối thiểu là 50.000đ" });
      return;
    }
    createRequest.mutate({ data: { amount, method, note: note || undefined } }, {
      onSuccess: () => {
        setIsSuccess(true);
        toast({ title: "Yêu cầu nạp tiền đã được gửi", description: `Admin sẽ xem xét và duyệt yêu cầu nạp ${formatVND(amount)} của bạn.` });
      },
      onError: (err) => {
        toast({ variant: "destructive", title: "Lỗi", description: (err as any).message || "Đã xảy ra lỗi." });
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-screen-xl">
      <div className="flex flex-col md:flex-row gap-8">

        {/* Sidebar */}
        <div className="w-full md:w-64 flex-none space-y-6">
          <Card className="bg-card/40 backdrop-blur border-border/50">
            <div className="p-2">
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/tai-khoan"><Settings className="mr-2 h-4 w-4" />Tổng quan</Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-primary bg-primary/10" asChild>
                <Link href="/tai-khoan/nap-tien"><Wallet className="mr-2 h-4 w-4" />Nạp tiền</Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/tai-khoan/don-hang"><ShoppingBag className="mr-2 h-4 w-4" />Lịch sử mua hàng</Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/tai-khoan/tai-xuong"><Download className="mr-2 h-4 w-4" />Quản lý tải xuống</Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />Đăng xuất
              </Button>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {isSuccess ? (
            <Card className="bg-card/40 border-border/50 border-green-500/30 text-center py-12">
              <CardContent className="flex flex-col items-center justify-center space-y-4">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-10 w-10 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-green-500">Yêu cầu đã được gửi!</h2>
                <p className="text-muted-foreground max-w-md">
                  Yêu cầu nạp <span className="font-bold text-foreground">{formatVND(amount)}</span> đã được gửi tới admin.
                  Vui lòng chờ admin duyệt, số tiền sẽ được cộng ngay sau khi được xác nhận.
                </p>
                <div className="mt-8 flex gap-4">
                  <Button variant="outline" onClick={() => setIsSuccess(false)}>Gửi yêu cầu khác</Button>
                  <Button asChild className="box-glow">
                    <Link href="/san-pham">Xem sản phẩm</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card/40 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  Nạp tiền vào tài khoản
                </CardTitle>
                <CardDescription>
                  Gửi yêu cầu nạp tiền — admin sẽ xác nhận và cộng số dư cho bạn
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-8">

                  {/* Amount Selection */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">1. Chọn số tiền nạp</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {AMOUNTS.map((amt) => (
                        <div
                          key={amt}
                          onClick={() => handleAmountSelect(amt)}
                          className={`cursor-pointer rounded-lg border p-4 text-center transition-all ${
                            amount === amt && !customAmount
                              ? "border-primary bg-primary/10 text-primary shadow-[0_0_15px_rgba(91,77,242,0.2)]"
                              : "border-border/50 bg-background hover:border-primary/50"
                          }`}
                        >
                          <span className="font-mono font-bold text-lg">{formatVND(amt).replace("₫", "")}</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2">
                      <Label htmlFor="customAmount" className="text-muted-foreground mb-2 block">Hoặc nhập số tiền khác (Tối thiểu 50.000đ)</Label>
                      <div className="relative">
                        <Input
                          id="customAmount"
                          type="text"
                          placeholder="Ví dụ: 150000"
                          value={customAmount}
                          onChange={handleCustomAmountChange}
                          className={`bg-background/50 h-12 font-mono text-lg ${customAmount ? "border-primary" : ""}`}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">VNĐ</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">2. Phương thức thanh toán</Label>
                    <RadioGroup value={method} onValueChange={(v: any) => setMethod(v)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <RadioGroupItem value="bank_transfer" id="method-bank" className="peer sr-only" />
                        <Label htmlFor="method-bank" className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                          <div className="h-10 w-10 bg-primary/20 rounded-full flex items-center justify-center mb-3">
                            <Wallet className="h-5 w-5 text-primary" />
                          </div>
                          <span className="font-semibold">Chuyển khoản Ngân hàng</span>
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem value="momo" id="method-momo" className="peer sr-only" />
                        <Label htmlFor="method-momo" className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-[#A50064] [&:has([data-state=checked])]:border-[#A50064] cursor-pointer">
                          <div className="h-10 w-10 bg-[#A50064]/20 rounded-full flex items-center justify-center mb-3">
                            <span className="font-bold text-[#A50064] text-xs">MoMo</span>
                          </div>
                          <span className="font-semibold">Ví điện tử MoMo</span>
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem value="vnpay" id="method-vnpay" className="peer sr-only" />
                        <Label htmlFor="method-vnpay" className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-[#0062cc] [&:has([data-state=checked])]:border-[#0062cc] cursor-pointer">
                          <div className="h-10 w-10 bg-[#0062cc]/20 rounded-full flex items-center justify-center mb-3">
                            <span className="font-bold text-[#0062cc] text-xs">VNPay</span>
                          </div>
                          <span className="font-semibold">VNPay</span>
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem value="zalopay" id="method-zalopay" className="peer sr-only" />
                        <Label htmlFor="method-zalopay" className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-[#0068ff] [&:has([data-state=checked])]:border-[#0068ff] cursor-pointer">
                          <div className="h-10 w-10 bg-[#0068ff]/20 rounded-full flex items-center justify-center mb-3">
                            <span className="font-bold text-[#0068ff] text-xs">Zalo</span>
                          </div>
                          <span className="font-semibold">ZaloPay</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Note */}
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">3. Ghi chú giao dịch (tùy chọn)</Label>
                    <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ví dụ: Đã chuyển khoản lúc 10:30 ngày 05/07" className="bg-background/50" />
                  </div>

                  {/* Summary */}
                  <div className="bg-muted/30 rounded-lg p-6 border border-border/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Số tiền yêu cầu nạp</p>
                      <p className="text-3xl font-bold font-mono text-primary text-glow">{formatVND(amount || 0)}</p>
                    </div>
                    <Button type="submit" size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-bold box-glow" disabled={createRequest.isPending}>
                      {createRequest.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ArrowRight className="mr-2 h-5 w-5" />}
                      Gửi yêu cầu nạp tiền
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
