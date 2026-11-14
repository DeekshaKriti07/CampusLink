import { useEffect, useState } from 'react';
import api from '../services/api';
import { useApp, authHeaders } from '../context';
import PageHead from '../components/PageHead';

export default function ProfilePage() {
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
