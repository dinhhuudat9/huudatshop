import { Router } from "express";
import { db, reviewsTable, productsTable, usersTable } from "@workspace/db";
import { eq, desc, sql, avg } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

// GET /products/:productId/reviews
router.get("/products/:productId/reviews", async (req, res) => {
  const productId = parseInt(req.params.productId);
  if (isNaN(productId)) { res.status(400).json({ error: "Invalid ID" }); return; }
  try {
    const reviews = await db
      .select({
        id: reviewsTable.id,
        productId: reviewsTable.productId,
        userId: reviewsTable.userId,
        username: usersTable.username,
        rating: reviewsTable.rating,
        comment: reviewsTable.comment,
        createdAt: reviewsTable.createdAt,
      })
      .from(reviewsTable)
      .leftJoin(usersTable, eq(reviewsTable.userId, usersTable.id))
      .where(eq(reviewsTable.productId, productId))
      .orderBy(desc(reviewsTable.createdAt));
    res.json(reviews);
  } catch (err) {
    req.log.error(err, "list reviews error");
    res.status(500).json({ error: "Lỗi server" });
  }
});

// POST /products/:productId/reviews
router.post("/products/:productId/reviews", requireAuth, async (req, res) => {
  const productId = parseInt(req.params.productId);
  if (isNaN(productId)) { res.status(400).json({ error: "Invalid ID" }); return; }
  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    res.status(400).json({ error: "Rating phải từ 1 đến 5" }); return;
  }
  try {
    const [review] = await db.insert(reviewsTable).values({
      productId,
      userId: req.auth!.userId,
      rating: parseInt(rating),
      comment,
    }).returning();

    // Update product rating
    const [avgResult] = await db.select({ avg: avg(reviewsTable.rating) }).from(reviewsTable).where(eq(reviewsTable.productId, productId));
    const newRating = parseFloat(String(avgResult?.avg || 0));
    const [countResult] = await db.select({ count: sql<number>`count(*)::int` }).from(reviewsTable).where(eq(reviewsTable.productId, productId));
    await db.update(productsTable).set({
      rating: newRating,
      reviewCount: countResult?.count ?? 0,
    }).where(eq(productsTable.id, productId));

    const [user] = await db.select({ username: usersTable.username }).from(usersTable).where(eq(usersTable.id, req.auth!.userId)).limit(1);
    res.status(201).json({ ...review, username: user?.username ?? null });
  } catch (err) {
    req.log.error(err, "create review error");
    res.status(500).json({ error: "Lỗi server" });
  }
});

export default router;
