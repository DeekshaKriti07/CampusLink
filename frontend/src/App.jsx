import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Navigate, BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { AppContext, authHeaders } from './context';
import api from './services/api';
import { Shell } from './components/BoardUI';
import AuthPage from './pages/AuthPage';
import RequestModal from './components/RequestModal';

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
function NotFoundPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <h1>404</h1><p>Page not found.</p>
      <Link to="/" className="cl-btn cl-btn-primary" style={{ width: 'auto' }}>Back to dashboard</Link>
    </div>
  );
}


import Dashboard from './pages/Dashboard';
const MatchesPage = lazy(() => import('./pages/MatchesPage'));
const RequestsPage = lazy(() => import('./pages/RequestsPage'));
const SkillsPage = lazy(() => import('./pages/SkillsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const ResumePage = lazy(() => import('./pages/ResumeAI'));
const ProjectsPage = lazy(() => import('./pages/Projects').then(module => ({ default: module.ProjectsPage })));
const MyProjectsPage = lazy(() => import('./pages/Projects').then(module => ({ default: module.MyProjectsPage })));
const ProjectDetailPage = lazy(() => import('./pages/Projects').then(module => ({ default: module.ProjectDetailPage })));

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
    let cancelled = false;
    api.get('/skillswap/board', { headers: authHeaders() }).then(res => {
      if (cancelled) return;
      const { user, skills: boardSkills, matches: boardMatches, requests: boardRequests } = res.data.data;
      setCurrentUser(hydrateUser(user));
      setSkills(boardSkills.map(hydrateSkill));
      setMatches(boardMatches.map(hydrateMatch));
      setRequests(boardRequests.map(request => hydrateRequest(request, user.id)));
    }).catch(err => {
      if (cancelled) return;
      if (err.response?.status === 401) {
        localStorage.removeItem('token'); setCurrentUser(null); navigate('/login', { replace: true });
      }
    });
    return () => { cancelled = true; };
  }, [location, isAuthPage, navigate]);

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