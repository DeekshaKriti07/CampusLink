import 'dotenv/config';
import { generateText, aiProvider } from '../src/services/ai.service';
import { parseResume } from '../src/services/ollama.service';
async function main() {
  const provider = aiProvider();
  if (provider === 'ollama') {
    const base = (process.env.OLLAMA_BASE_URL || 'http://localhost:11434').replace(/\/$/, '');
    const model = process.env.OLLAMA_MODEL || 'llama3.2';
    const headers = process.env.OLLAMA_API_KEY ? { Authorization: `Bearer ${process.env.OLLAMA_API_KEY}` } : {};
    const r = await fetch(`${base}/api/tags`, { headers, signal: AbortSignal.timeout(10000) });
    if (!r.ok) throw new Error('Model service is unavailable');
    const tags = await r.json() as { models?: { name: string }[] };
    if (!tags.models?.some(m => m.name === model || m.name === `${model}:latest`)) throw new Error('Configured model is not installed');
  }
  const out = parseResume(await generateText('Return a JSON object for a resume with name "Test Student", email "student@example.com", skills ["React"]. Include no fabricated experience. Fields: name, email, skills, experience (array), projects (array), education (array).', true));
  if (out.name !== 'Test Student' || out.email !== 'student@example.com' || !out.skills.includes('React') || out.experience.length || out.projects.length) throw new Error('Model smoke check failed. Review output before deployment.');
  console.log(`PASS: ${provider} reachable, valid JSON, supplied facts preserved in this sample. Human quality review is still required.`);
}
main().catch(err => { console.error('AI CHECK FAILED:', err.message); process.exitCode = 1; });
