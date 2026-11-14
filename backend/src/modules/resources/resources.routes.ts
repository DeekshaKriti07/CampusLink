import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { requireAuth } from "../../middleware/auth.middleware";

const router = Router();

const resourceSchema = z.object({
  name: z.string().min(2),
  type: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  quantity: z.number().int().positive().optional(),
  condition: z.string().optional(),
  approvalMode: z.enum(["AUTO_APPROVED", "ADMIN_APPROVAL_REQUIRED"]).optional(),
});

router.post("/", requireAuth, async (req, res) => {
  const parsed = resourceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.issues } });
  }
  const { name, type, description, location, quantity, condition, approvalMode } = parsed.data;
  const resource = await prisma.resource.create({
    data: {
      name, type, description, location,
      quantity: quantity || 1,
      condition,
      approvalMode: approvalMode || "AUTO_APPROVED",
      ownerId: req.user.userId,
    },
  });
  return res.status(201).json({ success: true, data: resource, message: "Resource created" });
});

router.get("/", requireAuth, async (req, res) => {
  const { type, location, keyword, page = "1", limit = "20" } = req.query;
  const pageNum = Number(page);
  const limitNum = Number(limit);
  if (!Number.isSafeInteger(pageNum) || pageNum < 1 || !Number.isSafeInteger(limitNum) || limitNum < 1 || limitNum > 100) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid pagination" } });

  const where: any = {};
  if (type) where.type = type;
  if (location) where.location = { contains: location };
  if (keyword) where.name = { contains: keyword };

  const [items, total] = await Promise.all([
    prisma.resource.findMany({
      where,
      include: { owner: { select: { id: true, name: true } }, _count: { select: { bookings: true } } },
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
    prisma.resource.count({ where }),
  ]);

  return res.json({ success: true, data: { items, page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } });
});

router.get("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const resource = await prisma.resource.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true } },
      bookings: {
        where: { status: { in: ["PENDING", "APPROVED"] } },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { startTime: "asc" },
      },
    },
  });
  if (!resource) {
    return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Resource not found" } });
  }
  return res.json({ success: true, data: resource });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const resource = await prisma.resource.findUnique({ where: { id } });
  if (!resource) {
    return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Resource not found" } });
  }
  if (resource.ownerId !== req.user.userId) {
    return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Only the owner can delete this resource" } });
  }
  await prisma.resourceBooking.deleteMany({ where: { resourceId: id } });
  await prisma.resource.delete({ where: { id } });
  return res.json({ success: true, message: "Resource deleted" });
});

const bookingSchema = z.object({
  startTime: z.string(),
  endTime: z.string(),
  purpose: z.string().optional(),
});

router.post("/:id/bookings", requireAuth, async (req, res) => {
  const resourceId = parseInt(req.params.id);
  const parsed = bookingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input" } });
  }
  const { startTime, endTime, purpose } = parsed.data;
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (start >= end) {
    return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Start time must be before end time" } });
  }
  if (start < new Date()) {
    return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Cannot book in the past" } });
  }

  const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
  if (!resource) {
    return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Resource not found" } });
  }

  try {
    const booking = await prisma.$transaction(async (tx) => {
      const conflict = await tx.resourceBooking.findFirst({
        where: {
          resourceId,
          status: { in: ["PENDING", "APPROVED"] },
          startTime: { lt: end },
          endTime: { gt: start },
        },
      });
      if (conflict) {
        throw new Error("BOOKING_CONFLICT");
      }
      const initialStatus = resource.approvalMode === "AUTO_APPROVED" ? "APPROVED" : "PENDING";
      return tx.resourceBooking.create({
        data: { resourceId, userId: req.user.userId, startTime: start, endTime: end, purpose, status: initialStatus },
      });
    }, { isolationLevel: 'Serializable' });
    return res.status(201).json({ success: true, data: booking, message: "Booking created" });
  } catch (err) {
    if (err.message === "BOOKING_CONFLICT") {
      return res.status(409).json({ success: false, error: { code: "BOOKING_CONFLICT", message: "This resource is already booked for the requested time" } });
    }
    throw err;
  }
});

router.get("/:id/bookings/mine", requireAuth, async (req, res) => {
  const bookings = await prisma.resourceBooking.findMany({
    where: { userId: req.user.userId },
    include: { resource: { select: { id: true, name: true, type: true } } },
    orderBy: { startTime: "desc" },
  });
  return res.json({ success: true, data: bookings });
});

router.patch("/bookings/:bookingId", requireAuth, async (req, res) => {
  const bookingId = parseInt(req.params.bookingId);
  const { status } = req.body;
  const booking = await prisma.resourceBooking.findUnique({ where: { id: bookingId }, include: { resource: true } });
  if (!booking) {
    return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Booking not found" } });
  }
  const isOwnerOfResource = booking.resource.ownerId === req.user.userId;
  const isBookingUser = booking.userId === req.user.userId;

  if (status === "CANCELLED") {
    if (!isBookingUser) {
      return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Only the booker can cancel" } });
    }
  } else if (["APPROVED", "REJECTED"].includes(status)) {
    if (!isOwnerOfResource) {
      return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Only the resource owner can approve or reject" } });
    }
  } else {
    return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid status" } });
  }

  if (booking.status !== 'PENDING' && status !== 'CANCELLED') return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'Booking already reviewed' } });
  if (['CANCELLED', 'COMPLETED', 'REJECTED'].includes(booking.status)) return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'Booking is closed' } });
  const updated = await prisma.resourceBooking.update({ where: { id: bookingId }, data: { status } });
  return res.json({ success: true, data: updated, message: `Booking ${status.toLowerCase()}` });
});

router.get("/mine/owned", requireAuth, async (req, res) => {
  const resources = await prisma.resource.findMany({
    where: { ownerId: req.user.userId },
    include: { _count: { select: { bookings: true } } },
    orderBy: { createdAt: "desc" },
  });
  return res.json({ success: true, data: resources });
});

export default router;
