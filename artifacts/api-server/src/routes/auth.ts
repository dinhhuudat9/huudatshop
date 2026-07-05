import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import nodemailer from "nodemailer";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, signToken } from "../middlewares/auth";
import { RegisterBody, LoginBody } from "@workspace/api-zod";

const router = Router();

function getMailTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
}

// POST /auth/register
router.post("/auth/register", async (req, res) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  const { username, email, password } = parsed.data;
  try {
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(400).json({ error: "Email đã được sử dụng" });
      return;
    }
    const existingUsername = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
    if (existingUsername.length > 0) {
      res.status(400).json({ error: "Tên người dùng đã tồn tại" });
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const [user] = await db.insert(usersTable).values({
      username,
      email,
      password: hashedPassword,
      role: "user",
      balance: 0,
    }).returning();
    const token = signToken(user.id, user.role);
    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        balance: user.balance,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (err) {
    req.log.error(err, "register error");
    res.status(500).json({ error: "Lỗi server" });
  }
});

// POST /auth/login
router.post("/auth/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { email, password } = parsed.data;
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) {
      res.status(401).json({ error: "Email hoặc mật khẩu không đúng" });
      return;
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: "Email hoặc mật khẩu không đúng" });
      return;
    }
    const token = signToken(user.id, user.role);
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        balance: user.balance,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (err) {
    req.log.error(err, "login error");
    res.status(500).json({ error: "Lỗi server" });
  }
});

// POST /auth/logout
router.post("/auth/logout", (req, res) => {
  res.json({ message: "Đăng xuất thành công" });
});

// GET /auth/me
router.get("/auth/me", requireAuth, async (req, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.auth!.userId)).limit(1);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      balance: user.balance,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    });
  } catch (err) {
    req.log.error(err, "get me error");
    res.status(500).json({ error: "Lỗi server" });
  }
});

// POST /auth/forgot-password
router.post("/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "Email không hợp lệ" });
    return;
  }
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim())).limit(1);

    // Always return success to prevent user enumeration
    if (!user) {
      res.json({ message: "Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu." });
      return;
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.update(usersTable).set({
      resetToken: token,
      resetTokenExpires: expires,
    }).where(eq(usersTable.id, user.id));

    const domain = process.env.REPLIT_DOMAINS?.split(",")[0] || "localhost:80";
    const resetUrl = `https://${domain}/dat-lai-mat-khau?token=${token}`;

    const transporter = getMailTransporter();
    if (transporter) {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: user.email,
        subject: "MMO Store - Đặt lại mật khẩu",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 32px; border-radius: 12px;">
            <h2 style="color: #818cf8;">MMO Store</h2>
            <h3>Đặt lại mật khẩu</h3>
            <p>Bạn đã yêu cầu đặt lại mật khẩu. Nhấp vào nút bên dưới để tiếp tục:</p>
            <a href="${resetUrl}" style="display:inline-block; background:#5b4df2; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:bold; margin:16px 0;">
              Đặt lại mật khẩu
            </a>
            <p style="color:#94a3b8; font-size:14px;">Link có hiệu lực trong 1 giờ. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
          </div>
        `,
      });
    } else {
      // No email configured - log reset URL for development
      req.log.info({ resetUrl, userId: user.id }, "Password reset token (no email configured)");
    }

    res.json({ message: "Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu." });
  } catch (err) {
    req.log.error(err, "forgot-password error");
    res.status(500).json({ error: "Lỗi server" });
  }
});

// POST /auth/reset-password
router.post("/auth/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword || newPassword.length < 6) {
    res.status(400).json({ error: "Token hoặc mật khẩu không hợp lệ" });
    return;
  }
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.resetToken, token)).limit(1);
    if (!user || !user.resetTokenExpires || user.resetTokenExpires < new Date()) {
      res.status(400).json({ error: "Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn" });
      return;
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await db.update(usersTable).set({
      password: hashed,
      resetToken: null,
      resetTokenExpires: null,
    }).where(eq(usersTable.id, user.id));

    res.json({ message: "Mật khẩu đã được đặt lại thành công" });
  } catch (err) {
    req.log.error(err, "reset-password error");
    res.status(500).json({ error: "Lỗi server" });
  }
});

export default router;
