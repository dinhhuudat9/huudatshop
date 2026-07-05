import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Link, useLocation } from "wouter";
import { useListBalanceRequests, getListBalanceRequestsQueryKey, useApproveBalanceRequest, useRejectBalanceRequest } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { formatVND, formatDate } from "@/lib/format";
import { Wallet, ArrowLeft, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const METHOD_LABELS: Record<string, string> = {
  bank_transfer: "Chuyển khoản",
  momo: "MoMo",
  vnpay: "VNPay",
  zalopay: "ZaloPay",
};

const STATUS_CONFIG = {
  pending:  { label: "Chờ duyệt",  className: "bg-yellow-500/20 text-yellow-400 border-none", icon: Clock },
  approved: { label: "Đã duyệt",   className: "bg-green-500/20 text-green-400 border-none",  icon: CheckCircle2 },
  rejected: { label: "Từ chối",    className: "bg-red-500/20 text-red-400 border-none",       icon: XCircle },
};

export default function AdminBalanceRequests() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [actionId, setActionId] = useState<number | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [adminNote, setAdminNote] = useState("");

  const queryKey = getListBalanceRequestsQueryKey({ status: statusFilter as any, limit: 100 });
  const { data, isLoading, refetch } = useListBalanceRequests(
    { status: statusFilter as any, limit: 100 },
    { query: { enabled: !!user && user.role === "admin", queryKey } }
  );

  const approveReq = useApproveBalanceRequest();
  const rejectReq = useRejectBalanceRequest();

  if (authLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!isAuthenticated || !user || user.role !== "admin") { setLocation("/"); return null; }

  const invalidate = () => {
    ["pending", "approved", "rejected"].forEach(s =>
      queryClient.invalidateQueries({ queryKey: getListBalanceRequestsQueryKey({ status: s as any, limit: 100 }) })
    );
  };

  const openAction = (id: number, type: "approve" | "reject") => {
    setActionId(id); setActionType(type); setAdminNote("");
  };

  const handleConfirm = () => {
    if (!actionId || !actionType) return;
    const opts = {
      onSuccess: () => {
        toast({ title: actionType === "approve" ? "Đã duyệt yêu cầu" : "Đã từ chối yêu cầu" });
        invalidate(); setActionId(null); setActionType(null);
      },
      onError: (e: any) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
    };
    if (actionType === "approve") {
      approveReq.mutate({ id: actionId, data: { adminNote: adminNote || undefined } }, opts);
    } else {
      rejectReq.mutate({ id: actionId, data: { adminNote: adminNote || undefined } }, opts);
    }
  };

  const requests = data?.requests || [];
  const isPending = approveReq.isPending || rejectReq.isPending;

  return (
    <div className="container mx-auto px-4 py-8 max-w-screen-xl">
      <Button variant="ghost" asChild className="mb-4 -ml-4 text-muted-foreground">
        <Link href="/admin"><ArrowLeft className="mr-2 h-4 w-4" />Dashboard</Link>
      </Button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Wallet className="h-8 w-8 text-primary" />Duyệt Nạp Tiền</h1>
          <p className="text-muted-foreground mt-1">Xem xét và duyệt các yêu cầu nạp tiền từ người dùng</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-card border-border/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Chờ duyệt</SelectItem>
            <SelectItem value="approved">Đã duyệt</SelectItem>
            <SelectItem value="rejected">Từ chối</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-base text-muted-foreground">
            {data?.total ?? 0} yêu cầu — {statusFilter === "pending" ? "đang chờ xử lý" : statusFilter === "approved" ? "đã được duyệt" : "đã bị từ chối"}
          </CardTitle>
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
                    <TableHead>Người dùng</TableHead>
                    <TableHead>Số tiền</TableHead>
                    <TableHead>Phương thức</TableHead>
                    <TableHead>Ghi chú</TableHead>
                    <TableHead>Ngày gửi</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    {statusFilter === "pending" && <TableHead className="text-right">Thao tác</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req) => {
                    const sc = STATUS_CONFIG[req.status as keyof typeof STATUS_CONFIG];
                    return (
                      <TableRow key={req.id}>
                        <TableCell className="font-mono text-muted-foreground">#{req.id}</TableCell>
                        <TableCell>
                          <div className="font-medium">{req.userUsername || "—"}</div>
                          <div className="text-xs text-muted-foreground">{req.userEmail}</div>
                        </TableCell>
                        <TableCell className="font-mono font-bold text-primary">{formatVND(req.amount)}</TableCell>
                        <TableCell>{METHOD_LABELS[req.method] || req.method}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">{req.note || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(req.createdAt)}</TableCell>
                        <TableCell><Badge className={sc?.className}>{sc?.label}</Badge></TableCell>
                        {statusFilter === "pending" && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => openAction(req.id, "approve")}>
                                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />Duyệt
                              </Button>
                              <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => openAction(req.id, "reject")}>
                                <XCircle className="mr-1 h-3.5 w-3.5" />Từ chối
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                  {requests.length === 0 && (
                    <TableRow><TableCell colSpan={statusFilter === "pending" ? 8 : 7} className="text-center py-8 text-muted-foreground">Không có yêu cầu nào</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <Dialog open={!!actionId} onOpenChange={(o) => { if (!o) { setActionId(null); setActionType(null); } }}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${actionType === "approve" ? "text-green-400" : "text-red-400"}`}>
              {actionType === "approve" ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              {actionType === "approve" ? "Xác nhận duyệt nạp tiền" : "Xác nhận từ chối"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-muted-foreground text-sm">
              {actionType === "approve"
                ? "Số tiền sẽ được cộng ngay vào tài khoản người dùng."
                : "Yêu cầu sẽ bị từ chối và không cộng tiền."}
            </p>
            <div className="space-y-1">
              <Label>Ghi chú admin (tùy chọn)</Label>
              <Input value={adminNote} onChange={(e) => setAdminNote(e.target.value)} placeholder="Lý do hoặc ghi chú..." className="bg-background/50" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setActionId(null); setActionType(null); }}>Hủy</Button>
            <Button
              className={actionType === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-destructive hover:bg-destructive/90"}
              onClick={handleConfirm} disabled={isPending}
            >
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {actionType === "approve" ? "Xác nhận duyệt" : "Xác nhận từ chối"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
