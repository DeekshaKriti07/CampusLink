import { z } from 'zod';
// Compatibility export for existing imports and local Ollama users.
export { generateText as askOllama } from './ai.service';
const text = z.string().max(20000).default('');
export const resumeSchema = z.object({
  name: text, title: text, phone: text, email: text, location: text, linkedin: text, github: text, summary: text,
  education: z.array(z.object({ school: text, years: text, degree: text, details: text })).max(50).default([]),
  experience: z.array(z.object({ company: text, years: text, role: text, bullets: z.array(text).max(30).default([]) })).max(50).default([]),
  projects: z.array(z.object({ title: text, tech: text, bullets: z.array(text).max(30).default([]) })).max(50).default([]),
  skills: z.array(text).max(200).default([]), certifications: z.array(text).max(100).default([]),
  achievements: z.array(text).max(100).default([]), languages: z.array(text).max(100).default([]),
});
export function parseResume(raw: string) { const result = resumeSchema.parse(JSON.parse(raw)); if (!result.name && !result.summary && !result.skills.length && !result.experience.length && !result.projects.length && !result.education.length) throw new Error('AI_EMPTY_RESUME'); return result; }

const STOPWORDS = new Set([
  "a","an","the","and","or","but","in","on","at","to","for","of","with","by",
  "is","are","was","were","be","been","being","have","has","had","do","does",
  "did","will","would","should","could","may","might","must","can","this",
  "that","these","those","i","you","he","she","it","we","they","as","from",
  "into","about","than","then","so","if","not","no","up","out","over","under",
  "again","further","once","here","there","when","where","why","how","all",
  "each","other","some","such","only","own","same","too","very","just","our",
  "your","their","its"
]);

export function extractKeywords(text, limit = 25) {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9+.# ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));

  const freq: Record<string, number> = {};
  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

export function scoreAts(resumeText, jobDescription) {
  const keywords = extractKeywords(jobDescription, 25);
  const resumeLower = new Set(resumeText.toLowerCase().replace(/[^a-z0-9+.# ]/g, " ").split(/\s+/));
  const present = keywords.filter((k) => resumeLower.has(k));
  const missing = keywords.filter((k) => !resumeLower.has(k));
  const score = keywords.length > 0 ? Math.round((present.length / keywords.length) * 100) : 0;
  return { score, matchedKeywords: present, missingKeywords: missing, totalKeywords: keywords.length };
}
