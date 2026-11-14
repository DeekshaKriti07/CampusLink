import { useState } from 'react';
import { ArrowUpRight, CircleHelp, XCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Logo, ThemeToggle, CampusGraphic } from '../components/BoardUI';

export default function AuthPage({ mode }) {
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
