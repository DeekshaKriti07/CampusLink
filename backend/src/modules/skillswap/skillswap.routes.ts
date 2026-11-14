import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { requireAuth } from "../../middleware/auth.middleware";

const router = Router();

const addSkillSchema = z.object({
  skillName: z.string().min(2),
  category: z.string().min(2),
  type: z.enum(["OFFERED", "WANTED"]),
  proficiency: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]).optional(),
  description: z.string().optional(),
});

router.post("/skills", requireAuth, async (req, res) => {
  const parsed = addSkillSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.issues },
    });
  }
  const { skillName, category, type, proficiency, description } = parsed.data;
  const skill = await prisma.userSkill.create({
    data: { skillName, category, type, proficiency: proficiency || "BEGINNER", description, userId: req.user.userId },
  });
  return res.status(201).json({ success: true, data: skill, message: "Skill added" });
});

router.get("/skills/mine", requireAuth, async (req, res) => {
  const skills = await prisma.userSkill.findMany({
    where: { userId: req.user.userId },
    orderBy: { createdAt: "desc" },
  });
  return res.json({ success: true, data: skills });
});

router.get("/skills", requireAuth, async (req, res) => {
  const skills = await prisma.userSkill.findMany({
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
  return res.json({ success: true, data: skills });
});

// MATCHING: find users whose OFFERED skills match my WANTED skills, and vice versa
router.get("/matches", requireAuth, async (req, res) => {
  const myUserId = req.user.userId;

  const mySkills = await prisma.userSkill.findMany({ where: { userId: myUserId } });
  const myOffered = mySkills.filter((s) => s.type === "OFFERED").map((s) => s.skillName.toLowerCase());
  const myWanted = mySkills.filter((s) => s.type === "WANTED").map((s) => s.skillName.toLowerCase());

  const otherSkills = await prisma.userSkill.findMany({
    where: { userId: { not: myUserId } },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  const scoresByUser: Record<number, { user: { id: number; name: string; email: string }; score: number; reasons: string[] }> = {};

  for (const skill of otherSkills) {
    const uid = skill.userId;
    if (!scoresByUser[uid]) {
      scoresByUser[uid] = { user: skill.user, score: 0, reasons: [] };
    }
    const name = skill.skillName.toLowerCase();

    // Mutual: they offer what I want, and let's check if I offer what they want too
    if (skill.type === "OFFERED" && myWanted.includes(name)) {
      scoresByUser[uid].score += 30;
      scoresByUser[uid].reasons.push(`They offer ${skill.skillName}, which you want`);
    }
    if (skill.type === "WANTED" && myOffered.includes(name)) {
      scoresByUser[uid].score += 30;
      scoresByUser[uid].reasons.push(`They want ${skill.skillName}, which you offer`);
    }
  }

  // Boost mutual matches (both directions matched) to reflect "50 points" mutual bonus
  for (const uid in scoresByUser) {
    if (scoresByUser[uid].score >= 60) {
      scoresByUser[uid].score = 100;
    } else if (scoresByUser[uid].score >= 30) {
      scoresByUser[uid].score = Math.min(scoresByUser[uid].score + 20, 90);
    }
  }

  const matches = Object.values(scoresByUser)
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score);

  return res.json({ success: true, data: matches });
});

const requestSchema = z.object({
  receiverId: z.number(),
  message: z.string().optional(),
});

router.post("/requests", requireAuth, async (req, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Invalid input" },
    });
  }
  const { receiverId, message } = parsed.data;

  if (receiverId === req.user.userId) {
    return res.status(400).json({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "You cannot send a request to yourself" },
    });
  }

  const existing = await prisma.skillRequest.findFirst({
    where: { requesterId: req.user.userId, receiverId, status: "PENDING" },
  });
  if (existing) {
    return res.status(409).json({
      success: false,
      error: { code: "DUPLICATE_RESOURCE", message: "You already have a pending request with this user" },
    });
  }

  const request = await prisma.skillRequest.create({
    data: { requesterId: req.user.userId, receiverId, message },
  });

  return res.status(201).json({ success: true, data: request, message: "Request sent" });
});

router.get("/requests", requireAuth, async (req, res) => {
  const requests = await prisma.skillRequest.findMany({
    where: {
      OR: [{ requesterId: req.user.userId }, { receiverId: req.user.userId }],
    },
    include: {
      requester: { select: { id: true, name: true, email: true } },
      receiver: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return res.json({ success: true, data: requests });
});

router.patch("/requests/:id", requireAuth, async (req, res) => {
  const requestId = parseInt(req.params.id);
  const { status } = req.body;

  if (!["ACCEPTED", "REJECTED", "COMPLETED"].includes(status)) {
    return res.status(400).json({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Invalid status" },
    });
  }

  const request = await prisma.skillRequest.findUnique({ where: { id: requestId } });
  if (!request) {
    return res.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "Request not found" },
    });
  }

  if (request.receiverId !== req.user.userId && request.requesterId !== req.user.userId) {
    return res.status(403).json({
      success: false,
      error: { code: "FORBIDDEN", message: "Not authorized to update this request" },
    });
  }

  if ((status === 'ACCEPTED' || status === 'REJECTED') && (request.receiverId !== req.user.userId || request.status !== 'PENDING')) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only the receiver can answer a pending request' } });
  if (status === 'COMPLETED' && request.status !== 'ACCEPTED') return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'Only accepted requests can be completed' } });
  const updated = await prisma.skillRequest.update({
    where: { id: requestId },
    data: { status },
  });

  return res.json({ success: true, data: updated, message: `Request ${status.toLowerCase()}` });
});

router.delete("/skills/:id", requireAuth, async (req, res) => {
  const skillId = parseInt(req.params.id);
  const skill = await prisma.userSkill.findUnique({ where: { id: skillId } });
  if (!skill) {
    return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Skill not found" } });
  }
  if (skill.userId !== req.user.userId) {
    return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Not authorized to delete this skill" } });
  }
  await prisma.userSkill.delete({ where: { id: skillId } });
  return res.json({ success: true, message: "Skill removed" });
});

export default router;