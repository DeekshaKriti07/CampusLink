import 'dotenv/config';
import { askOllama, parseResume } from '../src/services/ollama.service';
async function main() {
  const base = (process.env.OLLAMA_BASE_URL || 'http://localhost:11434').replace(/\/$/, '');
  const model = process.env.OLLAMA_MODEL || 'llama3.2';
  const headers = process.env.OLLAMA_API_KEY ? { Authorization: `Bearer ${process.env.OLLAMA_API_KEY}` } : {};
  const r = await fetch(`${base}/api/tags`, { headers, signal: AbortSignal.timeout(10000) });
  if (!r.ok) throw new Error('Model service is unavailable');
  const tags = await r.json() as { models?: { name: string }[] };
  if (!tags.models?.some(m => m.name === model || m.name === `${model}:latest`)) throw new Error(`Configured model ${model} is not installed; pull it on the model server first.`);
  const out = parseResume(await askOllama('Return JSON for a resume with name "Test Student", email "student@example.com", skills ["React"]. Include no fabricated experience. Fields: name, email, skills, experience (array), projects (array), education (array).', true));
  if (out.name !== 'Test Student' || !out.skills.includes('React') || out.experience.length || out.projects.length) throw new Error('Model smoke check failed; inspect model output before deployment.');
  console.log('PASS: model reachable, installed, generates valid JSON, preserves supplied facts in this smoke sample. Human quality review is still required.');
}
main().catch(err => { console.error('AI CHECK FAILED:', err.message); process.exitCode = 1; });
