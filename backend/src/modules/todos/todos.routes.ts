import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { requireAuth } from "../../middleware/auth.middleware";

const router = Router();

const todoSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  dueDate: z.string().optional(),
  reminderAt: z.string().optional(),
});

router.post("/", requireAuth, async (req, res) => {
  const parsed = todoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.issues } });
  }
    const { title, description, category, priority, dueDate, reminderAt } = parsed.data;
    const todo = await prisma.todo.create({
      data: {
        title,
        description,
        category,
        priority: priority || "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
        reminderAt: reminderAt ? new Date(reminderAt) : null,
        userId: req.user.userId,
      },
    });
  return res.status(201).json({ success: true, data: todo, message: "Todo created" });
});

router.get("/", requireAuth, async (req, res) => {
  const todos = await prisma.todo.findMany({
    where: { userId: req.user.userId },
    orderBy: { createdAt: "desc" },
  });
  return res.json({ success: true, data: todos });
});

router.patch("/:id", requireAuth, async (req, res) => {
  const parsed = todoSchema.partial().extend({ status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED", "ARCHIVED"]).optional(), progress: z.number().int().min(0).max(100).optional() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid update' } });

  const id = parseInt(req.params.id);
  const todo = await prisma.todo.findUnique({ where: { id } });
  if (!todo) {
    return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Todo not found" } });
  }
  if (todo.userId !== req.user.userId) {
    return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Not authorized" } });
  }
  const { status, progress, title, description, priority, category, dueDate, reminderAt } = req.body;
  if (progress !== undefined && (progress < 0 || progress > 100)) {
    return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Progress must be 0-100" } });
  }
  const updated = await prisma.todo.update({
    where: { id },
    data: {
      ...(status !== undefined && { status }),
      ...(progress !== undefined && { progress }),
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(priority !== undefined && { priority }),
      ...(category !== undefined && { category }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(reminderAt !== undefined && { reminderAt: reminderAt ? new Date(reminderAt) : null }),
    },
  });
  return res.json({ success: true, data: updated, message: "Todo updated" });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const todo = await prisma.todo.findUnique({ where: { id } });
  if (!todo) {
    return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Todo not found" } });
  }
  if (todo.userId !== req.user.userId) {
    return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Not authorized" } });
  }
  await prisma.todo.delete({ where: { id } });
  return res.json({ success: true, message: "Todo removed" });
});

export default router;
