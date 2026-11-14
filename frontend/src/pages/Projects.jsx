import { useCallback, useEffect, useState } from 'react';
import { ArrowUpRight, BookOpen, Check, Plus, Search, Send, Trash2, X } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { useApp, authHeaders } from '../context';
import PageHead from '../components/PageHead';

export function ProjectsPage() {
  const navigate = useNavigate();
  const { toast } = useApp();
  const [projects, setProjects] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('');
  const [requiredRoles, setRequiredRoles] = useState('');
  const [teamSize, setTeamSize] = useState(3);
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: '9' });
      if (keyword) params.set('keyword', keyword);
      if (category) params.set('category', category);
      const res = await api.get(`/projects?${params.toString()}`, { headers: authHeaders() });
      setProjects(res.data.data.items);
      setTotal(res.data.data.total);
      setTotalPages(res.data.data.totalPages);
    } catch {
      toast('Could not load projects.');
    }
  }, [page, keyword, category, toast]);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  function search(e) {
    e.preventDefault();
    setPage(1);
    load();
  }

  async function createProject(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/projects', {
        title, description, category: formCategory,
        requiredSkills, requiredRoles,
        teamSize: Number(teamSize),
        deadline: deadline || undefined,
      }, { headers: authHeaders() });
      toast('Project created.');
      setShowForm(false);
      setTitle(''); setDescription(''); setFormCategory(''); setRequiredSkills(''); setRequiredRoles(''); setTeamSize(3); setDeadline('');
      load();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not create project.');
    }
  }

  return (
    <div className="cl-page">
      <PageHead
        eyebrow="Find your team"
        title="Project collaboration."
        copy="Discover student projects looking for collaborators, or start your own."
        action={<div style={{ display: 'flex', gap: 8 }}><Link to="/projects/mine" className="cl-btn cl-btn-quiet">My projects</Link><button className="cl-btn cl-btn-primary" onClick={() => setShowForm(!showForm)}><Plus size={16} />{showForm ? 'Close' : 'New project'}</button></div>}
      />

      {showForm && (
        <form className="cl-card cl-card-pad" style={{ marginBottom: 20 }} onSubmit={createProject}>
          <div className="cl-section-head"><h2 className="cl-section-title">Create a project</h2></div>
          {error && <p style={{ color: '#c0392b', fontSize: 13, marginBottom: 14 }}>{error}</p>}
          <div className="cl-form-field"><label className="cl-form-label">Title</label><input aria-label="Title" className="cl-input" value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
          <div className="cl-form-field"><label className="cl-form-label">Description</label><textarea aria-label="Description" className="cl-textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} required /></div>
          <div className="cl-form-row">
            <div className="cl-form-field"><label className="cl-form-label">Category</label><input aria-label="e.g. Web app" className="cl-input" value={formCategory} onChange={(e) => setFormCategory(e.target.value)} placeholder="e.g. Web app" required /></div>
            <div className="cl-form-field"><label className="cl-form-label">Team size</label><input aria-label="Team size" type="number" min="1" className="cl-input" value={teamSize} onChange={(e) => setTeamSize(e.target.value)} /></div>
          </div>
          <div className="cl-form-field"><label className="cl-form-label">Required skills (comma-separated)</label><input aria-label="e.g. React, Figma" className="cl-input" value={requiredSkills} onChange={(e) => setRequiredSkills(e.target.value)} placeholder="e.g. React, Figma" /></div>
          <div className="cl-form-field"><label className="cl-form-label">Required roles (comma-separated)</label><input aria-label="e.g. Frontend dev, Designer" className="cl-input" value={requiredRoles} onChange={(e) => setRequiredRoles(e.target.value)} placeholder="e.g. Frontend dev, Designer" /></div>
          <div className="cl-form-field"><label className="cl-form-label">Deadline</label><input aria-label="Deadline" type="date" className="cl-input" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></div>
          <button className="cl-btn cl-btn-dark" type="submit" style={{ width: '100%' }}>Create project</button>
        </form>
      )}

      <form className="cl-page-toolbar" onSubmit={search}>
        <div className="cl-search"><Search size={16} /><input aria-label="Search by title or description" className="cl-input" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Search by title or description" /></div>
        <input aria-label="Category" className="cl-input" style={{ maxWidth: 180 }} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" />
        <button className="cl-btn cl-btn-primary" type="submit" style={{ width: 'auto' }}>Search</button>
      </form>

      {projects.length ? (
        <div className="cl-match-grid">
          {projects.map((p) => (
            <article key={p.id} className="cl-card cl-profile-match" style={{ cursor: 'pointer' }} onClick={() => navigate(`/projects/${p.id}`)}>
              <div className="cl-profile-top">
                <div><h3>{p.title}</h3><p className="cl-match-meta">{p.category} · by {p.owner.name}</p></div>
              </div>
              <p className="cl-page-copy" style={{ margin: '12px 0', fontSize: 13 }}>{p.description.length > 120 ? p.description.slice(0, 120) + '…' : p.description}</p>
              <div className="cl-match-tags">
                <span className="cl-pill">{p._count.members}/{p.teamSize} team</span>
                <span className="cl-pill">{p._count.applications} applied</span>
                <span className={`cl-status status-${p.status === 'OPEN' ? 'pending' : p.status === 'ACTIVE' ? 'accepted' : 'completed'}`} style={{ textTransform: 'lowercase' }}>{p.status.toLowerCase()}</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="cl-empty"><Search size={23} /><p>No projects found. Try a different search, or create one.</p></div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 24 }}>
          <button className="cl-mini-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
          <span style={{ alignSelf: 'center', fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>Page {page} of {totalPages} · {total} total</span>
          <button className="cl-mini-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
export function MyProjectsPage() {
  const navigate = useNavigate();
  const { toast } = useApp();
  const [owned, setOwned] = useState([]);
  const [memberOf, setMemberOf] = useState([]);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/projects/mine', { headers: authHeaders() });
      setOwned(res.data.data.owned);
      setMemberOf(res.data.data.memberOf);
    } catch {
      toast('Could not load your projects.');
    }
  }, [toast]);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  return (
    <div className="cl-page">
      <PageHead eyebrow="Your work" title="My projects." copy="Projects you own, and projects you've joined." action={<Link to="/projects" className="cl-btn cl-btn-primary">Browse all <ArrowUpRight size={16} /></Link>} />
      <div className="cl-card cl-card-pad" style={{ marginBottom: 20 }}>
        <div className="cl-section-head"><h2 className="cl-section-title">Owned by you ({owned.length})</h2></div>
        {owned.length ? owned.map((p) => (
          <div className="cl-skill-item" key={p.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/projects/${p.id}`)}>
            <div><strong style={{ display: 'block', fontSize: 13 }}>{p.title}</strong><span>{p.category} · {p._count.members}/{p.teamSize} team · {p._count.applications} applications</span></div>
            <span className="cl-badge" style={{ fontSize: 10 }}>{p.status}</span>
          </div>
        )) : <div className="cl-empty" style={{ padding: 18 }}><p>You haven't created a project yet.</p></div>}
      </div>
      <div className="cl-card cl-card-pad">
        <div className="cl-section-head"><h2 className="cl-section-title">You're a member of ({memberOf.length})</h2></div>
        {memberOf.length ? memberOf.map((m) => (
          <div className="cl-skill-item" key={m.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/projects/${m.project.id}`)}>
            <div><strong style={{ display: 'block', fontSize: 13 }}>{m.project.title}</strong><span>Owned by {m.project.owner.name}</span></div>
          </div>
        )) : <div className="cl-empty" style={{ padding: 18 }}><p>You haven't joined any projects yet.</p></div>}
      </div>
    </div>
  );
}
export function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast, currentUser } = useApp();
  const [project, setProject] = useState(null);
  const [applyMessage, setApplyMessage] = useState('');
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneDue, setMilestoneDue] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/projects/${id}`, { headers: authHeaders() });
      setProject(res.data.data);
    } catch {
      toast('Could not load project.');
    }
  }, [id, toast]);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  useEffect(() => {
    if (project && currentUser && project.owner.id === currentUser.id) {
      api.get(`/projects/${id}/suggested-collaborators`, { headers: authHeaders() })
        .then((res) => setSuggestions(res.data.data))
        .catch(() => {});
    }
  }, [project, currentUser, id]);

  if (!project) return <div className="cl-page"><p style={{ color: 'hsl(var(--muted-foreground))' }}>Loading…</p></div>;

  const isOwner = currentUser && project.owner.id === currentUser.id;
  const isMember = currentUser && project.members.some((m) => m.user.id === currentUser.id);
  const myApplication = currentUser && project.applications.find((a) => a.applicant.id === currentUser.id);

  async function deleteProject() {
    if (!window.confirm('Delete this project permanently? This cannot be undone.')) return;
    try {
      await api.delete(`/projects/${id}`, { headers: authHeaders() });
      toast('Project deleted.');
      navigate('/projects');
    } catch (err) {
      toast(err.response?.data?.error?.message || 'Could not delete project.');
    }
  }

  async function apply(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post(`/projects/${id}/apply`, { message: applyMessage }, { headers: authHeaders() });
      toast('Application submitted.');
      setApplyMessage('');
      load();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not apply.');
    }
  }

  async function reviewApplication(appId, status) {
    try {
      await api.patch(`/projects/${id}/applications/${appId}`, { status }, { headers: authHeaders() });
      toast(`Application ${status.toLowerCase()}.`);
      load();
    } catch (err) {
      toast(err.response?.data?.error?.message || 'Could not update application.');
    }
  }

  async function addMilestone(e) {
    e.preventDefault();
    if (!milestoneTitle.trim()) return;
    try {
      await api.post(`/projects/${id}/milestones`, { title: milestoneTitle, dueDate: milestoneDue || undefined }, { headers: authHeaders() });
      setMilestoneTitle(''); setMilestoneDue('');
      toast('Milestone added.');
      load();
    } catch (err) {
      toast(err.response?.data?.error?.message || 'Could not add milestone.');
    }
  }

  async function updateMilestone(milestoneId, data) {
    try {
      await api.patch(`/projects/milestones/${milestoneId}`, data, { headers: authHeaders() });
      load();
    } catch {
      toast('Could not update milestone.');
    }
  }

  async function postComment(e) {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      await api.post(`/projects/${id}/comments`, { content: comment }, { headers: authHeaders() });
      setComment('');
      load();
    } catch (err) {
      toast(err.response?.data?.error?.message || 'Could not post comment.');
    }
  }

  return (
    <div className="cl-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <button className="cl-mini-btn" onClick={() => navigate('/projects')}>← Back to projects</button>
        {isOwner && <button className="cl-mini-btn reject" onClick={deleteProject}><Trash2 size={13} />Delete project</button>}
      </div>
      <PageHead eyebrow={project.category} title={project.title} copy={project.description} />

      <div className="cl-match-tags" style={{ marginBottom: 20 }}>
        <span className="cl-pill">{project.members.length}/{project.teamSize} team</span>
        <span className="cl-pill">by {project.owner.name}</span>
        {project.deadline && <span className="cl-pill">Due {new Date(project.deadline).toLocaleDateString()}</span>}
        <span className={`cl-status status-${project.status === 'OPEN' ? 'pending' : project.status === 'ACTIVE' ? 'accepted' : 'completed'}`} style={{ textTransform: 'lowercase' }}>{project.status.toLowerCase()}</span>
      </div>

      {project.requiredSkills && <p className="cl-page-copy"><strong>Skills needed:</strong> {project.requiredSkills}</p>}
      {project.requiredRoles && <p className="cl-page-copy"><strong>Roles needed:</strong> {project.requiredRoles}</p>}

      <div className="cl-two-col" style={{ marginTop: 24 }}>
        <div>
          <section className="cl-card cl-card-pad" style={{ marginBottom: 16 }}>
            <div className="cl-section-head"><h2 className="cl-section-title">Team ({project.members.length})</h2></div>
            {project.members.length ? project.members.map((m) => (
              <div className="cl-skill-item" key={m.id}><div><strong style={{ fontSize: 13 }}>{m.user.name}</strong><span>{m.user.email}</span></div></div>
            )) : <div className="cl-empty" style={{ padding: 18 }}><p>No team members yet.</p></div>}
          </section>

          <section className="cl-card cl-card-pad" style={{ marginBottom: 16 }}>
            <div className="cl-section-head"><h2 className="cl-section-title">Milestones ({project.milestones.length})</h2></div>
            {project.milestones.map((m) => (
              <div className="cl-skill-item" key={m.id} style={{ alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <strong style={{ display: 'block', fontSize: 13 }}>{m.title}</strong>
                  <span>{m.dueDate ? `Due ${new Date(m.dueDate).toLocaleDateString()}` : 'No due date'} · {m.progress}%</span>
                  {(isOwner || isMember) && (
                    <input aria-label="Range" type="range" min="0" max="100" value={m.progress} onChange={(e) => updateMilestone(m.id, { progress: Number(e.target.value) })} style={{ width: '100%', marginTop: 6 }} />
                  )}
                </div>
                <span className="cl-badge" style={{ fontSize: 10 }}>{m.status}</span>
              </div>
            ))}
            {project.milestones.length === 0 && <div className="cl-empty" style={{ padding: 18 }}><p>No milestones yet.</p></div>}
            {isOwner && (
              <form onSubmit={addMilestone} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <input aria-label="New milestone title" className="cl-input" placeholder="New milestone title" value={milestoneTitle} onChange={(e) => setMilestoneTitle(e.target.value)} />
                <input aria-label="Milestone due" type="date" className="cl-input" style={{ maxWidth: 160 }} value={milestoneDue} onChange={(e) => setMilestoneDue(e.target.value)} />
                <button className="cl-btn cl-btn-primary" style={{ width: 'auto' }} type="submit">Add</button>
              </form>
            )}
          </section>

          <section className="cl-card cl-card-pad">
            <div className="cl-section-head"><h2 className="cl-section-title">Discussion ({project.comments.length})</h2></div>
            {project.comments.map((c) => (
              <div key={c.id} style={{ padding: '10px 0', borderBottom: '1px dashed hsl(var(--border))' }}>
                <strong style={{ fontSize: 12 }}>{c.author.name}</strong>
                <p style={{ fontSize: 13, margin: '4px 0 0' }}>{c.content}</p>
              </div>
            ))}
            {(isOwner || isMember) ? (
              <form onSubmit={postComment} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <input aria-label="Write a comment…" className="cl-input" placeholder="Write a comment…" value={comment} onChange={(e) => setComment(e.target.value)} />
                <button className="cl-btn cl-btn-primary" style={{ width: 'auto' }} type="submit"><Send size={14} /><span className="sr-only">Post comment</span></button>
              </form>
            ) : <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginTop: 10 }}>Only team members can comment.</p>}
          </section>
        </div>

        <aside className="cl-grid">
          {isOwner && suggestions.length > 0 && (
            <section className="cl-card cl-card-pad">
              <div className="cl-section-head"><h2 className="cl-section-title">Suggested collaborators</h2></div>
              <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginBottom: 12 }}>Based on skills these students have listed as things they can teach.</p>
              {suggestions.map((s) => (
                <div key={s.user.id} style={{ padding: '10px 0', borderBottom: '1px dashed hsl(var(--border))' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: 13 }}>{s.user.name}</strong>
                    <span style={{ fontFamily: 'var(--app-font-display)', fontSize: 16, color: 'hsl(var(--accent-magenta))' }}>{s.score}%</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', margin: '4px 0 0' }}>Knows: {s.matchedSkills.join(', ')}</p>
                </div>
              ))}
            </section>
          )}

          {isOwner && (
            <section className="cl-card cl-card-pad">
              <div className="cl-section-head"><h2 className="cl-section-title">Applications ({project.applications.length})</h2></div>
              {project.applications.filter((a) => a.status === 'PENDING').length ? project.applications.filter((a) => a.status === 'PENDING').map((a) => (
                <div key={a.id} style={{ padding: '10px 0', borderBottom: '1px dashed hsl(var(--border))' }}>
                  <strong style={{ fontSize: 12 }}>{a.applicant.name}</strong>
                  {a.message && <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', margin: '4px 0 8px' }}>"{a.message}"</p>}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="cl-mini-btn accept" onClick={() => reviewApplication(a.id, 'ACCEPTED')}><Check size={12} />Accept</button>
                    <button className="cl-mini-btn reject" onClick={() => reviewApplication(a.id, 'REJECTED')}><X size={12} />Reject</button>
                  </div>
                </div>
              )) : <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>No pending applications.</p>}
            </section>
          )}

          {!isOwner && !isMember && (
            <section className="cl-card cl-card-pad">
              <div className="cl-section-head"><h2 className="cl-section-title">Apply to join</h2></div>
              {error && <p style={{ color: '#c0392b', fontSize: 13, marginBottom: 10 }}>{error}</p>}
              {myApplication ? (
                <p style={{ fontSize: 13 }}>Your application is <strong>{myApplication.status.toLowerCase()}</strong>.</p>
              ) : (
                <form onSubmit={apply}>
                  <textarea aria-label="Why do you want to join?" className="cl-textarea" rows={3} placeholder="Why do you want to join?" value={applyMessage} onChange={(e) => setApplyMessage(e.target.value)} style={{ marginBottom: 10 }} />
                  <button className="cl-btn cl-btn-primary" type="submit" style={{ width: '100%' }}>Submit application</button>
                </form>
              )}
            </section>
          )}

          {isMember && !isOwner && (
            <div className="cl-note cl-note-cyan"><BookOpen size={18} /><h3>You're on this team.</h3><p>Track milestones and join the discussion.</p></div>
          )}
        </aside>
      </div>
    </div>
  );
}



