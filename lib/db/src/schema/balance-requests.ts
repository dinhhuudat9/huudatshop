import { pgTable, serial, integer, real, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const balanceRequestStatusEnum = pgEnum("balance_request_status", ["pending", "approved", "rejected"]);
export const balanceRequestMethodEnum = pgEnum("balance_request_method", ["bank_transfer", "momo", "vnpay", "zalopay"]);

export const balanceRequestsTable = pgTable("balance_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: real("amount").notNull(),
  method: balanceRequestMethodEnum("method").notNull(),
  status: balanceRequestStatusEnum("status").default("pending").notNull(),
  note: text("note"),
  adminNote: text("admin_note"),
  processedBy: integer("processed_by"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBalanceRequestSchema = createInsertSchema(balanceRequestsTable).omit({ id: true, createdAt: true });
export type InsertBalanceRequest = z.infer<typeof insertBalanceRequestSchema>;
export type BalanceRequest = typeof balanceRequestsTable.$inferSelect;
