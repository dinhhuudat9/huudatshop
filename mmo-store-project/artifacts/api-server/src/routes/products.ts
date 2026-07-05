import { Router } from "express";
import { db, productsTable, categoriesTable, reviewsTable, usersTable } from "@workspace/db";
import { eq, ilike, and, gte, lte, desc, asc, sql } from "drizzle-orm";
import { requireAuth, requireAdmin, optionalAuth } from "../middlewares/auth";

const router = Router();

// GET /products
router.get("/products", async (req, res) => {
  try {
    const { categoryId, search, minPrice, maxPrice, sortBy, page = "1", limit = "20", featured } = req.query;
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
    const offset = (pageNum - 1) * limitNum;

    const conditions: any[] = [eq(productsTable.status, "active")];
    if (categoryId) conditions.push(eq(productsTable.categoryId, parseInt(categoryId as string)));
    if (search) conditions.push(ilike(productsTable.name, `%${search}%`));
    if (minPrice) conditions.push(gte(productsTable.price, parseFloat(minPrice as string)));
    if (maxPrice) conditions.push(lte(productsTable.price, parseFloat(maxPrice as string)));
    if (featured === "true") conditions.push(eq(productsTable.featured, true));

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

    let orderBy;
    switch (sortBy) {
      case "price_asc": orderBy = asc(productsTable.price); break;
      case "price_desc": orderBy = desc(productsTable.price); break;
      case "popular": orderBy = desc(productsTable.soldCount); break;
      case "rating": orderBy = desc(productsTable.rating); break;
      default: orderBy = desc(productsTable.createdAt);
    }

    const [countResult] = await db.select({ count: sql<number>`count(*)::int` }).from(productsTable).where(whereClause);
    const total = countResult?.count ?? 0;

    const products = await db
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
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limitNum)
      .offset(offset);

    res.json({
      products,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    req.log.error(err, "list products error");
    res.status(500).json({ error: "Lỗi server" });
  }
});

// GET /products/featured
router.get("/products/featured", async (req, res) => {
  try {
    const products = await db
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
      .where(and(eq(productsTable.featured, true), eq(productsTable.status, "active")))
      .orderBy(desc(productsTable.createdAt))
      .limit(8);
    res.json(products);
  } catch (err) {
    req.log.error(err, "featured products error");
    res.status(500).json({ error: "Lỗi server" });
  }
});

// GET /products/popular
router.get("/products/popular", async (req, res) => {
  try {
    const products = await db
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
      .limit(10);
    res.json(products);
  } catch (err) {
    req.log.error(err, "popular products error");
    res.status(500).json({ error: "Lỗi server" });
  }
});

// GET /products/:id
router.get("/products/:id", optionalAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(404).json({ error: "Not found" }); return; }
  try {
    // increment view count
    await db.update(productsTable).set({ viewCount: sql`${productsTable.viewCount} + 1` }).where(eq(productsTable.id, id));

    const [product] = await db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        slug: productsTable.slug,
        description: productsTable.description,
        shortDescription: productsTable.shortDescription,
        price: productsTable.price,
        originalPrice: productsTable.originalPrice,
        thumbnailUrl: productsTable.thumbnailUrl,
        imageUrls: productsTable.imageUrls,
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
        features: productsTable.features,
        demoUrl: productsTable.demoUrl,
        downloadUrl: productsTable.downloadUrl,
        createdAt: productsTable.createdAt,
      })
      .from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .where(eq(productsTable.id, id))
      .limit(1);

    if (!product) { res.status(404).json({ error: "Không tìm thấy sản phẩm" }); return; }

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
      .where(eq(reviewsTable.productId, id))
      .orderBy(desc(reviewsTable.createdAt))
      .limit(20);

    res.json({ ...product, reviews });
  } catch (err) {
    req.log.error(err, "get product error");
    res.status(500).json({ error: "Lỗi server" });
  }
});

// POST /products (admin)
router.post("/products", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, description, shortDescription, price, originalPrice, thumbnailUrl, imageUrls, categoryId, featured, status, tags, techStack, features, demoUrl, downloadUrl } = req.body;
    if (!name || !price || !categoryId) {
      res.status(400).json({ error: "Thiếu thông tin bắt buộc" }); return;
    }
    const slug = name.toLowerCase()
      .replace(/[àáâãäå]/g, "a").replace(/[èéêë]/g, "e").replace(/[ìíîï]/g, "i")
      .replace(/[òóôõö]/g, "o").replace(/[ùúûü]/g, "u")
      .replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-")
      + "-" + Date.now();
    const [product] = await db.insert(productsTable).values({
      name, slug, description: description || "", shortDescription, price, originalPrice,
      thumbnailUrl, imageUrls: imageUrls || [], categoryId, featured: featured ?? false,
      status: status || "active", tags: tags || [], techStack: techStack || [],
      features: features || [], demoUrl, downloadUrl,
    }).returning();
    await db.update(categoriesTable).set({ productCount: sql`${categoriesTable.productCount} + 1` }).where(eq(categoriesTable.id, categoryId));
    res.status(201).json({ ...product, categoryName: null });
  } catch (err) {
    req.log.error(err, "create product error");
    res.status(500).json({ error: "Lỗi server" });
  }
});

// PATCH /products/:id (admin)
router.patch("/products/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  try {
    const updates: any = {};
    const fields = ["name", "description", "shortDescription", "price", "originalPrice", "thumbnailUrl", "imageUrls", "categoryId", "featured", "status", "tags", "techStack", "features", "demoUrl", "downloadUrl"];
    for (const f of fields) {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    }
    const [product] = await db.update(productsTable).set(updates).where(eq(productsTable.id, id)).returning();
    if (!product) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ...product, categoryName: null });
  } catch (err) {
    req.log.error(err, "update product error");
    res.status(500).json({ error: "Lỗi server" });
  }
});

// DELETE /products/:id (admin)
router.delete("/products/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  try {
    await db.delete(productsTable).where(eq(productsTable.id, id));
    res.json({ message: "Xóa sản phẩm thành công" });
  } catch (err) {
    req.log.error(err, "delete product error");
    res.status(500).json({ error: "Lỗi server" });
  }
});

export default router;
