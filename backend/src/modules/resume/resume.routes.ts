import { Router } from "express";
import { prisma } from "../../config/prisma";
import { requireAuth } from "../../middleware/auth.middleware";
import { askOllama, scoreAts, parseResume } from "../../services/ollama.service";

const router = Router();
// Validate all resume inputs before string processing or model calls.
router.use((req, res, next) => {
  if (req.method !== 'POST') return next();
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Expected an object' } });
  for (const [key, value] of Object.entries(req.body)) {
    if (key === 'keywordsToInclude') {
      if (!Array.isArray(value) || value.length > 50 || value.some(v => typeof v !== 'string' || v.length > 100)) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid keywords' } });
    } else if (typeof value !== 'string' || value.length > 20000) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Fields must be text of at most 20000 characters' } });
  }
  next();
});

const RESUME_SHAPE = `{
  "name": string,
  "title": string,
  "phone": string,
  "email": string,
  "location": string,
  "linkedin": string,
  "github": string,
  "summary": string,
  "education": [{ "school": string, "years": string, "degree": string, "details": string }],
  "experience": [{ "company": string, "years": string, "role": string, "bullets": [string] }],
  "projects": [{ "title": string, "tech": string, "bullets": [string] }],
  "skills": [string],
  "certifications": [string],
  "achievements": [string],
  "languages": [string]
}`;

const BULLET_STYLE_GUIDE = `Write "bullets" the way top tech companies (Google, Amazon, Meta) expect: each bullet starts with a strong past-tense action verb, states what you did, and quantifies the result or scale only when explicitly provided in the source; never invent metrics (e.g. "Built a REST API serving 500+ students, reducing manual matching time by 80%"). Keep each bullet to one line, no filler words, no first-person pronouns. 2-4 bullets per experience/project entry, not full paragraphs.`;

// FEATURE 1: Generate a resume from the user's SkillSwap skills + projects
router.post("/generate", requireAuth, async (req, res) => {
  const userId = req.user.userId;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const skills = await prisma.userSkill.findMany({ where: { userId, type: "OFFERED" } });
  const owned = await prisma.project.findMany({ where: { ownerId: userId } });
  const memberOf = await prisma.projectMember.findMany({ where: { userId }, include: { project: true } });
  const profile = await prisma.profile.findUnique({ where: { userId } });

  const allProjects = [...owned, ...memberOf.map((m) => m.project)];
  const skillsList = skills.map((s) => s.skillName).join(", ") || "";
  const projectsList = allProjects.map((p) => `${p.title}: ${p.description}`).join("\n") || "";

  const {
    jobDescription, overridePhone, overrideLocation, overrideLinkedin, overrideGithub,
    overrideSummary, overrideEducation, overrideExperience, overrideAchievements,
    overrideCertifications, overrideLanguages, keywordsToInclude,
  } = req.body;

  const phone = overridePhone ?? profile?.phone ?? "";
  const location = overrideLocation ?? profile?.location ?? "";
  const linkedin = overrideLinkedin ?? profile?.linkedinUrl ?? "";
  const github = overrideGithub ?? profile?.githubUrl ?? "";
  const summary = overrideSummary ?? profile?.summary ?? "";
  const education = overrideEducation ?? profile?.education ?? "";
  const experience = overrideExperience ?? profile?.experience ?? "";
  const achievements = overrideAchievements ?? profile?.achievements ?? "";
  const certifications = overrideCertifications ?? profile?.certifications ?? "";
  const languages = overrideLanguages ?? profile?.languages ?? "";

  const keywordLine = keywordsToInclude && keywordsToInclude.length
    ? `\n\nIMPORTANT: naturally and truthfully incorporate these keywords somewhere in the resume (skills, summary, or experience) if they plausibly fit this person's background: ${keywordsToInclude.join(", ")}.`
    : "";

  const prompt = `You are an expert resume writer who has written resumes for engineers at top tech companies. Based on the information below, output a resume as STRICT JSON ONLY — no markdown fences, no explanation, no preamble, just a single valid JSON object matching this exact shape:

${RESUME_SHAPE}

Omit array items with no real data (empty arrays are fine). Do not invent facts not given below. ${BULLET_STYLE_GUIDE}

Name: ${user.name}
Email: ${user.email}
Phone: ${phone || "not provided"}
Location: ${location || "not provided"}
LinkedIn: ${linkedin || "not provided"}
GitHub: ${github || "not provided"}
Summary hint: ${summary || "none, write a brief one based on skills"}
Skills: ${skillsList || "none listed"}
Experience: ${experience || "none"}
Projects: ${projectsList || "none"}
Education: ${education || "not provided"}
Certifications: ${certifications || "none"}
Achievements: ${achievements || "none"}
Languages: ${languages || "not specified"}${keywordLine}`;

  let rawOutput;
  try {
    rawOutput = await askOllama(prompt, true);
  } catch (err) {
    return res.status(503).json({ success: false, error: { code: "AI_UNAVAILABLE", message: "AI service unavailable or busy. Please try again later." } });
  }

  let structured;
  try { structured = parseResume(rawOutput); }
  catch { return res.status(502).json({ success: false, error: { code: 'AI_INVALID_RESPONSE', message: 'AI returned an invalid resume. Please try again.' } }); }

  structured.name = user.name;
  structured.email = user.email;
  const flattenedText = JSON.stringify(structured);

  let atsResult = { score: null, matchedKeywords: [], missingKeywords: [] };
  if (jobDescription) {
    atsResult = scoreAts(flattenedText, jobDescription);
  }

  const resume = await prisma.resume.create({
    data: {
      title: `${user.name} - Generated Resume`,
      resumeText: flattenedText,
      jobDescription: jobDescription || null,
      atsScore: atsResult.score,
      missingKeywords: atsResult.missingKeywords.join(", ") || null,
      userId,
    },
  });

  return res.status(201).json({ success: true, data: { ...resume, resumeStructured: structured, atsDetail: atsResult } });
});

// Structure raw resume text into the template format (no AI facts invented, just reformatted)
router.post("/structure", requireAuth, async (req, res) => {
  const { resumeText, keywordsToInclude } = req.body;
  if (!resumeText) {
    return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Resume text is required" } });
  }

  const keywordLine = keywordsToInclude && keywordsToInclude.length
    ? `\n\nIMPORTANT: naturally and truthfully incorporate these keywords somewhere if they plausibly fit this person's real background (do not fabricate experience): ${keywordsToInclude.join(", ")}.`
    : "";

  const prompt = `You are an expert resume formatter who has formatted resumes for engineers at top tech companies. Take the raw resume text below and reorganize it into STRICT JSON ONLY (no markdown fences, no explanation) matching this exact shape:

${RESUME_SHAPE}

Do not invent facts that are not present in the raw text below. Only reorganize, clean up wording, and rewrite loose sentences as bullets. Omit fields with no data (empty arrays are fine). ${BULLET_STYLE_GUIDE}${keywordLine}

RAW RESUME TEXT:
${resumeText}`;

  let rawOutput;
  try {
    rawOutput = await askOllama(prompt, true);
  } catch (err) {
    return res.status(503).json({ success: false, error: { code: "AI_UNAVAILABLE", message: "AI service unavailable or busy. Please try again later." } });
  }

  let structured;
  try {
    structured = parseResume(rawOutput);
  } catch {
    return res.status(500).json({ success: false, error: { code: "PARSE_ERROR", message: "Could not structure the resume. Try again." } });
  }

  return res.json({ success: true, data: { resumeStructured: structured } });
});

// Quick re-score only (no AI call) - for instant feedback while editing
router.post("/score", requireAuth, async (req, res) => {
  const { resumeText, jobDescription } = req.body;
  if (!resumeText || !jobDescription) {
    return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Resume text and job description are required" } });
  }
  const atsResult = scoreAts(resumeText, jobDescription);
  return res.json({ success: true, data: atsResult });
});

// FEATURE 2: Upload resume text + job description, get ATS score and suggestions
router.post("/check", requireAuth, async (req, res) => {
  const { resumeText, jobDescription, title } = req.body;
  if (!resumeText || !jobDescription) {
    return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Resume text and job description are required" } });
  }

  const atsResult = scoreAts(resumeText, jobDescription);

  let suggestions = "";
  try {
    const prompt = `You are an ATS resume reviewer. Given this resume and job description, give 3-5 short, specific, actionable bullet-point suggestions to improve the resume ATS score and match for this job. Focus on missing keywords: ${atsResult.missingKeywords.join(", ")}.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Output only the bullet points, no preamble.`;
    suggestions = await askOllama(prompt);
  } catch (err) {
    suggestions = "AI suggestions unavailable (Ollama not reachable). Missing keywords are listed above — try incorporating them naturally into your resume.";
  }

  const resume = await prisma.resume.create({
    data: {
      title: title || "Uploaded Resume Check",
      resumeText,
      jobDescription,
      atsScore: atsResult.score,
      missingKeywords: atsResult.missingKeywords.join(", "),
      suggestions,
      userId: req.user.userId,
    },
  });

  return res.status(201).json({ success: true, data: { ...resume, atsDetail: atsResult } });
});

// FEATURE 3: Compare two resumes against the same job description
router.post("/compare", requireAuth, async (req, res) => {
  const { resumeTextA, resumeTextB, jobDescription } = req.body;
  if (!resumeTextA || !resumeTextB || !jobDescription) {
    return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Both resumes and a job description are required" } });
  }

  const resultA = scoreAts(resumeTextA, jobDescription);
  const resultB = scoreAts(resumeTextB, jobDescription);

  const onlyInA = resultA.matchedKeywords.filter((k) => !resultB.matchedKeywords.includes(k));
  const onlyInB = resultB.matchedKeywords.filter((k) => !resultA.matchedKeywords.includes(k));

  return res.json({
    success: true,
    data: {
      resumeA: { score: resultA.score, matchedKeywords: resultA.matchedKeywords, missingKeywords: resultA.missingKeywords, uniqueStrengths: onlyInA },
      resumeB: { score: resultB.score, matchedKeywords: resultB.matchedKeywords, missingKeywords: resultB.missingKeywords, uniqueStrengths: onlyInB },
      winner: resultA.score === resultB.score ? "tie" : resultA.score > resultB.score ? "A" : "B",
    },
  });
});

router.get("/", requireAuth, async (req, res) => {
  const resumes = await prisma.resume.findMany({
    where: { userId: req.user.userId },
    orderBy: { createdAt: "desc" },
  });
  return res.json({ success: true, data: resumes });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const resume = await prisma.resume.findUnique({ where: { id } });
  if (!resume) {
    return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Resume not found" } });
  }
  if (resume.userId !== req.user.userId) {
    return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Not authorized" } });
  }
  await prisma.resume.delete({ where: { id } });
  return res.json({ success: true, message: "Resume removed" });
});

export default router;