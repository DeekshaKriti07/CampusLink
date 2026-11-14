import { useEffect, useRef, useState } from 'react';
import { Send, X } from 'lucide-react';
import { useApp } from '../context';

export default function RequestModal({ match, initialSkill, close }) {
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
