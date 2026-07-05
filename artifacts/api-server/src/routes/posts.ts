import { Router } from "express";
import { db, postsTable, usersTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";

const router = Router();

const postSelect = {
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
};

router.get("/posts", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const offset = (page - 1) * limit;
    const [countResult] = await db.select({ count: sql<number>`count(*)::int` }).from(postsTable);
    const total = countResult?.count ?? 0;
    const posts = await db.select(postSelect).from(postsTable)
      .leftJoin(usersTable, eq(postsTable.authorId, usersTable.id))
      .orderBy(desc(postsTable.createdAt)).limit(limit).offset(offset);
    res.json({ posts, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    req.log.error(err, "list posts error");
    res.status(500).json({ error: "Lỗi server" });
  }
});

router.get("/posts/:id", async (req, res) => {
  try {
    const idOrSlug = String(req.params.id);
    const numId = parseInt(idOrSlug);
    let post;
    if (!isNaN(numId)) {
      [post] = await db.select(postSelect).from(postsTable)
        .leftJoin(usersTable, eq(postsTable.authorId, usersTable.id))
        .where(eq(postsTable.id, numId)).limit(1);
    } else {
      [post] = await db.select(postSelect).from(postsTable)
        .leftJoin(usersTable, eq(postsTable.authorId, usersTable.id))
        .where(eq(postsTable.slug, idOrSlug)).limit(1);
    }
    if (!post) { res.status(404).json({ error: "Không tìm thấy bài viết" }); return; }
    await db.update(postsTable).set({ viewCount: sql`${postsTable.viewCount} + 1` }).where(eq(postsTable.id, post.id));
    res.json(post);
  } catch (err) {
    req.log.error(err, "get post error");
    res.status(500).json({ error: "Lỗi server" });
  }
});

router.post("/posts", requireAuth, requireAdmin, async (req, res) => {
  const { title, excerpt, content, thumbnailUrl, tags } = req.body;
  if (!title || !content) { res.status(400).json({ error: "Title và content là bắt buộc" }); return; }
  const slug = title.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-").replace(/-+/g, "-").trim()
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

router.put("/posts/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  const { title, excerpt, content, thumbnailUrl, tags } = req.body;
  if (!title || !content) { res.status(400).json({ error: "Title và content là bắt buộc" }); return; }
  try {
    const [post] = await db.update(postsTable).set({ title, excerpt, content, thumbnailUrl, tags: tags || [] })
      .where(eq(postsTable.id, id)).returning();
    if (!post) { res.status(404).json({ error: "Không tìm thấy bài viết" }); return; }
    res.json({ ...post, authorName: null });
  } catch (err) {
    req.log.error(err, "update post error");
    res.status(500).json({ error: "Lỗi server" });
  }
});

router.delete("/posts/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  try {
    await db.delete(postsTable).where(eq(postsTable.id, id));
    res.json({ message: "Đã xóa bài viết" });
  } catch (err) {
    req.log.error(err, "delete post error");
    res.status(500).json({ error: "Lỗi server" });
  }
});

export default router;
