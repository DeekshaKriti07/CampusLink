import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { requireAuth } from "../../middleware/auth.middleware";

const router = Router();

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(12).max(72),
});

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.issues },
    });
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({
      success: false,
      error: { code: "DUPLICATE_RESOURCE", message: "Email already registered" },
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword },
  });

  return res.status(201).json({
    success: true,
    data: { id: user.id, name: user.name, email: user.email, role: user.role },
    message: "User registered successfully",
  });
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(6).max(72),
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Invalid input" },
    });
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({
      success: false,
      error: { code: "AUTHENTICATION_REQUIRED", message: "Invalid credentials" },
    });
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(401).json({
      success: false,
      error: { code: "AUTHENTICATION_REQUIRED", message: "Invalid credentials" },
    });
  }

  const accessToken = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: "15m" }
  );

  return res.json({
    success: true,
    data: { accessToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } },
    message: "Login successful",
  });
});

router.get("/me", requireAuth, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: { code: "AUTHENTICATION_REQUIRED", message: "No user" } });
  }
  const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
  if (!user) {
    return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "User not found" } });
  }
  return res.json({
    success: true,
    data: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

export default router;
