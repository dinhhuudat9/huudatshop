import { Router } from "express";
import { db, productsTable, ordersTable, usersTable, categoriesTable, reviewsTable } from "@workspace/db";
import { eq, desc, sql, sum } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

// GET /stats/overview (public or admin)
router.get("/stats/overview", async (req, res) => {
  try {
    const [productCount] = await db.select({ count: sql<number>`count(*)::int` }).from(productsTable).where(eq(productsTable.status, "active"));
    const [orderCount] = await db.select({ count: sql<number>`count(*)::int` }).from(ordersTable);
    const [userCount] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable);
    const [revenueResult] = await db.select({ total: sum(ordersTable.amount) }).from(ordersTable).where(eq(ordersTable.status, "completed"));

    const topProducts = await db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        slug: productsTable.slug,
        description: productsTable.description,
        shortDescription: productsTable.shortDescription,
        price: productsTable.price,
        originalPrice: productsTable.originalPrice,
        thumbnailUrl: productsTable.thumbnailUrl,
        categoryId: productsTable.categoryId,
        categoryName: categoriesTable.name,
        status: productsTable.status,
        featured: productsTable.featured,
        viewCount: productsTable.viewCount,
        soldCount: productsTable.soldCount,
        rating: productsTable.rating,
        reviewCount: productsTable.reviewCount,
        tags: productsTable.tags,
        techStack: productsTable.techStack,
        createdAt: productsTable.createdAt,
      })
      .from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .where(eq(productsTable.status, "active"))
      .orderBy(desc(productsTable.soldCount))
      .limit(5);

    const recentOrders = await db
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
      .orderBy(desc(ordersTable.createdAt))
      .limit(10);

    const categoryCounts = await db
      .select({
        categoryName: categoriesTable.name,
        count: sql<number>`count(${productsTable.id})::int`,
      })
      .from(categoriesTable)
      .leftJoin(productsTable, eq(productsTable.categoryId, categoriesTable.id))
      .groupBy(categoriesTable.id, categoriesTable.name);

    res.json({
      totalProducts: productCount?.count ?? 0,
      totalOrders: orderCount?.count ?? 0,
      totalUsers: userCount?.count ?? 0,
      totalRevenue: parseFloat(String(revenueResult?.total || 0)),
      topProducts,
      recentOrders,
      categoryCounts,
    });
  } catch (err) {
    req.log.error(err, "stats overview error");
    res.status(500).json({ error: "Lỗi server" });
  }
});

// GET /stats/user
router.get("/stats/user", requireAuth, async (req, res) => {
  try {
    const orders = await db
      .select({
        id: ordersTable.id,
        productId: ordersTable.productId,
        productName: productsTable.name,
        productThumbnail: productsTable.thumbnailUrl,
        amount: ordersTable.amount,
        downloadUrl: ordersTable.downloadUrl,
        createdAt: ordersTable.createdAt,
      })
      .from(ordersTable)
      .leftJoin(productsTable, eq(ordersTable.productId, productsTable.id))
      .where(eq(ordersTable.userId, req.auth!.userId))
      .orderBy(desc(ordersTable.createdAt));

    const totalSpent = orders.reduce((sum, o) => sum + o.amount, 0);
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

    res.json({ purchaseCount: orders.length, totalSpent, downloads });
  } catch (err) {
    req.log.error(err, "user stats error");
    res.status(500).json({ error: "Lỗi server" });
  }
});

export default router;
