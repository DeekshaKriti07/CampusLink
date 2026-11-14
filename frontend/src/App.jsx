import PageHead from './components/PageHead';
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight, Bell, BookOpen, CalendarDays, Check, CheckCircle2,
  CircleHelp, Compass, Home, Inbox, Layers3, Menu, MessageCircle, Moon, Plus,
  Search, Send, Settings2, Sparkles, Sun, Target, Trash2, UserRound, X, XCircle, Zap
} from 'lucide-react';
import { Navigate, BrowserRouter, Routes, Route, Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import api from './services/api';

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}
function hydrateUser(u) {
  return { id: u.id, name: u.name, handle: u.email ? u.email.split('@')[0] : 'user', major: u.role === 'ADMIN' ? 'Administrator' : 'Student', year: '', avatar: initials(u.name), bio: '', availability: 'Flexible' };
}
function hydrateSkill(s) {
  return { id: s.id, name: s.skillName, category: s.category, direction: s.type === 'OFFERED' ? 'offer' : 'want', proficiency: s.proficiency.charAt(0) + s.proficiency.slice(1).toLowerCase() };
}
function hydrateMatch(m) {
  return { user: hydrateUser(m.user), score: m.score, sharedOfferings: [], canLearn: [], canTeach: [], rationale: (m.reasons || []).join(' ') };
}
function hydrateRequest(r, myId) {
  const isReceiver = r.receiverId === myId;
  const other = isReceiver ? r.requester : r.receiver;
  return { id: r.id, match: { user: hydrateUser(other) }, skill: 'SkillSwap request', status: r.status.toLowerCase(), createdAt: new Date(r.createdAt).toLocaleDateString(), note: r.message || '', isReceiver };
}
import { AppContext, useApp, authHeaders } from './context';
const avatarClasses = ['cl-avatar', 'cl-avatar-cyan', 'cl-avatar-lime', 'cl-avatar-magenta'];
function Avatar({ user, index = 0, large = false }) {
  return <div className={`${avatarClasses[index % avatarClasses.length]} ${large ? 'cl-avatar-large' : ''} cl-avatar`}>{user.avatar}</div>;
}
function Logo() {
  return <Link to="/" className="cl-brand"><span className="cl-brand-mark">C<span /></span><span><span className="cl-brand-name">CampusLink</span><span className="cl-brand-sub">SkillSwap</span></span></Link>;
}
const navItems = [
  { href: '/', label: 'Home base', icon: Home },
  { href: '/matches', label: 'Matches', icon: Compass },
  { href: '/requests', label: 'Requests', icon: Inbox },
  { href: '/skills', label: 'My skills', icon: Layers3 },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/projects', label: 'Projects', icon: Layers3 },
  { href: '/resume', label: 'Resume AI', icon: Sparkles },
  { href: '/profile', label: 'Profile', icon: UserRound },
];
function Sidebar() {
  const location = useLocation().pathname;
  const { pendingCount } = useApp();
  return (
    <aside className="cl-sidebar">
      <Logo />
      <p className="cl-nav-label">Your board</p>
      <nav className="cl-nav">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link to={href} key={href} className={location === href ? 'active' : ''}>
            <Icon /><span>{label}</span>
            {label === 'Requests' && pendingCount > 0 && <span className="cl-nav-count">{pendingCount}</span>}
          </Link>
        ))}
      </nav>
      <div className="cl-side-foot">
        <UserMini />
        <Link to="/profile" className="cl-nav cl-settings-link"><span><Settings2 size={15} />Account settings</span></Link>
        <ThemeToggle />
      </div>
    </aside>
  );
}
function UserMini() {
  const { currentUser } = useApp();
  if (!currentUser) return null;
  return <div className="cl-user-mini"><Avatar user={currentUser} index={1} /><div><p>{currentUser.name}</p><span>Signed in</span><button className="cl-mini-btn" type="button" onClick={() => { localStorage.removeItem('token'); window.location.replace('/login'); }}>Sign out</button></div></div>;
}
function ThemeToggle() {
  const { theme, toggleTheme } = useApp();
  const isDark = theme === 'dark';
  return (
    <button className="cl-theme-toggle" type="button" onClick={toggleTheme} aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}>
      <span className="cl-theme-icon">{isDark ? <Sun size={14} /> : <Moon size={14} />}</span>
      <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
      <span className="cl-theme-key">{isDark ? 'L' : 'D'}</span>
    </button>
  );
}
function MobileTopbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation().pathname;
  const { toast, currentUser, pendingCount } = useApp();
  return (
    <>
      <div className="cl-topbar">
        <div className="cl-topbar-left">
          <button className="cl-icon-btn cl-menu-toggle" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} onClick={() => setMenuOpen((v) => !v)}><Menu size={18} /></button>
          <Link to="/" className="cl-mobile-logo"><span className="cl-brand-mark">C<span /></span>CampusLink</Link>
          <span className="cl-top-kicker">Your campus board</span>
        </div>
        <div className="cl-top-actions">
          <ThemeToggle />
          <button className="cl-icon-btn" aria-label="View notifications" onClick={() => toast('You are all caught up.')}><Bell size={17} /></button>
          <Link to="/profile" aria-label="View your profile" className="cl-icon-btn">{currentUser && <Avatar user={currentUser} index={1} />}</Link>
        </div>
      </div>
      {menuOpen && (
        <nav className="cl-mobile-nav">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link to={href} key={href} className={location === href ? 'active' : ''} onClick={() => setMenuOpen(false)}>
              <Icon size={17} /><span>{label}</span>
              {label === 'Requests' && pendingCount > 0 && <span className="cl-nav-count">{pendingCount}</span>}
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}
function CampusGraphic() {
  return (
    <div className="cl-campus-graphic" aria-hidden="true">
      <svg viewBox="0 0 320 240" role="presentation">
        <path className="cl-graphic-line" d="M17 173c41-49 66-77 116-91 42-11 77 11 101-20 17-22 21-43 48-45" />
        <path className="cl-graphic-line secondary" d="M18 195c53-6 67-35 108-25 35 8 44 42 90 34 35-6 51-31 86-26" />
        <ellipse className="cl-graphic-orbit" cx="184" cy="116" rx="88" ry="38" />
        <circle className="cl-graphic-dot cyan" cx="134" cy="83" r="15" />
        <circle className="cl-graphic-dot magenta" cx="234" cy="63" r="9" />
        <circle className="cl-graphic-dot lime" cx="217" cy="173" r="12" />
        <path className="cl-graphic-star" d="m73 43 5 14 14 5-14 5-5 14-5-14-14-5 14-5z" />
        <path className="cl-graphic-star small" d="m274 135 3 8 8 3-8 3-3 8-3-8-8-3 8-3z" />
        <rect className="cl-graphic-block" x="34" y="118" width="22" height="22" rx="5" transform="rotate(-12 34 118)" />
        <g className="cl-graphic-building">
          <path d="M247 169h32v31h-32z" />
          <path d="M242 169h42l-21-16z" />
          <path d="M253 177h5v7h-5zm10 0h5v7h-5zm10 0h5v7h-5z" />
        </g>
      </svg>
      <span className="cl-graphic-label">swap / make / share</span>
    </div>
  );
}
function Shell({ children }) {
  return <div className="cl-app cl-shell"><Sidebar /><main className="cl-main"><MobileTopbar />{children}</main></div>;
}
function Status({ status }) {
  return <span className={`cl-status status-${status}`}>{status}</span>;
}
function MatchRow({ match, onRequest }) {
  return (
    <article className="cl-card cl-match">
      <Avatar user={match.user} index={Number(match.user.id) || 0} />
      <div>
        <p className="cl-match-name">{match.user.name}</p>
        <p className="cl-match-meta">{match.user.major}{match.user.year ? ` · ${match.user.year}` : ''}</p>
        <div className="cl-match-tags">
          {match.sharedOfferings.slice(0, 2).map((skill) => <span className="cl-pill cl-pill-offer" key={skill}><Zap size={10} />{skill}</span>)}
          {match.canLearn.slice(0, 1).map((skill) => <span className="cl-pill cl-pill-want" key={skill}><Target size={10} />Learn {skill}</span>)}
          {!match.sharedOfferings.length && !match.canLearn.length && <span className="cl-pill">{match.rationale || 'Potential match'}</span>}
        </div>
      </div>
      <div className="cl-score">
        <span className="cl-score-number">{match.score}%</span>
        <span className="cl-score-label">fit</span>
        <button className="cl-mini-btn" onClick={onRequest}>Connect <ArrowUpRight size={13} /></button>
      </div>
    </article>
  );
}
function RequestRow({ request }) {
  return (
    <div className="cl-request-row">
      <div className="cl-request-info">
        <Avatar user={request.match.user} index={Number(request.match.user.id) || 0} />
        <div><p className="cl-request-skill">{request.skill}</p><p className="cl-request-detail">{request.match.user.name} · {request.createdAt}</p></div>
      </div>
      <Status status={request.status} />
    </div>
  );
}
function Dashboard() {
  const { requests, openRequest, skills, matches, currentUser } = useApp();
  const pending = requests.filter((r) => r.status === 'pending').length;
  return (
    <div className="cl-page">
      <PageHead
        eyebrow="Your campus board"
        title={<>Good to see you, <span className="cl-title-accent">{currentUser ? currentUser.name.split(' ')[0] : ''}.</span></>}
        copy="A few people nearby are looking for exactly what you know. Start with one small exchange."
        action={<Link to="/matches" className="cl-btn cl-btn-primary">Explore matches <ArrowUpRight size={16} /></Link>}
      />
      <div className="cl-hero-strip"><div><span className="cl-hero-kicker">Campus signal</span><p>Small skills. Big orbit.</p></div><CampusGraphic /></div>
      <div className="cl-stat-row">
        <div className="cl-card cl-stat"><span className="cl-stat-label">Thoughtful matches</span><p className="cl-stat-value">{matches.length}</p></div>
        <div className="cl-card cl-stat"><span className="cl-stat-label">Open requests</span><p className="cl-stat-value">{pending}</p></div>
        <div className="cl-card cl-stat"><span className="cl-stat-label">Skills on your board</span><p className="cl-stat-value">{skills.length}</p></div>
      </div>
      <div className="cl-dashboard-grid">
        <div>
          <section className="cl-card cl-card-pad">
            <div className="cl-section-head"><h2 className="cl-section-title">People worth meeting</h2><Link to="/matches" className="cl-section-link">See all matches <ArrowUpRight size={13} style={{ verticalAlign: 'middle' }} /></Link></div>
            <div className="cl-match-list">
              {matches.slice(0, 3).map((match) => <MatchRow key={match.user.id} match={match} onRequest={() => openRequest(match)} />)}
              {matches.length === 0 && <div className="cl-empty"><Search size={23} /><p>No matches yet — add a skill to get started.</p></div>}
            </div>
          </section>
          <section className="cl-card cl-card-pad cl-section-gap">
            <div className="cl-section-head"><h2 className="cl-section-title">Recent activity</h2><Link to="/requests" className="cl-section-link">View requests</Link></div>
            {requests.slice(0, 3).map((request) => <RequestRow key={request.id} request={request} />)}
            {requests.length === 0 && <p className="cl-page-copy" style={{ margin: 0 }}>No requests yet.</p>}
          </section>
        </div>
        <div className="cl-grid">
          <div className="cl-note"><Sparkles size={18} /><h3>A good exchange starts small.</h3><p>You don't need a perfect pitch. Tell someone what you're curious about and let the rest be a conversation.</p><Link to="/matches" className="cl-btn cl-btn-dark">Find someone <ArrowUpRight size={15} /></Link></div>
          <section className="cl-card cl-card-pad">
            <div className="cl-section-head"><h2 className="cl-section-title">Your availability</h2><Link to="/profile" className="cl-section-link">Edit</Link></div>
            <div className="cl-detail"><span className="cl-detail-label"><CalendarDays size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />This week</span><span className="cl-detail-value">{currentUser ? currentUser.availability : ''}</span></div>
            <div className="cl-detail"><span className="cl-detail-label">Best for</span><span className="cl-detail-value">Quick collabs</span></div>
          </section>
        </div>
      </div>
    </div>
  );
}
function MatchesPage() {
  const { openRequest, matches } = useApp();
  const [query, setQuery] = useState('');
  const filtered = matches.filter((match) => `${match.user.name} ${match.user.major}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="cl-page">
      <PageHead eyebrow="The noticeboard" title="Your people are here." copy="No awkward cold outreach. Just a little context on why you might click with someone." action={<button className="cl-btn cl-btn-lime" onClick={() => setQuery('')}><Sparkles size={16} />Refresh the board</button>} />
      <div className="cl-page-toolbar">
        <div className="cl-search"><Search size={16} /><input aria-label="Search by name or major" className="cl-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or major" /></div>
        <select className="cl-select" aria-label="Sort matches"><option>Best fit first</option></select>
      </div>
      {filtered.length ? (
        <div className="cl-match-grid">
          {filtered.map((match) => (
            <article key={match.user.id} className="cl-card cl-profile-match">
              <div className="cl-score-burst">{match.score}%</div>
              <div className="cl-profile-top"><Avatar user={match.user} index={Number(match.user.id) || 0} /><div><h3>{match.user.name}</h3><p className="cl-match-meta">@{match.user.handle} · {match.user.major}</p></div></div>
              <div className="cl-match-tags" style={{ marginTop: 16 }}>
                {match.sharedOfferings.map((skill) => <span className="cl-pill cl-pill-offer" key={skill}><Zap size={10} />You both know {skill}</span>)}
                {match.canLearn.map((skill) => <span className="cl-pill cl-pill-want" key={skill}><Target size={10} />You can learn {skill}</span>)}
              </div>
              <div className="cl-match-reason"><strong>Why this match</strong><br />{match.rationale || 'Your skills complement each other.'}</div>
              <button className="cl-btn cl-btn-primary" onClick={() => openRequest(match)}><MessageCircle size={15} />Start a learning request</button>
            </article>
          ))}
        </div>
      ) : (
        <div className="cl-empty"><Search size={23} /><p>No one on the board matches that search yet.</p></div>
      )}
    </div>
  );
}
function RequestCard({ request, updateRequest }) {
  return (
    <article className="cl-request-card">
      <div className="cl-request-card-head"><div><h3>{request.skill}</h3><p>With {request.match.user.name} · sent {request.createdAt}</p></div><Status status={request.status} /></div>
      <p className="cl-request-note">"{request.note}"</p>
      <div className="cl-request-foot">
        <span className="cl-mono" style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))' }}>
          {request.status === 'completed' ? 'Exchange wrapped' : request.status === 'accepted' ? 'You are connected' : request.status === 'pending' ? 'Waiting for a reply' : 'This request was closed'}
        </span>
        <div className="cl-action-row">
          {request.isReceiver && request.status === 'pending' && (
            <>
              <button className="cl-mini-btn accept" onClick={() => updateRequest(request.id, 'accepted')}><Check size={13} />Accept</button>
              <button className="cl-mini-btn reject" onClick={() => updateRequest(request.id, 'rejected')}><X size={13} />Pass</button>
            </>
          )}
          {request.status === 'accepted' && <button className="cl-mini-btn accept" onClick={() => updateRequest(request.id, 'completed')}><CheckCircle2 size={13} />Mark complete</button>}
          {request.status === 'completed' && <CheckCircle2 size={17} color="hsl(var(--accent-lime))" />}
        </div>
      </div>
    </article>
  );
}
function RequestsPage() {
  const { requests, updateRequest } = useApp();
  const [tab, setTab] = useState('all');
  const visible = tab === 'all' ? requests : requests.filter((r) => r.status === tab);
  const counts = { all: requests.length, pending: requests.filter((r) => r.status === 'pending').length, accepted: requests.filter((r) => r.status === 'accepted').length, completed: requests.filter((r) => r.status === 'completed').length, rejected: requests.filter((r) => r.status === 'rejected').length };
  return (
    <div className="cl-page">
      <PageHead eyebrow="Keep the loop going" title="Your requests." copy="A tiny nudge is all it takes to turn a good match into a real exchange." action={<Link to="/matches" className="cl-btn cl-btn-primary"><Plus size={16} />New request</Link>} />
      <div className="cl-two-col">
        <section className="cl-card cl-card-pad">
          <div className="cl-tabs">
            {['all', 'pending', 'accepted', 'completed', 'rejected'].map((item) => (
              <button key={item} className={`cl-tab ${tab === item ? 'active' : ''}`} onClick={() => setTab(item)}>
                {item === 'all' ? 'All requests' : item[0].toUpperCase() + item.slice(1)} <span className="cl-mono" style={{ fontSize: 10 }}>({counts[item]})</span>
              </button>
            ))}
          </div>
          {visible.length ? visible.map((request) => <RequestCard key={request.id} request={request} updateRequest={updateRequest} />) : <div className="cl-empty"><Inbox size={24} /><p>Nothing in this part of the board yet.</p></div>}
        </section>
        <aside className="cl-grid">
          <div className="cl-card cl-card-pad">
            <div className="cl-section-head"><h2 className="cl-section-title">A little momentum</h2><Zap size={18} color="hsl(var(--accent-magenta))" /></div>
            <p className="cl-page-copy" style={{ margin: 0 }}>Requests are intentionally lightweight. A clear note makes it easy for someone to say yes.</p>
          </div>
          <div className="cl-note cl-note-cyan"><BookOpen size={18} /><h3>Finished something?</h3><p>Mark an exchange complete when you've had your first session.</p></div>
        </aside>
      </div>
    </div>
  );
}
function SkillColumn({ type, skills, removeSkill }) {
  return (
    <div className={`cl-skill-column ${type}`}>
      <h2 className="cl-column-title">{type === 'offer' ? 'I can teach' : 'I want to learn'}</h2>
      <p className="cl-column-copy">{type === 'offer' ? 'The things people can come to you for.' : 'The rabbit holes you are ready to explore.'}</p>
      {skills.length ? skills.map((skill) => (
        <div className="cl-skill-item" key={skill.id}>
          <div><strong>{skill.name}</strong><span>{skill.category} · {skill.proficiency}</span></div>
          <button className="cl-skill-remove" onClick={() => removeSkill(skill.id)} aria-label={`Remove ${skill.name}`}><Trash2 size={14} /></button>
        </div>
      )) : <div className="cl-empty" style={{ padding: 22 }}><p>Nothing pinned here yet.</p></div>}
    </div>
  );
}
function SkillsPage() {
  const { skills, addSkill, removeSkill } = useApp();
  const [name, setName] = useState('');
  const [direction, setDirection] = useState('offer');
  const [category, setCategory] = useState('Design');
  const [proficiency, setProficiency] = useState('Intermediate');
  const submit = (e) => { e.preventDefault(); if (!name.trim()) return; addSkill({ name: name.trim(), direction, category, proficiency }); setName(''); };
  const offer = skills.filter((s) => s.direction === 'offer');
  const want = skills.filter((s) => s.direction === 'want');
  return (
    <div className="cl-page">
      <PageHead eyebrow="Make your exchange legible" title="Your skill board." copy="A generous offer and an honest want are the best introductions." action={<button className="cl-btn cl-btn-primary" onClick={() => document.getElementById('skill-name')?.focus()}><Plus size={16} />Add a skill</button>} />
      <div className="cl-skill-layout">
        <div className="cl-card cl-card-pad">
          <div className="cl-skill-columns"><SkillColumn type="offer" skills={offer} removeSkill={removeSkill} /><SkillColumn type="want" skills={want} removeSkill={removeSkill} /></div>
        </div>
        <form className="cl-card cl-add-form" onSubmit={submit}>
          <div className="cl-section-head"><h2 className="cl-section-title">Pin something new</h2><Plus size={18} color="hsl(var(--accent-magenta))" /></div>
          <div className="cl-form-field"><label className="cl-form-label" htmlFor="skill-name">Skill name</label><input id="skill-name" className="cl-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Motion design" /></div>
          <div className="cl-form-field"><label className="cl-form-label" htmlFor="skill-direction">I want to</label><select id="skill-direction" className="cl-select" style={{ width: '100%' }} value={direction} onChange={(e) => setDirection(e.target.value)}><option value="offer">Teach / offer this</option><option value="want">Learn / want this</option></select></div>
          <div className="cl-form-row">
            <div className="cl-form-field"><label className="cl-form-label" htmlFor="skill-category">Category</label><select id="skill-category" className="cl-select" style={{ width: '100%', minWidth: 0 }} value={category} onChange={(e) => setCategory(e.target.value)}><option>Design</option><option>Technology</option><option>Media</option><option>Business</option><option>Languages</option></select></div>
            <div className="cl-form-field"><label className="cl-form-label" htmlFor="skill-proficiency">Level</label><select id="skill-proficiency" className="cl-select" style={{ width: '100%', minWidth: 0 }} value={proficiency} onChange={(e) => setProficiency(e.target.value)}><option>Beginner</option><option>Intermediate</option><option>Advanced</option><option>Expert</option></select></div>
          </div>
          <button className="cl-btn cl-btn-dark" type="submit" style={{ width: '100%' }}><Plus size={15} />Pin to my board</button>
        </form>
      </div>
    </div>
  );
}
function ProfilePage() {
  const { currentUser, toast } = useApp();
  const [profile, setProfile] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    api.get('/profile', { headers: authHeaders() }).then(res => { if (!cancelled) setProfile(res.data.data); })
      .catch(() => { if (!cancelled) setError('Could not load your profile. Please reload before saving.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);
  const fields = [['phone', 'Phone'], ['location', 'Location'], ['linkedinUrl', 'LinkedIn URL'], ['githubUrl', 'GitHub URL'], ['portfolioUrl', 'Portfolio URL'], ['summary', 'Summary'], ['education', 'Education'], ['experience', 'Experience'], ['achievements', 'Achievements'], ['certifications', 'Certifications'], ['languages', 'Languages']];
  async function save(e) {
    e.preventDefault(); setSaving(true);
    try { await api.put('/profile', Object.fromEntries(fields.map(([key]) => [key, profile[key] || ''])), { headers: authHeaders() }); toast('Profile saved. Resume AI will use these details.'); }
    catch (err) { toast(err.response?.data?.error?.message || 'Could not save profile.'); }
    finally { setSaving(false); }
  }
  return <div className="cl-page"><PageHead eyebrow="Your corner" title="Your profile." copy="Keep the details used by Resume AI accurate and up to date." />
    {currentUser && <p>{currentUser.name} · @{currentUser.handle}</p>}
    {loading ? <p role="status">Loading profile…</p> : error ? <p role="alert">{error}</p> : <form className="cl-card cl-card-pad" onSubmit={save}>
      {fields.map(([key,label]) => <div className="cl-form-field" key={key}><label className="cl-form-label" htmlFor={`profile-${key}`}>{label}</label>
        <textarea id={`profile-${key}`} className="cl-textarea" rows={key.endsWith('Url') || ['phone','location'].includes(key) ? 1 : 3} value={profile[key] || ''} maxLength={20000} onChange={e => setProfile(p => ({...p,[key]:e.target.value}))} />
      </div>)}
      <button className="cl-btn cl-btn-primary" disabled={saving} type="submit">{saving ? 'Saving…' : 'Save profile'}</button>
    </form>}
  </div>;
}
function RequestModal({ match, initialSkill, close }) {
  const { addRequest } = useApp();
  const dialog = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    const previous = document.activeElement;
    const focusable = () => [...dialog.current.querySelectorAll('button, input, select, textarea, a[href]')].filter(el => !el.disabled);
    focusable()[0]?.focus();
    const onKey = e => {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      if (e.key === 'Tab') {
        const elements = focusable(), first = elements[0], last = elements.at(-1);
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); previous?.focus(); };
  }, [close]);
  const [skill, setSkill] = useState(initialSkill || match.canLearn[0] || 'Skill exchange');
  const [note, setNote] = useState(`Hi ${match.user.name.split(' ')[0]}, I liked the way our skills overlap. Would you be up for a low-key exchange sometime?`);
  const submit = async (e) => { e.preventDefault(); if (submitting) return; setSubmitting(true); const ok = await addRequest({ match, skill, note }); setSubmitting(false); if (ok) close(); };
  return (
    <div className="cl-modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <form className="cl-modal" role="dialog" aria-modal="true" aria-labelledby="request-title" ref={dialog} onSubmit={submit}>
        <div className="cl-modal-head">
          <div><p className="cl-eyebrow">A small first step</p><h2 id="request-title">Send {match.user.name.split(' ')[0]} a note.</h2><p className="cl-modal-copy">Specific and low-pressure wins every time.</p></div>
          <button type="button" className="cl-icon-btn" onClick={close} aria-label="Close request dialog"><X size={17} /></button>
        </div>
        <div className="cl-form-field"><label className="cl-form-label" htmlFor="request-skill">What would you like to learn?</label><input id="request-skill" className="cl-input" value={skill} onChange={(e) => setSkill(e.target.value)} /></div>
        <div className="cl-form-field"><label className="cl-form-label" htmlFor="request-note">Your note</label><textarea id="request-note" className="cl-textarea" rows={4} value={note} onChange={(e) => setNote(e.target.value)} /></div>
        <div className="cl-modal-actions"><button type="button" className="cl-btn cl-btn-quiet" onClick={close}>Not yet</button><button type="submit" className="cl-btn cl-btn-primary"><Send size={15} />Send request</button></div>
      </form>
    </div>
  );
}
function AuthPage({ mode }) {
  const navigate = useNavigate();
  const isRegister = mode === 'register';
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');
    const form = new FormData(e.target);
    const email = form.get('email');
    const password = form.get('password');
    try {
      if (isRegister) {
        const name = form.get('name');
        await api.post('/auth/register', { name, email, password });
        navigate('/login');
      } else {
        const res = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', res.data.data.accessToken);
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Something went wrong');
    } finally { setSubmitting(false); }
  };
  return (
    <div className="cl-auth-wrap">
      <section className="cl-auth-art">
        <Logo />
        <CampusGraphic />
        <div className="cl-auth-copy"><p className="cl-eyebrow">A better campus network</p><h1>Everyone here<br /><span className="cl-title-accent">can teach you something.</span></h1><p>CampusLink is where ambitious students find the person who can teach the next piece — without the awkward opener.</p></div>
        <div className="cl-auth-sticker">Made for curious people.</div>
      </section>
      <section className="cl-auth-form-side">
        <div className="cl-auth-form-top"><ThemeToggle /></div>
        <form className="cl-auth-form" onSubmit={submit}>
          <h2>{isRegister ? 'Join the board.' : 'Welcome back.'}</h2>
          <p>{isRegister ? 'Set up your corner of the campus noticeboard.' : 'Your next good exchange might already be waiting.'}</p>
          {error && <p style={{ color: '#c0392b', fontSize: 13, marginBottom: 14 }}>{error}</p>}
          {isRegister && <div className="cl-form-field"><label className="cl-form-label" htmlFor="auth-name">Your name</label><input id="auth-name" name="name" className="cl-input" placeholder="e.g. Maya Chen" required /></div>}
          <div className="cl-form-field"><label className="cl-form-label" htmlFor="auth-email">Campus email</label><input id="auth-email" name="email" type="email" className="cl-input" placeholder="you@campus.edu" required /></div>
          <div className="cl-form-field">
            <label className="cl-form-label" htmlFor="auth-password">Password</label>
            <div style={{ position: 'relative' }}>
              <input id="auth-password" name="password" type={showPassword ? 'text' : 'password'} className="cl-input" placeholder="At least 12 characters" required minLength={isRegister ? 12 : 6} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="cl-password-toggle">{showPassword ? <XCircle size={17} /> : <CircleHelp size={17} />}</button>
            </div>
          </div>
          <button type="submit" disabled={submitting} className="cl-btn cl-btn-primary">{isRegister ? 'Create my profile' : 'Sign in'} <ArrowUpRight size={15} /></button>
          <p className="cl-auth-switch">{isRegister ? 'Already on the board? ' : 'New to the board? '}<Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create an account'}</Link></p>
        </form>
      </section>
    </div>
  );
}
function NotFoundPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <h1>404</h1><p>Page not found.</p>
      <Link to="/" className="cl-btn cl-btn-primary" style={{ width: 'auto' }}>Back to dashboard</Link>
    </div>
  );
}

function CalendarPage() {
  const { toast } = useApp();
  const [events, setEvents] = useState([]);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState('PERSONAL');
  const [customType, setCustomType] = useState('');
  const [startTimeOnly, setStartTimeOnly] = useState('09:00');
  const [endTimeOnly, setEndTimeOnly] = useState('10:00');
  const [location, setLocation] = useState('');
  const [reminderAt, setReminderAt] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.get('/events', { headers: authHeaders() });
      setEvents(res.data.data);
    } catch {}
  }, []);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  useEffect(() => {
    const notified = new Set();
    const interval = setInterval(() => {
      const now = new Date();
      events.forEach((ev) => {
        if (ev.reminderAt && !notified.has(ev.id)) {
          const reminderTime = new Date(ev.reminderAt);
          if (reminderTime <= now) {
            notified.add(ev.id);
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('CampusLink event reminder', { body: ev.title });
            } else {
              toast(`Reminder: ${ev.title}`);
            }
          }
        }
      });
    }, 15000);
    return () => clearInterval(interval);
  }, [events, toast]);

  function enableReminders() {
    if ('Notification' in window) {
      Notification.requestPermission().then((perm) => {
        toast(perm === 'granted' ? 'Reminders enabled.' : 'Notifications blocked — reminders will show as in-app messages instead.');
      });
    }
  }

  function dateKey(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  const eventsByDate = {};
  events.forEach((ev) => {
    const key = dateKey(new Date(ev.startTime));
    if (!eventsByDate[key]) eventsByDate[key] = [];
    eventsByDate[key].push(ev);
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstOfMonth.getDay();
  const monthLabel = viewDate.toLocaleString(undefined, { month: 'long', year: 'numeric' });
  const today = new Date();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const selectedKey = dateKey(selectedDate);
  const selectedEvents = eventsByDate[selectedKey] || [];

  function goPrevMonth() { setViewDate(new Date(year, month - 1, 1)); }
  function goNextMonth() { setViewDate(new Date(year, month + 1, 1)); }
  function goToday() { const t = new Date(); setViewDate(t); setSelectedDate(t); }

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!title.trim()) return;
    const startTime = new Date(`${selectedKey}T${startTimeOnly}`).toISOString();
    const endTime = new Date(`${selectedKey}T${endTimeOnly}`).toISOString();
    if (new Date(startTime) >= new Date(endTime)) {
      setError('Start time must be before end time.');
      return;
    }
    const finalType = eventType === 'OTHER' ? (customType.trim() || 'OTHER') : eventType;
    try {
      await api.post('/events', { title, eventType: finalType, startTime, endTime, location, reminderAt: reminderAt ? new Date(reminderAt).toISOString() : undefined }, { headers: authHeaders() });
      setTitle(''); setLocation(''); setReminderAt(''); setCustomType('');
      toast('Event added.');
      load();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not add event.');
    }
  }

  async function removeEvent(id) {
    try {
      await api.delete(`/events/${id}`, { headers: authHeaders() });
      toast('Event removed.');
      load();
    } catch {
      toast('Could not remove event.');
    }
  }

  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="cl-page">
      <PageHead
        eyebrow="Plan your year"
        title="Your calendar."
        copy="Click any day to see or add events."
        action={<div style={{ display: 'flex', gap: 8 }}><button className="cl-btn cl-btn-quiet" onClick={enableReminders}>Enable reminders</button><button className="cl-btn cl-btn-primary" onClick={goToday}>Today</button></div>}
      />
      <div className="cl-skill-layout">
        <div className="cl-card cl-card-pad">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <button className="cl-mini-btn" onClick={goPrevMonth}>← Prev</button>
            <h2 className="cl-section-title" style={{ margin: 0 }}>{monthLabel}</h2>
            <button className="cl-mini-btn" onClick={goNextMonth}>Next →</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
            {weekdayLabels.map((w) => (
              <div key={w} style={{ textAlign: 'center', fontSize: 11, color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}>{w}</div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {cells.map((d, i) => {
              if (!d) return <div key={i} />;
              const key = dateKey(d);
              const isToday = key === dateKey(today);
              const isSelected = key === selectedKey;
              const hasEvents = !!eventsByDate[key];
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(d)}
                  style={{
                    aspectRatio: '1',
                    border: isSelected ? '2px solid hsl(var(--accent-cobalt))' : '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    background: isToday ? 'hsl(var(--accent-lime) / .3)' : 'hsl(var(--card))',
                    color: 'hsl(var(--foreground))',
                    fontSize: 13,
                    fontWeight: isToday ? 700 : 400,
                    cursor: 'pointer',
                    position: 'relative',
                    padding: 0,
                  }}
                >
                  {d.getDate()}
                  {hasEvents && (
                    <span style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', width: 5, height: 5, borderRadius: '50%', background: 'hsl(var(--accent-magenta))' }} />
                  )}
                </button>
              );
            })}
          </div>

          <div className="cl-section-head" style={{ marginTop: 24 }}>
            <h2 className="cl-section-title">{selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h2>
          </div>
          {selectedEvents.length ? selectedEvents.map((ev) => (
            <div className="cl-skill-item" key={ev.id} style={{ alignItems: 'flex-start' }}>
              <div>
                <strong style={{ display: 'block', fontSize: 13, marginBottom: 2 }}>{ev.title}</strong>
                <span>{ev.eventType} · {new Date(ev.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(ev.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{ev.location ? ` · ${ev.location}` : ''}</span>
              </div>
              <button className="cl-skill-remove" onClick={() => removeEvent(ev.id)}><Trash2 size={14} /></button>
            </div>
          )) : <div className="cl-empty" style={{ padding: 18 }}><p>No events on this day.</p></div>}
        </div>

        <form className="cl-card cl-add-form" onSubmit={submit}>
          <div className="cl-section-head"><h2 className="cl-section-title">Add event to {selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</h2><Plus size={18} color="hsl(var(--accent-magenta))" /></div>
          {error && <p style={{ color: '#c0392b', fontSize: 13, marginBottom: 14 }}>{error}</p>}
          <div className="cl-form-field"><label className="cl-form-label" htmlFor="event-title">Title</label><input id="event-title" className="cl-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Study group" /></div>
          <div className="cl-form-field">
            <label className="cl-form-label" htmlFor="event-type">Type</label>
            <select id="event-type" className="cl-select" style={{ width: '100%' }} value={eventType} onChange={(e) => setEventType(e.target.value)}>
              <option value="PERSONAL">Personal</option>
              <option value="CAMPUS">Campus</option>
              <option value="PROJECT">Project</option>
              <option value="SKILLSWAP">SkillSwap</option>
              <option value="RESOURCE">Resource</option>
              <option value="ACADEMIC">Academic</option>
              <option value="OTHER">Other…</option>
            </select>
          </div>
          {eventType === 'OTHER' && (
            <div className="cl-form-field">
              <label className="cl-form-label" htmlFor="event-custom-type">Custom type</label>
              <input id="event-custom-type" className="cl-input" value={customType} onChange={(e) => setCustomType(e.target.value)} placeholder="e.g. Birthday" />
            </div>
          )}
          <div className="cl-form-row">
            <div className="cl-form-field"><label className="cl-form-label" htmlFor="event-start">Starts</label><input id="event-start" type="time" className="cl-input" value={startTimeOnly} onChange={(e) => setStartTimeOnly(e.target.value)} /></div>
            <div className="cl-form-field"><label className="cl-form-label" htmlFor="event-end">Ends</label><input id="event-end" type="time" className="cl-input" value={endTimeOnly} onChange={(e) => setEndTimeOnly(e.target.value)} /></div>
          </div>
          <div className="cl-form-field"><label className="cl-form-label" htmlFor="event-location">Location</label><input id="event-location" className="cl-input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Library room 2" /></div>
          <div className="cl-form-field"><label className="cl-form-label" htmlFor="event-reminder">Reminder</label><input id="event-reminder" type="datetime-local" className="cl-input" value={reminderAt} onChange={(e) => setReminderAt(e.target.value)} /></div>
          <button className="cl-btn cl-btn-dark" type="submit" style={{ width: '100%' }}><Plus size={15} />Add event</button>
        </form>
      </div>
    </div>
  );
}
function ProjectsPage() {
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
function MyProjectsPage() {
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
function ProjectDetailPage() {
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



const ResumePage = lazy(() => import('./pages/ResumeAI'));

function AppInner() {
  const location = useLocation().pathname;
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem('campuslink-theme') || 'light');
  const [currentUser, setCurrentUser] = useState(null);
  const [skills, setSkills] = useState([]);
  const [matches, setMatches] = useState([]);
  const [requests, setRequests] = useState([]);
  const [modal, setModal] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('campuslink-theme', theme);
  }, [theme]);

  const normalizedPath = location.replace(/\/+$/, '') || '/';
  const isAuthPage = normalizedPath === '/login' || normalizedPath === '/register';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token && !isAuthPage) navigate('/login');
  }, [location, isAuthPage, navigate]);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me', { headers: authHeaders() });
      setCurrentUser(hydrateUser(res.data.data));
      return res.data.data.id;
    } catch (err) { setCurrentUser(null); if (err.response?.status === 401) { localStorage.removeItem('token'); navigate('/login', { replace: true }); } return null; }
  }, [navigate]);
  const refreshSkills = useCallback(async () => {
    try { const res = await api.get('/skillswap/skills/mine', { headers: authHeaders() }); setSkills(res.data.data.map(hydrateSkill)); } catch {}
  }, []);
  const refreshMatches = useCallback(async () => {
    try { const res = await api.get('/skillswap/matches', { headers: authHeaders() }); setMatches(res.data.data.map(hydrateMatch)); } catch {}
  }, []);
  const refreshRequests = useCallback(async (myId) => {
    try { const res = await api.get('/skillswap/requests', { headers: authHeaders() }); setRequests(res.data.data.map((r) => hydrateRequest(r, myId))); } catch {}
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || isAuthPage) return;
    (async () => {
      const myId = await refreshUser();
      if (!myId) return;
      await Promise.all([refreshSkills(), refreshMatches(), refreshRequests(myId)]);
    })();
  }, [location, isAuthPage, refreshUser, refreshSkills, refreshMatches, refreshRequests]);

  const toast = useCallback((message) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(''), 2600);
  }, []);

  async function addSkill(skill) {
    try {
      await api.post('/skillswap/skills', { skillName: skill.name, category: skill.category, type: skill.direction === 'offer' ? 'OFFERED' : 'WANTED', proficiency: skill.proficiency.toUpperCase() }, { headers: authHeaders() });
      toast('Pinned to your skill board.');
      refreshSkills(); refreshMatches();
    } catch (err) { toast(err.response?.data?.error?.message || 'Could not add skill.'); }
  }
  async function removeSkill(id) {
    try { await api.delete(`/skillswap/skills/${id}`, { headers: authHeaders() }); toast('Removed from your board.'); refreshSkills(); refreshMatches(); }
    catch { toast('Could not remove skill.'); }
  }
  async function addRequest({ match, skill, note }) {
    try {
      await api.post('/skillswap/requests', { receiverId: match.user.id, message: `${skill}: ${note}` }, { headers: authHeaders() });
      toast(`Request sent to ${match.user.name.split(' ')[0]}. Nice move.`);
      if (currentUser) refreshRequests(currentUser.id);
      return true;
    } catch (err) { toast(err.response?.data?.error?.message || 'Could not send request.'); return false; }
  }
  async function updateRequestStatus(id, status) {
    try {
      await api.patch(`/skillswap/requests/${id}`, { status: status.toUpperCase() }, { headers: authHeaders() });
      toast(`Request marked ${status}.`);
      if (currentUser) refreshRequests(currentUser.id);
    } catch { toast('Could not update request.'); }
  }

  const pendingCount = requests.filter((r) => r.status === 'pending' && r.isReceiver).length;

  const context = {
    currentUser, skills, matches, requests, theme, pendingCount,
    toggleTheme: () => setTheme((t) => (t === 'light' ? 'dark' : 'light')),
    addRequest, addSkill, removeSkill,
    updateRequest: updateRequestStatus,
    openRequest: (match, skill) => setModal({ match, skill }),
    toast,
  };

  const pages = (
    <Suspense fallback={<p role="status">Loading page…</p>}><Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/matches" element={<MatchesPage />} />
      <Route path="/requests" element={<RequestsPage />} />
      <Route path="/skills" element={<SkillsPage />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/projects" element={<ProjectsPage />} />
      <Route path="/projects/mine" element={<MyProjectsPage />} />
      <Route path="/projects/:id" element={<ProjectDetailPage />} />

      <Route path="/resume" element={<ResumePage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes></Suspense>
  );

  return (
    <AppContext.Provider value={context}>
      {!isAuthPage && !localStorage.getItem('token') ? <Navigate to="/login" replace /> : isAuthPage ? pages : <Shell>{pages}</Shell>}
      {modal && <RequestModal match={modal.match} initialSkill={modal.skill} close={() => setModal(null)} />}
      {toastMessage && <div className="cl-toast">{toastMessage}</div>}
    </AppContext.Provider>
  );
}
export default function App() {
  return <BrowserRouter><AppInner /></BrowserRouter>;
}