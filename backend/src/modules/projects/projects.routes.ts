import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { requireAuth } from "../../middleware/auth.middleware";

const router = Router();

const projectSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(10),
  category: z.string().min(1),
  requiredSkills: z.string().optional(),
  requiredRoles: z.string().optional(),
  teamSize: z.number().int().positive().optional(),
  deadline: z.string().optional(),
});

router.post("/", requireAuth, async (req, res) => {
  const parsed = projectSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.issues } });
  }
  const { title, description, category, requiredSkills, requiredRoles, teamSize, deadline } = parsed.data;
  const project = await prisma.project.create({
    data: {
      title, description, category, requiredSkills, requiredRoles,
      teamSize: teamSize || 1,
      deadline: deadline ? new Date(deadline) : null,
      ownerId: req.user.userId,
      status: "OPEN",
    },
  });
  return res.status(201).json({ success: true, data: project, message: "Project created" });
});

router.get("/", requireAuth, async (req, res) => {
  const { keyword, category, status, page = "1", limit = "20" } = req.query;
  const pageNum = Number(page);
  const limitNum = Number(limit);
  if (!Number.isSafeInteger(pageNum) || pageNum < 1 || !Number.isSafeInteger(limitNum) || limitNum < 1 || limitNum > 100) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid pagination" } });

  const where: any = {};
  if (keyword) {
    where.OR = [
      { title: { contains: keyword } },
      { description: { contains: keyword } },
    ];
  }
  if (category) where.category = category;
  if (status) where.status = status;

  const [items, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { members: true, applications: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
    prisma.project.count({ where }),
  ]);

  return res.json({
    success: true,
    data: { items, page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  });
});

router.get("/mine", requireAuth, async (req, res) => {
  const owned = await prisma.project.findMany({
    where: { ownerId: req.user.userId },
    include: { _count: { select: { members: true, applications: true } } },
    orderBy: { createdAt: "desc" },
  });
  const memberOf = await prisma.projectMember.findMany({
    where: { userId: req.user.userId },
    include: { project: { include: { owner: { select: { id: true, name: true } } } } },
  });
  return res.json({ success: true, data: { owned, memberOf } });
});

router.get("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
      milestones: { orderBy: { createdAt: "asc" } },
      applications: { include: { applicant: { select: { id: true, name: true, email: true } } } },
      comments: { include: { author: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!project) {
    return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Project not found" } });
  }
  if (project.ownerId !== req.user.userId) project.applications = [];
  return res.json({ success: true, data: project });
});

router.patch("/:id", requireAuth, async (req, res) => {
  const parsed = projectSchema.partial().extend({ status: z.enum(["DRAFT", "OPEN", "TEAM_FORMING", "ACTIVE", "COMPLETED", "ARCHIVED"]).optional() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid update' } });

  const id = parseInt(req.params.id);
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Project not found" } });
  }
  if (project.ownerId !== req.user.userId) {
    return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Only the owner can edit this project" } });
  }
  const { title, description, category, requiredSkills, requiredRoles, teamSize, deadline, status } = req.body;
  const updated = await prisma.project.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(category !== undefined && { category }),
      ...(requiredSkills !== undefined && { requiredSkills }),
      ...(requiredRoles !== undefined && { requiredRoles }),
      ...(teamSize !== undefined && { teamSize }),
      ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
      ...(status !== undefined && { status }),
    },
  });
  return res.json({ success: true, data: updated, message: "Project updated" });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Project not found" } });
  }
  if (project.ownerId !== req.user.userId) {
    return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Only the owner can delete this project" } });
  }
  await prisma.$transaction([
    prisma.projectComment.deleteMany({ where: { projectId: id } }),
    prisma.projectMilestone.deleteMany({ where: { projectId: id } }),
    prisma.projectMember.deleteMany({ where: { projectId: id } }),
    prisma.projectApplication.deleteMany({ where: { projectId: id } }),
    prisma.project.delete({ where: { id } }),
  ]);
  return res.json({ success: true, message: "Project deleted" });
});
router.get("/:id/suggested-collaborators", requireAuth, async (req, res) => {
  const projectId = parseInt(req.params.id);
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Project not found" } });
  }
  if (project.ownerId !== req.user.userId) {
    return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Only the owner can view suggestions" } });
  }
  if (!project.requiredSkills) {
    return res.json({ success: true, data: [] });
  }

  const requiredSkillNames = project.requiredSkills
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const existingMemberIds = (await prisma.projectMember.findMany({ where: { projectId } })).map((m) => m.userId);
  const excludeIds = [project.ownerId, ...existingMemberIds];

  const offeredSkills = await prisma.userSkill.findMany({
    where: { type: "OFFERED", userId: { notIn: excludeIds } },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  const byUser: Record<number, { user: { id: number; name: string; email: string }; matchedSkills: string[] }> = {};
  for (const skill of offeredSkills) {
    const skillLower = skill.skillName.toLowerCase();
    const matched = requiredSkillNames.find((req) => skillLower.includes(req) || req.includes(skillLower));
    if (matched) {
      const uid = skill.userId;
      if (!byUser[uid]) {
        byUser[uid] = { user: skill.user, matchedSkills: [] };
      }
      if (!byUser[uid].matchedSkills.includes(skill.skillName)) {
        byUser[uid].matchedSkills.push(skill.skillName);
      }
    }
  }

  const suggestions = Object.values(byUser)
    .map((entry) => ({
      ...entry,
      score: Math.round((entry.matchedSkills.length / requiredSkillNames.length) * 100),
    }))
    .sort((a, b) => b.score - a.score);

  return res.json({ success: true, data: suggestions });
});
router.post("/:id/apply", requireAuth, async (req, res) => {
  const projectId = parseInt(req.params.id);
  const { message } = req.body;

  const project = await prisma.project.findUnique({ where: { id: projectId }, include: { _count: { select: { members: true } } } });
  if (!project) {
    return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Project not found" } });
  }
  if (project.ownerId === req.user.userId) {
    return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "You cannot apply to your own project" } });
  }
  if (project.status !== "OPEN" && project.status !== "TEAM_FORMING") {
    return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "This project is not accepting applications" } });
  }
  const existing = await prisma.projectApplication.findFirst({
    where: { projectId, applicantId: req.user.userId, status: "PENDING" },
  });
  if (existing) {
    return res.status(409).json({ success: false, error: { code: "DUPLICATE_RESOURCE", message: "You already applied to this project" } });
  }
  const application = await prisma.projectApplication.create({
    data: { projectId, applicantId: req.user.userId, message },
  });
  return res.status(201).json({ success: true, data: application, message: "Application submitted" });
});

router.patch("/:id/applications/:appId", requireAuth, async (req, res) => {
  const projectId = parseInt(req.params.id);
  const appId = parseInt(req.params.appId);
  const { status } = req.body;

  if (!["ACCEPTED", "REJECTED"].includes(status)) {
    return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid status" } });
  }

  const project = await prisma.project.findUnique({ where: { id: projectId }, include: { _count: { select: { members: true } } } });
  if (!project) {
    return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Project not found" } });
  }
  if (project.ownerId !== req.user.userId) {
    return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Only the owner can review applications" } });
  }

  const application = await prisma.projectApplication.findUnique({ where: { id: appId } });
  if (!application || application.projectId !== projectId) {
    return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Application not found" } });
  }

  if (application.status !== 'PENDING') return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'Application already reviewed' } });
  if (status === "ACCEPTED") {
    if (project._count.members >= project.teamSize) {
      return res.status(409).json({ success: false, error: { code: "PROJECT_FULL", message: "Team is already at capacity" } });
    }
    await prisma.$transaction(async tx => {
      const current = await tx.project.findUnique({ where: { id: projectId }, include: { _count: { select: { members: true } } } });
      const pending = await tx.projectApplication.findUnique({ where: { id: appId } });
      const member = await tx.projectMember.findFirst({ where: { projectId, userId: application.applicantId } });
      if (!current || current._count.members >= current.teamSize || pending?.status !== 'PENDING' || member) throw Object.assign(new Error('Conflict'), { code: 'P2034' });
      await tx.projectApplication.update({ where: { id: appId }, data: { status: 'ACCEPTED' } });
      await tx.projectMember.create({ data: { projectId, userId: application.applicantId } });
    }, { isolationLevel: 'Serializable' });
  } else {
    await prisma.projectApplication.update({ where: { id: appId }, data: { status: "REJECTED" } });
  }

  return res.json({ success: true, message: `Application ${status.toLowerCase()}` });
});

router.post("/:id/milestones", requireAuth, async (req, res) => {
  const projectId = parseInt(req.params.id);
  const { title, description, dueDate } = req.body;
  if (!title) {
    return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Title is required" } });
  }
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Project not found" } });
  }
  if (project.ownerId !== req.user.userId) {
    return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Only the owner can add milestones" } });
  }
  const milestone = await prisma.projectMilestone.create({
    data: { projectId, title, description, dueDate: dueDate ? new Date(dueDate) : null },
  });
  return res.status(201).json({ success: true, data: milestone, message: "Milestone added" });
});

router.patch("/milestones/:milestoneId", requireAuth, async (req, res) => {
  const milestoneId = parseInt(req.params.milestoneId);
  const { status, progress } = req.body;
  if (status !== undefined && !['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'].includes(status)) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid milestone status' } });
  if (progress !== undefined && (progress < 0 || progress > 100)) {
    return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Progress must be 0-100" } });
  }
  const milestone = await prisma.projectMilestone.findUnique({ where: { id: milestoneId }, include: { project: true } });
  if (!milestone) {
    return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Milestone not found" } });
  }
  const isMember = await prisma.projectMember.findFirst({ where: { projectId: milestone.projectId, userId: req.user.userId } });
  if (milestone.project.ownerId !== req.user.userId && !isMember) {
    return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Not authorized" } });
  }
  const updated = await prisma.projectMilestone.update({
    where: { id: milestoneId },
    data: {
      ...(status !== undefined && { status }),
      ...(progress !== undefined && { progress }),
    },
  });
  return res.json({ success: true, data: updated, message: "Milestone updated" });
});

router.post("/:id/comments", requireAuth, async (req, res) => {
  const projectId = parseInt(req.params.id);
  const { content } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Comment cannot be empty" } });
  }
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Project not found" } });
  }
  const isMember = await prisma.projectMember.findFirst({ where: { projectId, userId: req.user.userId } });
  if (project.ownerId !== req.user.userId && !isMember) {
    return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Only project members can comment" } });
  }
  const comment = await prisma.projectComment.create({
    data: { projectId, authorId: req.user.userId, content: content.trim() },
  });
  return res.status(201).json({ success: true, data: comment, message: "Comment added" });
});

export default router;
