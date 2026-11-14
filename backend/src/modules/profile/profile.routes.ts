import { z } from "zod";
import { Router } from "express";
import { prisma } from "../../config/prisma";
import { requireAuth } from "../../middleware/auth.middleware";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const profile = await prisma.profile.upsert({ where: { userId: req.user.userId }, update: {}, create: { userId: req.user.userId } });
  return res.json({ success: true, data: profile });
});

router.put("/", requireAuth, async (req, res) => {
  const schema = z.object(Object.fromEntries(['phone', 'location', 'linkedinUrl', 'githubUrl', 'portfolioUrl', 'summary', 'education', 'experience', 'achievements', 'certifications', 'languages'].map(k => [k, z.string().max(20000).nullable().optional()])));
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Profile fields must be text' } });
  for (const key of ['linkedinUrl', 'githubUrl', 'portfolioUrl']) {
    const value = parsed.data[key];
    if (value && !/^https?:\/\//i.test(value)) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Links must start with https:// or http://' } });
  }
  const {
    phone, location, linkedinUrl, githubUrl, portfolioUrl,
    summary, education, experience, achievements, certifications, languages,
  } = parsed.data;

  const profile = await prisma.profile.upsert({
    where: { userId: req.user.userId },
    update: { phone, location, linkedinUrl, githubUrl, portfolioUrl, summary, education, experience, achievements, certifications, languages },
    create: { userId: req.user.userId, phone, location, linkedinUrl, githubUrl, portfolioUrl, summary, education, experience, achievements, certifications, languages },
  });
  return res.json({ success: true, data: profile, message: "Profile updated" });
});

export default router;
