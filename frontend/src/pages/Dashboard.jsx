import { ArrowUpRight, CalendarDays, Search, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../context';
import PageHead from '../components/PageHead';
import { CampusGraphic, MatchRow, RequestRow } from '../components/BoardUI';

export default function Dashboard() {
  const { requests, openRequest, skills, matches, currentUser } = useApp();
  const pending = requests.filter((r) => r.status === 'pending').length;
  return (
    <div className="cl-page">
      <PageHead
        eyebrow="Your campus board"
        title={<>Good to see you,<span className="cl-title-accent cl-dashboard-name">{currentUser ? `${currentUser.name.split(' ')[0]}.` : '\u00a0'}</span></>}
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
