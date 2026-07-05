import { Router } from "express";
import { db, balanceRequestsTable, usersTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";

const router = Router();

// GET /balance-requests — admin: all; user: own
router.get("/balance-requests", requireAuth, async (req, res) => {
  try {
    const isAdmin = req.auth!.role === "admin";
    const { status, limit = "50" } = req.query as { status?: string; limit?: string };
    const limitNum = Math.min(200, parseInt(limit) || 50);

    const conditions: any[] = isAdmin ? [] : [eq(balanceRequestsTable.userId, req.auth!.userId)];
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      conditions.push(eq(balanceRequestsTable.status, status as any));
    }

    const query = db
      .select({
        id: balanceRequestsTable.id,
        userId: balanceRequestsTable.userId,
        userEmail: usersTable.email,
        userUsername: usersTable.username,
        amount: balanceRequestsTable.amount,
        method: balanceRequestsTable.method,
        status: balanceRequestsTable.status,
        note: balanceRequestsTable.note,
        adminNote: balanceRequestsTable.adminNote,
        processedBy: balanceRequestsTable.processedBy,
        processedAt: balanceRequestsTable.processedAt,
        createdAt: balanceRequestsTable.createdAt,
      })
      .from(balanceRequestsTable)
      .leftJoin(usersTable, eq(balanceRequestsTable.userId, usersTable.id))
      .orderBy(desc(balanceRequestsTable.createdAt))
      .limit(limitNum);

    const requests = conditions.length > 0
      ? await query.where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : await query;

    res.json({ requests, total: requests.length });
  } catch (err) {
    req.log.error(err, "list balance requests error");
    res.status(500).json({ error: "Lỗi server" });
  }
});

// POST /balance-requests — user submits request
router.post("/balance-requests", requireAuth, async (req, res) => {
  const { amount, method, note } = req.body;
  if (!amount || amount < 50000) {
    res.status(400).json({ error: "Số tiền tối thiểu 50.000đ" }); return;
  }
  if (!method || !["bank_transfer", "momo", "vnpay", "zalopay"].includes(method)) {
    res.status(400).json({ error: "Phương thức thanh toán không hợp lệ" }); return;
  }
  try {
    const [req_] = await db.insert(balanceRequestsTable).values({
      userId: req.auth!.userId,
      amount: parseFloat(amount),
      method,
      note: note || null,
      status: "pending",
    }).returning();

    const [user] = await db.select({ email: usersTable.email, username: usersTable.username })
      .from(usersTable).where(eq(usersTable.id, req.auth!.userId)).limit(1);

    res.status(201).json({ ...req_, userEmail: user?.email, userUsername: user?.username });
  } catch (err) {
    req.log.error(err, "create balance request error");
    res.status(500).json({ error: "Lỗi server" });
  }
});

// POST /balance-requests/:id/approve (admin)
router.post("/balance-requests/:id/approve", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "ID không hợp lệ" }); return; }
  const { adminNote } = req.body || {};
  try {
    const [request] = await db.select().from(balanceRequestsTable).where(eq(balanceRequestsTable.id, id)).limit(1);
    if (!request) { res.status(404).json({ error: "Yêu cầu không tồn tại" }); return; }
    if (request.status !== "pending") { res.status(400).json({ error: "Yêu cầu đã được xử lý" }); return; }

    // Credit balance to user
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, request.userId)).limit(1);
    if (!user) { res.status(404).json({ error: "User không tồn tại" }); return; }
    await db.update(usersTable).set({ balance: user.balance + request.amount }).where(eq(usersTable.id, user.id));

    const [updated] = await db.update(balanceRequestsTable).set({
      status: "approved",
      adminNote: adminNote || null,
      processedBy: req.auth!.userId,
      processedAt: new Date(),
    }).where(eq(balanceRequestsTable.id, id)).returning();

    res.json({ ...updated, userEmail: user.email, userUsername: user.username });
  } catch (err) {
    req.log.error(err, "approve balance request error");
    res.status(500).json({ error: "Lỗi server" });
  }
});

// POST /balance-requests/:id/reject (admin)
router.post("/balance-requests/:id/reject", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "ID không hợp lệ" }); return; }
  const { adminNote } = req.body || {};
  try {
    const [request] = await db.select().from(balanceRequestsTable).where(eq(balanceRequestsTable.id, id)).limit(1);
    if (!request) { res.status(404).json({ error: "Yêu cầu không tồn tại" }); return; }
    if (request.status !== "pending") { res.status(400).json({ error: "Yêu cầu đã được xử lý" }); return; }

    const [user] = await db.select({ email: usersTable.email, username: usersTable.username })
      .from(usersTable).where(eq(usersTable.id, request.userId)).limit(1);

    const [updated] = await db.update(balanceRequestsTable).set({
      status: "rejected",
      adminNote: adminNote || null,
      processedBy: req.auth!.userId,
      processedAt: new Date(),
    }).where(eq(balanceRequestsTable.id, id)).returning();

    res.json({ ...updated, userEmail: user?.email, userUsername: user?.username });
  } catch (err) {
    req.log.error(err, "reject balance request error");
    res.status(500).json({ error: "Lỗi server" });
  }
});

export default router;
