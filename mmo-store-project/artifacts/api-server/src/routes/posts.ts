import { Router } from "express";
import { db, postsTable, usersTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";

const router = Router();

// GET /posts
router.get("/posts", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const offset = (page - 1) * limit;

    const [countResult] = await db.select({ count: sql<number>`count(*)::int` }).from(postsTable);
    const total = countResult?.count ?? 0;

    const posts = await db
      .select({
        id: postsTable.id,
        title: postsTable.title,
        slug: postsTable.slug,
        excerpt: postsTable.excerpt,
        content: postsTable.content,
        thumbnailUrl: postsTable.thumbnailUrl,
        authorName: usersTable.username,
        viewCount: postsTable.viewCount,
        tags: postsTable.tags,
        createdAt: postsTable.createdAt,
      })
      .from(postsTable)
      .leftJoin(usersTable, eq(postsTable.authorId, usersTable.id))
      .orderBy(desc(postsTable.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({ posts, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    req.log.error(err, "list posts error");
    res.status(500).json({ error: "Lỗi server" });
  }
});

// GET /posts/:id
router.get("/posts/:id", async (req, res) => {
  try {
    const idOrSlug = req.params.id;
    const numId = parseInt(idOrSlug);

    let post;
    if (!isNaN(numId)) {
      const result = await db
        .select({ id: postsTable.id, title: postsTable.title, slug: postsTable.slug, excerpt: postsTable.excerpt, content: postsTable.content, thumbnailUrl: postsTable.thumbnailUrl, authorName: usersTable.username, viewCount: postsTable.viewCount, tags: postsTable.tags, createdAt: postsTable.createdAt })
        .from(postsTable).leftJoin(usersTable, eq(postsTable.authorId, usersTable.id)).where(eq(postsTable.id, numId)).limit(1);
      post = result[0];
    } else {
      const result = await db
        .select({ id: postsTable.id, title: postsTable.title, slug: postsTable.slug, excerpt: postsTable.excerpt, content: postsTable.content, thumbnailUrl: postsTable.thumbnailUrl, authorName: usersTable.username, viewCount: postsTable.viewCount, tags: postsTable.tags, createdAt: postsTable.createdAt })
        .from(postsTable).leftJoin(usersTable, eq(postsTable.authorId, usersTable.id)).where(eq(postsTable.slug, idOrSlug)).limit(1);
      post = result[0];
    }

    if (!post) { res.status(404).json({ error: "Không tìm thấy bài viết" }); return; }
    await db.update(postsTable).set({ viewCount: sql`${postsTable.viewCount} + 1` }).where(eq(postsTable.id, post.id));
    res.json(post);
  } catch (err) {
    req.log.error(err, "get post error");
    res.status(500).json({ error: "Lỗi server" });
  }
});

// POST /posts (admin)
router.post("/posts", requireAuth, requireAdmin, async (req, res) => {
  const { title, excerpt, content, thumbnailUrl, tags } = req.body;
  if (!title || !content) {
    res.status(400).json({ error: "Title và content là bắt buộc" }); return;
  }
  const slug = title.toLowerCase()
    .replace(/[àáâãäå]/g, "a").replace(/[èéêë]/g, "e").replace(/[ìíîï]/g, "i")
    .replace(/[òóôõö]/g, "o").replace(/[ùúûü]/g, "u")
    .replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-")
    + "-" + Date.now();
  try {
    const [post] = await db.insert(postsTable).values({
      title, slug, excerpt, content, thumbnailUrl, tags: tags || [],
      authorId: req.auth!.userId,
    }).returning();
    res.status(201).json({ ...post, authorName: null });
  } catch (err) {
    req.log.error(err, "create post error");
    res.status(500).json({ error: "Lỗi server" });
  }
});

export default router;
