import { Router } from "express";
import { db, usersTable, ordersTable, productsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

// POST /users/balance
router.post("/users/balance", requireAuth, async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) {
    res.status(400).json({ error: "Số tiền không hợp lệ" }); return;
  }
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.auth!.userId)).limit(1);
    if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
    const newBalance = user.balance + parseFloat(amount);
    const [updated] = await db.update(usersTable).set({ balance: newBalance }).where(eq(usersTable.id, user.id)).returning();
    res.json({
      id: updated.id, username: updated.username, email: updated.email,
      role: updated.role, balance: updated.balance, avatarUrl: updated.avatarUrl, createdAt: updated.createdAt,
    });
  } catch (err) {
    req.log.error(err, "add balance error");
    res.status(500).json({ error: "Lỗi server" });
  }
});

// GET /users/downloads
router.get("/users/downloads", requireAuth, async (req, res) => {
  try {
    const orders = await db
      .select({
        id: ordersTable.id,
        productId: ordersTable.productId,
        productName: productsTable.name,
        productThumbnail: productsTable.thumbnailUrl,
        downloadUrl: ordersTable.downloadUrl,
        createdAt: ordersTable.createdAt,
      })
      .from(ordersTable)
      .leftJoin(productsTable, eq(ordersTable.productId, productsTable.id))
      .where(eq(ordersTable.userId, req.auth!.userId))
      .orderBy(desc(ordersTable.createdAt));

    const downloads = orders
      .filter(o => o.downloadUrl)
      .map(o => ({
        orderId: o.id,
        productId: o.productId,
        productName: o.productName ?? "",
        productThumbnail: o.productThumbnail ?? null,
        downloadUrl: o.downloadUrl!,
        purchasedAt: o.createdAt,
      }));

    res.json(downloads);
  } catch (err) {
    req.log.error(err, "get downloads error");
    res.status(500).json({ error: "Lỗi server" });
  }
});

// PATCH /users/profile
router.patch("/users/profile", requireAuth, async (req, res) => {
  const { username, avatarUrl } = req.body;
  try {
    const updates: any = {};
    if (username) updates.username = username;
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
    const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, req.auth!.userId)).returning();
    res.json({
      id: updated.id, username: updated.username, email: updated.email,
      role: updated.role, balance: updated.balance, avatarUrl: updated.avatarUrl, createdAt: updated.createdAt,
    });
  } catch (err) {
    req.log.error(err, "update profile error");
    res.status(500).json({ error: "Lỗi server" });
  }
});

export default router;
