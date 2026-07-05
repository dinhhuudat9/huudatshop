import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPassword() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsSent(true);
      } else {
        toast({ variant: "destructive", title: "Lỗi", description: data.error || "Đã xảy ra lỗi" });
      }
    } catch {
      toast({ variant: "destructive", title: "Lỗi kết nối", description: "Không thể kết nối đến server" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-primary text-glow">MMO Store</h1>
        <p className="text-muted-foreground mt-1">Chợ mã nguồn #1 Việt Nam</p>
      </div>

      <Card className="bg-card/40 border-border/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Quên mật khẩu
          </CardTitle>
          <CardDescription>
            Nhập email tài khoản của bạn. Chúng tôi sẽ gửi link đặt lại mật khẩu.
          </CardDescription>
        </CardHeader>

        {isSent ? (
          <CardContent className="py-8 text-center space-y-4">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold">Đã gửi email!</h3>
            <p className="text-muted-foreground text-sm">
              Nếu email <span className="text-foreground font-medium">{email}</span> tồn tại trong hệ thống,
              bạn sẽ nhận được link đặt lại mật khẩu trong vài phút.
            </p>
            <p className="text-muted-foreground text-xs">Kiểm tra cả thư mục Spam/Junk nếu không thấy.</p>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-background/50"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full box-glow" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                Gửi link đặt lại mật khẩu
              </Button>
            </CardFooter>
          </form>
        )}

        <div className="px-6 pb-6 text-center">
          <Link href="/dang-nhap">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại đăng nhập
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
