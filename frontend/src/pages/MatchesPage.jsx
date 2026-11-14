import { useState } from 'react';
import { MessageCircle, Search, Sparkles, Target, Zap } from 'lucide-react';
import { useApp } from '../context';
import PageHead from '../components/PageHead';
import { Avatar } from '../components/BoardUI';

export default function MatchesPage() {
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
