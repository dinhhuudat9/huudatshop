import { Router } from "express";
import { db, ordersTable, productsTable, usersTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

// GET /orders
router.get("/orders", requireAuth, async (req, res) => {
  try {
    const orders = await db
      .select({
        id: ordersTable.id,
        userId: ordersTable.userId,
        productId: ordersTable.productId,
        productName: productsTable.name,
        productThumbnail: productsTable.thumbnailUrl,
        amount: ordersTable.amount,
        status: ordersTable.status,
        downloadUrl: ordersTable.downloadUrl,
        createdAt: ordersTable.createdAt,
      })
      .from(ordersTable)
      .leftJoin(productsTable, eq(ordersTable.productId, productsTable.id))
      .where(eq(ordersTable.userId, req.auth!.userId))
      .orderBy(desc(ordersTable.createdAt));
    res.json(orders);
  } catch (err) {
    req.log.error(err, "list orders error");
    res.status(500).json({ error: "Lỗi server" });
  }
});

// POST /orders
router.post("/orders", requireAuth, async (req, res) => {
  const { productId } = req.body;
  if (!productId) {
    res.status(400).json({ error: "productId là bắt buộc" });
    return;
  }
  try {
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, parseInt(productId))).limit(1);
    if (!product) {
      res.status(404).json({ error: "Sản phẩm không tồn tại" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.auth!.userId)).limit(1);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    if (user.balance < product.price) {
      res.status(400).json({ error: "Số dư không đủ. Vui lòng nạp thêm tiền." });
      return;
    }
    // Deduct balance
    await db.update(usersTable).set({ balance: user.balance - product.price }).where(eq(usersTable.id, user.id));
    // Increment sold count
    await db.update(productsTable).set({ soldCount: sql`${productsTable.soldCount} + 1` }).where(eq(productsTable.id, product.id));
    // Create order
    const [order] = await db.insert(ordersTable).values({
      userId: user.id,
      productId: product.id,
      amount: product.price,
      status: "completed",
      downloadUrl: product.downloadUrl,
    }).returning();
    res.status(201).json({
      ...order,
      productName: product.name,
      productThumbnail: product.thumbnailUrl,
    });
  } catch (err) {
    req.log.error(err, "create order error");
    res.status(500).json({ error: "Lỗi server" });
  }
});

// GET /orders/:id
router.get("/orders/:id", requireAuth, async (req, res) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  try {
    const [order] = await db
      .select({
        id: ordersTable.id,
        userId: ordersTable.userId,
        productId: ordersTable.productId,
        productName: productsTable.name,
        productThumbnail: productsTable.thumbnailUrl,
        amount: ordersTable.amount,
        status: ordersTable.status,
        downloadUrl: ordersTable.downloadUrl,
        createdAt: ordersTable.createdAt,
      })
      .from(ordersTable)
      .leftJoin(productsTable, eq(ordersTable.productId, productsTable.id))
      .where(eq(ordersTable.id, id))
      .limit(1);
    if (!order || order.userId !== req.auth!.userId) {
      res.status(404).json({ error: "Không tìm thấy đơn hàng" }); return;
    }
    res.json(order);
  } catch (err) {
    req.log.error(err, "get order error");
    res.status(500).json({ error: "Lỗi server" });
  }
});

export default router;
