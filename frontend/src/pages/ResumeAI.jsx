import { useState } from 'react';
import api from '../services/api';
import { useApp, authHeaders } from '../context';
import PageHead from '../components/PageHead';
function DownloadMenu({ structured }) {
  const [open, setOpen] = useState(false);

  function downloadPdf() {
    setOpen(false);
    window.print();
  }

  async function downloadImage() {
    setOpen(false);
    const el = document.getElementById('resume-print-area');
    if (!el) return;
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff' });
    const link = document.createElement('a');
    link.download = `${(structured?.name || 'resume').replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  function downloadText() {
    setOpen(false);
    if (!structured) return;
    const lines = [];
    lines.push(structured.name || '');
    if (structured.title) lines.push(structured.title);
    const contact = [structured.phone, structured.email, structured.location, structured.linkedin, structured.github].filter(Boolean).join(' | ');
    if (contact) lines.push(contact);
    lines.push('');
    if (structured.summary) { lines.push('SUMMARY'); lines.push(structured.summary); lines.push(''); }
    if (structured.education?.length) {
      lines.push('EDUCATION');
      structured.education.forEach((e) => { lines.push(`${e.school} | ${e.years}`); if (e.degree) lines.push(e.degree); if (e.details) lines.push(e.details); });
      lines.push('');
    }
    if (structured.experience?.length) {
      lines.push('WORK EXPERIENCE');
      structured.experience.forEach((e) => {
        lines.push(`${e.company} | ${e.years}`);
        if (e.role) lines.push(e.role);
        (e.bullets || []).forEach((b) => lines.push(`- ${b}`));
      });
      lines.push('');
    }
    if (structured.projects?.length) {
      lines.push('PROJECTS');
      structured.projects.forEach((p) => {
        lines.push(p.tech ? `${p.title} | ${p.tech}` : p.title);
        (p.bullets || []).forEach((b) => lines.push(`- ${b}`));
      });
      lines.push('');
    }
    if (structured.skills?.length) { lines.push('SKILLS'); lines.push(structured.skills.join(', ')); lines.push(''); }
    if (structured.certifications?.length) { lines.push('CERTIFICATIONS'); structured.certifications.forEach((c) => lines.push(`- ${c}`)); lines.push(''); }
    if (structured.achievements?.length) { lines.push('ACHIEVEMENTS'); structured.achievements.forEach((a) => lines.push(`- ${a}`)); lines.push(''); }
    if (structured.languages?.length) { lines.push('LANGUAGES'); lines.push(structured.languages.join(', ')); }

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const link = document.createElement('a');
    link.download = `${(structured.name || 'resume').replace(/\s+/g, '_')}.txt`;
    link.href = URL.createObjectURL(blob);
    link.click();
  }

  return (
    <div style={{ position: 'relative' }} className="cl-no-print">
      <button className="cl-mini-btn" onClick={() => setOpen(!open)}>Download ▾</button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: '110%', background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, overflow: 'hidden', zIndex: 20, minWidth: 140 }}>
          <button onClick={downloadPdf} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', fontSize: 13, border: 'none', background: 'none', cursor: 'pointer', color: 'hsl(var(--foreground))' }}>As PDF</button>
          <button onClick={downloadImage} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', fontSize: 13, border: 'none', background: 'none', cursor: 'pointer', color: 'hsl(var(--foreground))' }}>As Image (PNG)</button>
          <button onClick={downloadText} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', fontSize: 13, border: 'none', background: 'none', cursor: 'pointer', color: 'hsl(var(--foreground))' }}>As Text (.txt)</button>
        </div>
      )}
    </div>
  );
}
function ResumeTemplate({ data }) {
  if (!data) return null;
  return (
    <div id="resume-print-area" className="cl-resume-template">
      <h1 className="cl-resume-name">{data.name}</h1>
      {data.title && <p className="cl-resume-title">{data.title}</p>}
      <div className="cl-resume-contact">
        {data.phone && <span>{data.phone}</span>}
        {data.email && <span>{data.email}</span>}
        {data.location && <span>{data.location}</span>}
        {data.linkedin && <span>{data.linkedin}</span>}
        {data.github && <span>{data.github}</span>}
      </div>
      {data.summary && (
        <div className="cl-resume-section"><h2>Summary</h2><p>{data.summary}</p></div>
      )}
      {data.education?.length > 0 && (
        <div className="cl-resume-section">
          <h2>Education</h2>
          {data.education.map((e, i) => (
            <div className="cl-resume-entry" key={i}>
              <div className="cl-resume-entry-head"><strong>{e.school}</strong><span>{e.years}</span></div>
              {e.degree && <p className="cl-resume-entry-sub">{e.degree}</p>}
              {e.details && <p>{e.details}</p>}
            </div>
          ))}
        </div>
      )}
      {data.experience?.length > 0 && (
        <div className="cl-resume-section">
          <h2>Work Experience</h2>
          {data.experience.map((e, i) => (
            <div className="cl-resume-entry" key={i}>
              <div className="cl-resume-entry-head"><strong>{e.company}</strong><span>{e.years}</span></div>
              {e.role && <p className="cl-resume-entry-sub">{e.role}</p>}
              {e.bullets?.length > 0 && (
                <ul className="cl-resume-bullets">{e.bullets.map((b, bi) => <li key={bi}>{b}</li>)}</ul>
              )}
            </div>
          ))}
        </div>
      )}
      {data.projects?.length > 0 && (
        <div className="cl-resume-section">
          <h2>Projects</h2>
          {data.projects.map((p, i) => (
            <div className="cl-resume-entry" key={i}>
              <div className="cl-resume-entry-head"><strong>{p.title}</strong>{p.tech && <span>{p.tech}</span>}</div>
              {p.bullets?.length > 0 && (
                <ul className="cl-resume-bullets">{p.bullets.map((b, bi) => <li key={bi}>{b}</li>)}</ul>
              )}
            </div>
          ))}
        </div>
      )}
      {data.skills?.length > 0 && (
        <div className="cl-resume-section"><h2>Skills</h2><ul className="cl-resume-list">{data.skills.map((s, i) => <li key={i}>{s}</li>)}</ul></div>
      )}
      {data.certifications?.length > 0 && (
        <div className="cl-resume-section"><h2>Certifications</h2><ul className="cl-resume-list">{data.certifications.map((c, i) => <li key={i}>{c}</li>)}</ul></div>
      )}
      {data.achievements?.length > 0 && (
        <div className="cl-resume-section"><h2>Achievements</h2><ul className="cl-resume-list">{data.achievements.map((a, i) => <li key={i}>{a}</li>)}</ul></div>
      )}
      {data.languages?.length > 0 && (
        <div className="cl-resume-section"><h2>Languages</h2><p>{data.languages.join(', ')}</p></div>
      )}
    </div>
  );
}

export default function ResumePage() {
  const { toast } = useApp();
  const [tab, setTab] = useState('generate');

  // Generate tab state
  const [genJobDesc, setGenJobDesc] = useState('');
  const [genPhone, setGenPhone] = useState('');
  const [genLocation, setGenLocation] = useState('');
  const [genLinkedin, setGenLinkedin] = useState('');
  const [genGithub, setGenGithub] = useState('');
  const [genSummary, setGenSummary] = useState('');
  const [genEducation, setGenEducation] = useState('');
  const [genExperience, setGenExperience] = useState('');
  const [genAchievements, setGenAchievements] = useState('');
  const [genCertifications, setGenCertifications] = useState('');
  const [genLanguages, setGenLanguages] = useState('');
  const [genResult, setGenResult] = useState(null);
  const [genLoading, setGenLoading] = useState(false);
  const [genKeywords, setGenKeywords] = useState([]);

  // Check tab state
  const [checkResumeText, setCheckResumeText] = useState('');
  const [checkJobDesc, setCheckJobDesc] = useState('');
  const [checkResult, setCheckResult] = useState(null);
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkKeywords, setCheckKeywords] = useState([]);
  const [checkFormatted, setCheckFormatted] = useState(null);
  const [checkFormatLoading, setCheckFormatLoading] = useState(false);
    const [ocrLoading, setOcrLoading] = useState(false);
    const [ocrProgress, setOcrProgress] = useState(0);

    async function handleImageUpload(e) {
      const file = e.target.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) { toast('Choose an image smaller than 10 MB.'); return; }
      let worker;
      setOcrLoading(true);
      setOcrProgress(0);
      try {
        const { createWorker } = await import('tesseract.js');
        worker = await createWorker('eng', 1, {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setOcrProgress(Math.round(m.progress * 100));
            }
          },
        });
        const { data: { text } } = await worker.recognize(file);
        setCheckResumeText(text);
        toast('Text extracted from image. Review it below before checking.');
      } catch {
        toast('Could not read text from that image. Try a clearer photo or paste text instead.');
      }
      await worker?.terminate();
      setOcrLoading(false);
    }

  // Compare tab state
  const [compareA, setCompareA] = useState('');
  const [compareB, setCompareB] = useState('');
  const [compareJobDesc, setCompareJobDesc] = useState('');
  const [compareResult, setCompareResult] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);
  // From-text tab state
  const [rawText, setRawText] = useState('');
  const [rawResult, setRawResult] = useState(null);
  const [rawLoading, setRawLoading] = useState(false);


  function scoreColor(score) {
    if (score === null || score === undefined) return 'hsl(var(--muted-foreground))';
    if (score >= 70) return 'hsl(var(--accent-lime))';
    if (score >= 40) return 'hsl(var(--accent-cyan))';
    return 'hsl(var(--accent-magenta))';
  }

  // ---- Generate ----
  async function generateResume(e) {
    if (e) e.preventDefault();
    setGenLoading(true);
    try {
      const res = await api.post('/resume/generate', {
        jobDescription: genJobDesc || undefined,
        overridePhone: genPhone || undefined,
        overrideLocation: genLocation || undefined,
        overrideLinkedin: genLinkedin || undefined,
        overrideGithub: genGithub || undefined,
        overrideSummary: genSummary || undefined,
        overrideEducation: genEducation || undefined,
        overrideExperience: genExperience || undefined,
        overrideAchievements: genAchievements || undefined,
        overrideCertifications: genCertifications || undefined,
        overrideLanguages: genLanguages || undefined,
        keywordsToInclude: genKeywords,
      }, { headers: authHeaders() });
      setGenResult(res.data.data);
      toast('Resume generated.');
    } catch {
      toast(err.response?.data?.error?.message || 'Could not generate resume. Is Ollama running?');
    }
    setGenLoading(false);
  }
  function addGenKeyword(k) {
    if (!genKeywords.includes(k)) setGenKeywords([...genKeywords, k]);
  }

  // ---- Check ----
  async function checkResume(e) {
    if (e) e.preventDefault();
    setCheckLoading(true);
    try {
      const res = await api.post('/resume/check', { resumeText: checkResumeText, jobDescription: checkJobDesc }, { headers: authHeaders() });
      setCheckResult(res.data.data);
      setCheckKeywords([]);
      setCheckFormatted(null);
      toast('ATS check complete.');
    } catch {
      toast(err.response?.data?.error?.message || 'Could not check resume.');
    }
    setCheckLoading(false);
  }
  function addCheckKeyword(k) {
    if (!checkKeywords.includes(k)) setCheckKeywords([...checkKeywords, k]);
  }
  async function regenerateFormattedWithKeywords() {
    setCheckFormatLoading(true);
    try {
      const res = await api.post('/resume/structure', { resumeText: checkResumeText, keywordsToInclude: checkKeywords }, { headers: authHeaders() });
      setCheckFormatted(res.data.data.resumeStructured);
      toast('Resume regenerated with keywords.');
    } catch {
      toast(err.response?.data?.error?.message || 'Could not regenerate. Is Ollama running?');
    }
    setCheckFormatLoading(false);
  }

  // ---- Compare ----
  async function compareResumes(e) {
    e.preventDefault();
    setCompareLoading(true);
    setCompareResult(null);
    try {
      const res = await api.post('/resume/compare', { resumeTextA: compareA, resumeTextB: compareB, jobDescription: compareJobDesc }, { headers: authHeaders() });
      setCompareResult(res.data.data);
      toast('Comparison complete.');
    } catch {
      toast(err.response?.data?.error?.message || 'Could not compare resumes.');
    }
    setCompareLoading(false);
  }

  // ---- From text ----
  async function structureFromText(e) {
    if (e) e.preventDefault();
    setRawLoading(true);
    try {
      const res = await api.post('/resume/structure', { resumeText: rawText }, { headers: authHeaders() });
      setRawResult(res.data.data.resumeStructured);
      toast('Resume formatted.');
    } catch {
      toast(err.response?.data?.error?.message || 'Could not format resume. Is Ollama running?');
    }
    setRawLoading(false);
  }

  return (
    <div className="cl-page">
      <PageHead eyebrow="Career tools" title="Resume AI." copy="Generate, check, and compare resumes for ATS compatibility — powered by a local AI model." />

      <div className="cl-tabs">
        <button className={`cl-tab ${tab === 'generate' ? 'active' : ''}`} onClick={() => setTab('generate')}>Generate from scratch</button>
        <button className={`cl-tab ${tab === 'check' ? 'active' : ''}`} onClick={() => setTab('check')}>Upload & check ATS</button>
        <button className={`cl-tab ${tab === 'compare' ? 'active' : ''}`} onClick={() => setTab('compare')}>Compare two resumes</button>
        <button className={`cl-tab ${tab === 'fromtext' ? 'active' : ''}`} onClick={() => setTab('fromtext')}>From text</button>
      </div>

      {tab === 'generate' && (
        <div className="cl-two-col" style={{ marginTop: 20 }}>
          <form className="cl-card cl-add-form" onSubmit={generateResume} style={{ maxHeight: 640, overflowY: 'auto' }}>
            <div className="cl-section-head"><h2 className="cl-section-title">Tell us about yourself</h2></div>
            <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginBottom: 14 }}>Skills and projects are pulled from CampusLink automatically. Fill in the rest below.</p>

            <div className="cl-form-row">
              <div className="cl-form-field"><label className="cl-form-label">Phone</label><input aria-label="+91 98765 43210" className="cl-input" value={genPhone} onChange={(e) => setGenPhone(e.target.value)} placeholder="+91 98765 43210" /></div>
              <div className="cl-form-field"><label className="cl-form-label">Location</label><input aria-label="Coimbatore, India" className="cl-input" value={genLocation} onChange={(e) => setGenLocation(e.target.value)} placeholder="Coimbatore, India" /></div>
            </div>
            <div className="cl-form-row">
              <div className="cl-form-field"><label className="cl-form-label">LinkedIn</label><input aria-label="Gen linkedin" className="cl-input" value={genLinkedin} onChange={(e) => setGenLinkedin(e.target.value)} /></div>
              <div className="cl-form-field"><label className="cl-form-label">GitHub</label><input aria-label="Gen github" className="cl-input" value={genGithub} onChange={(e) => setGenGithub(e.target.value)} /></div>
            </div>

            <div className="cl-form-field"><label className="cl-form-label">Professional summary</label><textarea aria-label="A line or two about who you are professionally" className="cl-textarea" rows={2} value={genSummary} onChange={(e) => setGenSummary(e.target.value)} placeholder="A line or two about who you are professionally" /></div>
            <div className="cl-form-field"><label className="cl-form-label">Education</label><textarea aria-label="e.g. B.Tech CSE, XYZ University, 2023-2027" className="cl-textarea" rows={2} value={genEducation} onChange={(e) => setGenEducation(e.target.value)} placeholder="e.g. B.Tech CSE, XYZ University, 2023-2027" /></div>
            <div className="cl-form-field"><label className="cl-form-label">Work / internship experience</label><textarea aria-label="Company, role, dates, what you did" className="cl-textarea" rows={3} value={genExperience} onChange={(e) => setGenExperience(e.target.value)} placeholder="Company, role, dates, what you did" /></div>
            <div className="cl-form-field"><label className="cl-form-label">Certifications</label><textarea aria-label="e.g. AWS Cloud Practitioner" className="cl-textarea" rows={2} value={genCertifications} onChange={(e) => setGenCertifications(e.target.value)} placeholder="e.g. AWS Cloud Practitioner" /></div>
            <div className="cl-form-field"><label className="cl-form-label">Achievements / awards / participation</label><textarea aria-label="Hackathon wins, competitions, extracurricular roles" className="cl-textarea" rows={3} value={genAchievements} onChange={(e) => setGenAchievements(e.target.value)} placeholder="Hackathon wins, competitions, extracurricular roles" /></div>
            <div className="cl-form-field"><label className="cl-form-label">Languages known</label><input aria-label="e.g. English, Tamil, Hindi" className="cl-input" value={genLanguages} onChange={(e) => setGenLanguages(e.target.value)} placeholder="e.g. English, Tamil, Hindi" /></div>

            <div className="cl-form-field">
              <label className="cl-form-label">Target job description (optional)</label>
              <textarea aria-label="Paste a job description to tailor the resume and get an keyword match estimate" className="cl-textarea" rows={4} value={genJobDesc} onChange={(e) => setGenJobDesc(e.target.value)} placeholder="Paste a job description to tailor the resume and get an keyword match estimate" />
            </div>
            <button className="cl-btn cl-btn-primary" type="submit" disabled={genLoading} style={{ width: '100%' }}>
              {genLoading ? 'Generating (this can take 20-30s)…' : 'Generate resume'}
            </button>
          </form>

          <div className="cl-card cl-card-pad">
            <div className="cl-section-head">
              <h2 className="cl-section-title">Result</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {genResult && genResult.atsDetail.score !== null && <span style={{ fontFamily: 'var(--app-font-display)', fontSize: 22, color: scoreColor(genResult.atsDetail.score) }}>{genResult.atsDetail.score}%</span>}
                {genResult && <DownloadMenu structured={genResult.resumeStructured} />}
              </div>
            </div>
            {!genResult && <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>Your generated resume will appear here.</p>}
            {genResult && genResult.resumeStructured && (
              <>
                <ResumeTemplate data={genResult.resumeStructured} />
                {genResult.atsDetail.missingKeywords.length > 0 && (
                  <div style={{ marginTop: 14 }} className="cl-no-print">
                    <strong style={{ fontSize: 12 }}>Missing keywords — click to add, then regenerate:</strong>
                    <div className="cl-match-tags" style={{ marginTop: 6 }}>
                      {genResult.atsDetail.missingKeywords.map((k) => (
                        <button key={k} type="button" className={`cl-pill ${genKeywords.includes(k) ? 'cl-pill-offer' : ''}`} style={{ cursor: 'pointer', border: 'none' }} onClick={() => addGenKeyword(k)}>
                          {genKeywords.includes(k) ? '✓ ' : '+ '}{k}
                        </button>
                      ))}
                    </div>
                    {genKeywords.length > 0 && (
                      <button className="cl-btn cl-btn-dark" style={{ marginTop: 12, width: 'auto' }} onClick={generateResume} disabled={genLoading}>
                        {genLoading ? 'Regenerating…' : `Regenerate with ${genKeywords.length} keyword(s)`}
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {tab === 'check' && (
        <div className="cl-two-col" style={{ marginTop: 20 }}>
          <form className="cl-card cl-add-form" onSubmit={checkResume}>
            <div className="cl-section-head"><h2 className="cl-section-title">Check your resume</h2></div>
            <div className="cl-form-field">
              <label className="cl-form-label">Upload a resume image (optional)</label>
              <input aria-label="File" type="file" accept="image/*" className="cl-input" onChange={handleImageUpload} disabled={ocrLoading} />
              {ocrLoading && <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginTop: 6 }}>Reading text from image… {ocrProgress}%</p>}
            </div>
            <div className="cl-form-field">
              <label className="cl-form-label">Or paste your resume text</label>
              <textarea aria-label="Paste the full text of your resume, or upload an image above to auto-fill this" className="cl-textarea" rows={8} value={checkResumeText} onChange={(e) => setCheckResumeText(e.target.value)} required placeholder="Paste the full text of your resume, or upload an image above to auto-fill this" />
            </div>
            <div className="cl-form-field">
              <label className="cl-form-label">Job description</label>
              <textarea aria-label="Paste the job description you're targeting" className="cl-textarea" rows={6} value={checkJobDesc} onChange={(e) => setCheckJobDesc(e.target.value)} required placeholder="Paste the job description you're targeting" />
            </div>
            <button className="cl-btn cl-btn-primary" type="submit" disabled={checkLoading} style={{ width: '100%' }}>
              {checkLoading ? 'Checking (this can take 15-20s)…' : 'Check keyword match estimate'}
            </button>
          </form>
          <div className="cl-card cl-card-pad">
            <div className="cl-section-head"><h2 className="cl-section-title">ATS Result</h2>{checkResult && <span style={{ fontFamily: 'var(--app-font-display)', fontSize: 22, color: scoreColor(checkResult.atsDetail.score) }}>{checkResult.atsDetail.score}%</span>}</div>
            {!checkResult && <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>Your keyword match estimate and suggestions will appear here.</p>}
            {checkResult && (
              <>
                <div style={{ marginBottom: 14 }}>
                  <strong style={{ fontSize: 12 }}>Missing keywords ({checkResult.atsDetail.missingKeywords.length}) — click to add, then regenerate a formatted resume with them:</strong>
                  <div className="cl-match-tags" style={{ marginTop: 6 }}>
                    {checkResult.atsDetail.missingKeywords.length ? checkResult.atsDetail.missingKeywords.map((k) => (
                      <button key={k} type="button" className={`cl-pill ${checkKeywords.includes(k) ? 'cl-pill-offer' : ''}`} style={{ cursor: 'pointer', border: 'none' }} onClick={() => addCheckKeyword(k)}>
                        {checkKeywords.includes(k) ? '✓ ' : '+ '}{k}
                      </button>
                    )) : <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>None — great coverage!</span>}
                  </div>
                  {checkKeywords.length > 0 && (
                    <button className="cl-btn cl-btn-dark" style={{ marginTop: 12, width: 'auto' }} onClick={regenerateFormattedWithKeywords} disabled={checkFormatLoading}>
                      {checkFormatLoading ? 'Regenerating…' : `Regenerate formatted resume with ${checkKeywords.length} keyword(s)`}
                    </button>
                  )}
                </div>
                <div style={{ marginBottom: 14 }}>
                  <strong style={{ fontSize: 12 }}>Matched keywords ({checkResult.atsDetail.matchedKeywords.length}):</strong>
                  <div className="cl-match-tags" style={{ marginTop: 6 }}>
                    {checkResult.atsDetail.matchedKeywords.map((k) => <span className="cl-pill cl-pill-offer" key={k}>{k}</span>)}
                  </div>
                </div>
                <strong style={{ fontSize: 12 }}>Suggestions:</strong>
                <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12.5, lineHeight: 1.6, background: 'hsl(var(--muted))', padding: 14, borderRadius: 8, marginTop: 6 }}>{checkResult.suggestions}</pre>

                {checkFormatted && (
                  <div style={{ marginTop: 20 }}>
                    <div className="cl-section-head"><h2 className="cl-section-title">Formatted resume</h2><DownloadMenu structured={checkFormatted} /></div>
                    <ResumeTemplate data={checkFormatted} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {tab === 'compare' && (
        <div style={{ marginTop: 20 }}>
          <form className="cl-card cl-card-pad" onSubmit={compareResumes} style={{ marginBottom: 16 }}>
            <div className="cl-section-head"><h2 className="cl-section-title">Compare two resumes</h2></div>
            <div className="cl-form-field">
              <label className="cl-form-label">Job description</label>
              <textarea aria-label="Compare job desc" className="cl-textarea" rows={4} value={compareJobDesc} onChange={(e) => setCompareJobDesc(e.target.value)} required />
            </div>
            <div className="cl-form-row">
              <div className="cl-form-field"><label className="cl-form-label">Resume A</label><textarea aria-label="Compare a" className="cl-textarea" rows={8} value={compareA} onChange={(e) => setCompareA(e.target.value)} required /></div>
              <div className="cl-form-field"><label className="cl-form-label">Resume B</label><textarea aria-label="Compare b" className="cl-textarea" rows={8} value={compareB} onChange={(e) => setCompareB(e.target.value)} required /></div>
            </div>
            <button className="cl-btn cl-btn-primary" type="submit" disabled={compareLoading} style={{ width: '100%' }}>{compareLoading ? 'Comparing…' : 'Compare'}</button>
          </form>

          {compareResult && (
            <div className="cl-form-row">
              <div className="cl-card cl-card-pad">
                <div className="cl-section-head"><h2 className="cl-section-title">Resume A {compareResult.winner === 'A' && '🏆'}</h2><span style={{ fontFamily: 'var(--app-font-display)', fontSize: 20, color: scoreColor(compareResult.resumeA.score) }}>{compareResult.resumeA.score}%</span></div>
                <strong style={{ fontSize: 12 }}>Unique strengths:</strong>
                <div className="cl-match-tags" style={{ marginTop: 6, marginBottom: 12 }}>{compareResult.resumeA.uniqueStrengths.length ? compareResult.resumeA.uniqueStrengths.map((k) => <span className="cl-pill cl-pill-offer" key={k}>{k}</span>) : <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>None</span>}</div>
                <strong style={{ fontSize: 12 }}>Missing:</strong>
                <div className="cl-match-tags" style={{ marginTop: 6 }}>{compareResult.resumeA.missingKeywords.map((k) => <span className="cl-pill" key={k}>{k}</span>)}</div>
              </div>
              <div className="cl-card cl-card-pad">
                <div className="cl-section-head"><h2 className="cl-section-title">Resume B {compareResult.winner === 'B' && '🏆'}</h2><span style={{ fontFamily: 'var(--app-font-display)', fontSize: 20, color: scoreColor(compareResult.resumeB.score) }}>{compareResult.resumeB.score}%</span></div>
                <strong style={{ fontSize: 12 }}>Unique strengths:</strong>
                <div className="cl-match-tags" style={{ marginTop: 6, marginBottom: 12 }}>{compareResult.resumeB.uniqueStrengths.length ? compareResult.resumeB.uniqueStrengths.map((k) => <span className="cl-pill cl-pill-offer" key={k}>{k}</span>) : <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>None</span>}</div>
                <strong style={{ fontSize: 12 }}>Missing:</strong>
                <div className="cl-match-tags" style={{ marginTop: 6 }}>{compareResult.resumeB.missingKeywords.map((k) => <span className="cl-pill" key={k}>{k}</span>)}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'fromtext' && (
        <div className="cl-two-col" style={{ marginTop: 20 }}>
          <form className="cl-card cl-add-form" onSubmit={structureFromText}>
            <div className="cl-section-head"><h2 className="cl-section-title">Paste your resume text</h2></div>
            <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginBottom: 14 }}>We'll reformat it into a clean, professional template — no facts added, just restructured.</p>
            <div className="cl-form-field">
              <textarea aria-label="Paste your full resume text here" className="cl-textarea" rows={16} value={rawText} onChange={(e) => setRawText(e.target.value)} required placeholder="Paste your full resume text here" />
            </div>
            <button className="cl-btn cl-btn-primary" type="submit" disabled={rawLoading} style={{ width: '100%' }}>
              {rawLoading ? 'Formatting (15-20s)…' : 'Format resume'}
            </button>
          </form>
          <div className="cl-card cl-card-pad">
            <div className="cl-section-head">
              <h2 className="cl-section-title">Result</h2>
              {rawResult && <DownloadMenu structured={rawResult} />}
            </div>
            {!rawResult && <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>Your formatted resume will appear here.</p>}
            {rawResult && <ResumeTemplate data={rawResult} />}
          </div>
        </div>
      )}
    </div>
  );
}

