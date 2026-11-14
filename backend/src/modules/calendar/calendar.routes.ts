import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { requireAuth } from "../../middleware/auth.middleware";

const router = Router();

const eventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  eventType: z.string().trim().min(1).max(64).optional(),
  startTime: z.string(),
  endTime: z.string(),
  location: z.string().optional(),
  reminderAt: z.string().optional(),
});

router.post("/", requireAuth, async (req, res) => {
  const parsed = eventSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.issues } });
  }
  const { title, description, eventType, startTime, endTime, location, reminderAt } = parsed.data;

  if (new Date(startTime) >= new Date(endTime)) {
    return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Start time must be before end time" } });
  }

  const event = await prisma.event.create({
    data: {
      title,
      description,
      eventType: eventType || "PERSONAL",
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      location,
      reminderAt: reminderAt ? new Date(reminderAt) : null,
      creatorId: req.user.userId,
    },
  });
  return res.status(201).json({ success: true, data: event, message: "Event created" });
});

router.get("/", requireAuth, async (req, res) => {
  const events = await prisma.event.findMany({
    where: { creatorId: req.user.userId },
    orderBy: { startTime: "asc" },
  });
  return res.json({ success: true, data: events });
});

router.patch("/:id", requireAuth, async (req, res) => {
  const parsed = eventSchema.partial().extend({  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid update' } });

  const id = parseInt(req.params.id);
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) {
    return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Event not found" } });
  }
  if (event.creatorId !== req.user.userId) {
    return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Not authorized" } });
  }
  const { title, description, eventType, startTime, endTime, location, reminderAt } = req.body;
  if (new Date(startTime ?? event.startTime) >= new Date(endTime ?? event.endTime)) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Start time must be before end time' } });
  const updated = await prisma.event.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(eventType !== undefined && { eventType }),
      ...(startTime !== undefined && { startTime: new Date(startTime) }),
      ...(endTime !== undefined && { endTime: new Date(endTime) }),
      ...(location !== undefined && { location }),
      ...(reminderAt !== undefined && { reminderAt: reminderAt ? new Date(reminderAt) : null }),
    },
  });
  return res.json({ success: true, data: updated, message: "Event updated" });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) {
    return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Event not found" } });
  }
  if (event.creatorId !== req.user.userId) {
    return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Not authorized" } });
  }
  await prisma.event.delete({ where: { id } });
  return res.json({ success: true, message: "Event removed" });
});

export default router;
