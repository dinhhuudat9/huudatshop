import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { usersTable } from "../../lib/db/src/schema/users.js";
import { eq } from "drizzle-orm";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function seedUsers() {
  const adminHash = await bcrypt.hash("admin123", 10);
  const userHash = await bcrypt.hash("user123", 10);

  // Upsert admin
  const existingAdmin = await db.select().from(usersTable).where(eq(usersTable.email, "admin@mmostore.vn")).limit(1);
  if (existingAdmin.length > 0) {
    await db.update(usersTable).set({ password: adminHash, role: "admin" }).where(eq(usersTable.email, "admin@mmostore.vn"));
    console.log("Updated admin password");
  } else {
    await db.insert(usersTable).values({ username: "admin", email: "admin@mmostore.vn", password: adminHash, role: "admin", balance: 0 });
    console.log("Inserted admin");
  }

  // Upsert user
  const existingUser = await db.select().from(usersTable).where(eq(usersTable.email, "user@mmostore.vn")).limit(1);
  if (existingUser.length > 0) {
    await db.update(usersTable).set({ password: userHash }).where(eq(usersTable.email, "user@mmostore.vn"));
    console.log("Updated user password");
  } else {
    await db.insert(usersTable).values({ username: "user", email: "user@mmostore.vn", password: userHash, role: "user", balance: 500000 });
    console.log("Inserted user");
  }

  await pool.end();
  console.log("Done!");
}

seedUsers().catch((e) => { console.error(e); process.exit(1); });
