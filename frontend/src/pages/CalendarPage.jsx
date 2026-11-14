import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import api from '../services/api';
import { useApp, authHeaders } from '../context';
import PageHead from '../components/PageHead';

export default function CalendarPage() {
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
