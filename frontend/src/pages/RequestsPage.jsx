import { useState } from 'react';
import { BookOpen, Check, CheckCircle2, Inbox, Plus, X, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../context';
import PageHead from '../components/PageHead';
import { Status } from '../components/BoardUI';

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
export default function RequestsPage() {
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
