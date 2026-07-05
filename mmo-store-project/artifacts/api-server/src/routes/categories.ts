import { Router } from "express";
import { db, categoriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";

const router = Router();

// GET /categories
router.get("/categories", async (req, res) => {
  try {
    const categories = await db.select().from(categoriesTable).orderBy(categoriesTable.name);
    res.json(categories);
  } catch (err) {
    req.log.error(err, "list categories error");
    res.status(500).json({ error: "Lỗi server" });
  }
});

// GET /categories/:id
router.get("/categories/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  try {
    const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, id)).limit(1);
    if (!cat) {
      res.status(404).json({ error: "Không tìm thấy danh mục" });
      return;
    }
    res.json(cat);
  } catch (err) {
    req.log.error(err, "get category error");
    res.status(500).json({ error: "Lỗi server" });
  }
});

// POST /categories (admin)
router.post("/categories", requireAuth, requireAdmin, async (req, res) => {
  const { name, description, iconName } = req.body;
  if (!name) {
    res.status(400).json({ error: "Name is required" });
    return;
  }
  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  try {
    const [cat] = await db.insert(categoriesTable).values({ name, slug, description, iconName }).returning();
    res.status(201).json(cat);
  } catch (err) {
    req.log.error(err, "create category error");
    res.status(500).json({ error: "Lỗi server" });
  }
});

export default router;
