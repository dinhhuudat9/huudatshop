import { Router } from "express";
import { db, categoriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";

const router = Router();

router.get("/categories", async (req, res) => {
  try {
    const categories = await db.select().from(categoriesTable).orderBy(categoriesTable.name);
    res.json(categories);
  } catch (err) {
    req.log.error(err, "list categories error");
    res.status(500).json({ error: "Lỗi server" });
  }
});

router.get("/categories/:id", async (req, res) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  try {
    const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, id)).limit(1);
    if (!cat) { res.status(404).json({ error: "Không tìm thấy danh mục" }); return; }
    res.json(cat);
  } catch (err) {
    req.log.error(err, "get category error");
    res.status(500).json({ error: "Lỗi server" });
  }
});

router.post("/categories", requireAuth, requireAdmin, async (req, res) => {
  const { name, description, iconName } = req.body;
  if (!name) { res.status(400).json({ error: "Name là bắt buộc" }); return; }
  const slug = name.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-").replace(/-+/g, "-").trim();
  try {
    const [cat] = await db.insert(categoriesTable).values({ name, slug, description, iconName }).returning();
    res.status(201).json(cat);
  } catch (err) {
    req.log.error(err, "create category error");
    res.status(500).json({ error: "Lỗi server" });
  }
});

router.put("/categories/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  const { name, description, iconName } = req.body;
  if (!name) { res.status(400).json({ error: "Name là bắt buộc" }); return; }
  const slug = name.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-").replace(/-+/g, "-").trim();
  try {
    const [cat] = await db.update(categoriesTable).set({ name, slug, description, iconName }).where(eq(categoriesTable.id, id)).returning();
    if (!cat) { res.status(404).json({ error: "Không tìm thấy danh mục" }); return; }
    res.json(cat);
  } catch (err) {
    req.log.error(err, "update category error");
    res.status(500).json({ error: "Lỗi server" });
  }
});

router.delete("/categories/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  try {
    await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
    res.json({ message: "Đã xóa danh mục" });
  } catch (err) {
    req.log.error(err, "delete category error");
    res.status(500).json({ error: "Lỗi server" });
  }
});

export default router;
