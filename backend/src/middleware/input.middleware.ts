import { Request, Response, NextFunction } from 'express';
export function validateInput(req: Request, res: Response, next: NextFunction) {
  const fail = (message: string) => res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message } });
  if (Object.keys(req.query).some(k => /[\[\]]/.test(k))) return fail('Nested queries are not supported');
  if (Object.values(req.query).some(v => typeof v !== 'string' || v.length > 1000)) return fail('Query values must be short strings');
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) return next();
  if (!req.body || Array.isArray(req.body) || typeof req.body !== 'object') return fail('Expected a JSON object');
  const numeric = new Set(['receiverId', 'teamSize', 'quantity', 'progress']);
  const dateFields = new Set(['startTime', 'endTime', 'dueDate', 'deadline', 'reminderAt']);
  for (const [key, v] of Object.entries(req.body)) {
    if (numeric.has(key)) {
      if (!Number.isSafeInteger(v) || Number(v) < (key === 'progress' ? 0 : 1) || Number(v) > (key === 'progress' ? 100 : 1000000)) return fail('Invalid number');
    } else if (key === 'keywordsToInclude') {
      if (!Array.isArray(v) || v.length > 50 || v.some(s => typeof s !== 'string' || s.length > 100)) return fail('Invalid keywords');
    } else if (v !== null && (typeof v !== 'string' || v.length > (['description','resumeText','resumeTextA','resumeTextB','jobDescription','summary','education','experience','achievements','certifications','languages'].includes(key) || key.startsWith('override') ? 20000 : ['message','content'].includes(key) ? 1000 : 255))) return fail('Invalid text field');
    if (dateFields.has(key) && v !== null && v !== '' && (typeof v !== 'string' || !Number.isFinite(Date.parse(v)))) return fail('Invalid date');
  }
  next();
}
