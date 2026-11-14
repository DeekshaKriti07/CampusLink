import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useApp } from '../context';
import PageHead from '../components/PageHead';

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
export default function SkillsPage() {
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
