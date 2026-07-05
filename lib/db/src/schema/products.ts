import { pgTable, text, serial, integer, real, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productStatusEnum = pgEnum("product_status", ["active", "inactive", "draft"]);

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").default("").notNull(),
  shortDescription: text("short_description"),
  price: real("price").notNull(),
  originalPrice: real("original_price"),
  thumbnailUrl: text("thumbnail_url"),
  imageUrls: text("image_urls").array().default([]).notNull(),
  categoryId: integer("category_id").notNull(),
  status: productStatusEnum("status").default("active").notNull(),
  featured: boolean("featured").default(false).notNull(),
  viewCount: integer("view_count").default(0).notNull(),
  soldCount: integer("sold_count").default(0).notNull(),
  rating: real("rating").default(0).notNull(),
  reviewCount: integer("review_count").default(0).notNull(),
  tags: text("tags").array().default([]).notNull(),
  techStack: text("tech_stack").array().default([]).notNull(),
  features: text("features").array().default([]).notNull(),
  demoUrl: text("demo_url"),
  downloadUrl: text("download_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
