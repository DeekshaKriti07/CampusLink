import { useState } from 'react';
import { ArrowUpRight, Bell, CalendarDays, Compass, Home, Inbox, Layers3, Menu, Moon, Settings2, Sparkles, Sun, Target, UserRound, Zap } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context';

const avatarClasses = ['cl-avatar', 'cl-avatar-cyan', 'cl-avatar-lime', 'cl-avatar-magenta'];
export function Avatar({ user, index = 0, large = false }) {
  return <div className={`${avatarClasses[index % avatarClasses.length]} ${large ? 'cl-avatar-large' : ''} cl-avatar`}>{user.avatar}</div>;
}
export function Logo() {
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
export function ThemeToggle() {
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
export function CampusGraphic() {
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
export function Shell({ children }) {
  return <div className="cl-app cl-shell"><Sidebar /><main className="cl-main"><MobileTopbar />{children}</main></div>;
}
export function Status({ status }) {
  return <span className={`cl-status status-${status}`}>{status}</span>;
}
export function MatchRow({ match, onRequest }) {
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
export function RequestRow({ request }) {
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
