import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase.js";
import {
  C, CARD, SEL, ROL_LABELS, ROL_COLORS, IVA_RATE, CR_UTC_OFFSET_MS, toCRDate,
  MONTHS_SHORT, MONTHS_LONG, USD_RATE, loadCoachRoster, getCoachNames, getCoachColors,
  toast, DiloDot, DiloLogo, Icon, Badge, StatCard, ProgressBar, SectionHeader, NAV,
  isoFmt, ANON_KEY, EDGE_URL, ATTENDANCE_URL, WHATSAPP_URL, CASHIER_URL, CASHIER_INTENT_URL,
  ONVO_PUBLIC_KEY, SCHED, SHEET_CLASS, SHEET_STUDENT, SHEET_SURVEYS,
  COACHES, COACH_COLORS, FB_COACHES, AVATAR_COLORS, VIEW_TITLES, STU_LEVELS, crToday, PlaceholderView,
} from "../lib/shared.jsx";

// ── VIEW TITLES (shown in top bar) ────────────────────────────
// ── DINÁMICAS ──────────────────────────────────────────────────
const OPT_COLORS = ['#7a2020','#1e427a','#7a621e','#1e6645'];
function getYouTubeId(url) {
  const m = (url || '').match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export function DinamicasView({ user }) {
  const [sub, setSub]                 = useState('list');
  const [decks, setDecks]             = useState([]);
  const [editDeck, setEditDeck]       = useState(null);
  const [editingSlide, setEditingSlide] = useState(null);
  const [session, setSession]         = useState(null);
  const [sessionSlides, setSessionSlides] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [responses, setResponses]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [titleEditing, setTitleEditing] = useState(false);
  const [previewSlide, setPreviewSlide] = useState(0);
  const [slidesToDelete, setSlidesToDelete] = useState([]);
  const chanRef = useRef(null);
  const rtfRef  = useRef(null);

  const BTN  = { background: C.text, color: C.bg, border: "none", borderRadius: 50, fontFamily: "inherit", fontSize: 13, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", padding: "8px 18px", cursor: "pointer", minHeight: 38, whiteSpace: "nowrap" };
  const GHOST = { background: "transparent", border: `1px solid ${C.border2}`, borderRadius: 50, fontFamily: "inherit", fontSize: 12, fontWeight: 600, color: C.text2, padding: "6px 14px", cursor: "pointer", minHeight: 34, whiteSpace: "nowrap" };

  useEffect(() => { loadDecks(); return () => { if (chanRef.current) supabase.removeChannel(chanRef.current); }; }, []);

  useEffect(() => {
    if (rtfRef.current && sub === 'editor' && editDeck && editingSlide !== null) {
      rtfRef.current.innerHTML = editDeck.slides[editingSlide]?.question || '';
    }
  }, [editingSlide, sub]);

  async function loadDecks() {
    setLoading(true);
    const { data } = await supabase.from('decks').select('id,title,created_at').eq('coach_id', user.id).order('created_at', { ascending: false });
    const withCount = await Promise.all((data || []).map(async d => {
      const { count } = await supabase.from('slides').select('*', { count: 'exact', head: true }).eq('deck_id', d.id);
      return { ...d, slide_count: count || 0 };
    }));
    setDecks(withCount);
    setLoading(false);
  }

  function createDeck() {
    const tempId = 'new-' + Date.now();
    setEditDeck({ id: tempId, coach_id: user.id, title: 'New presentation', slides: [] });
    setEditingSlide(null);
    setTitleEditing(false);
    setSlidesToDelete([]);
    setSub('editor');
  }

  async function openEditor(deck) {
    const { data: slides } = await supabase.from('slides').select('*').eq('deck_id', deck.id).order('position');
    const sl = slides || [];
    setEditDeck({ ...deck, slides: sl });
    setEditingSlide(sl.length ? 0 : null);
    setSlidesToDelete([]);
    setSub('editor');
  }

  async function saveDeck() {
    setSaving(true);
    try {
      let deckId = editDeck.id;

      if (String(deckId).startsWith('new-')) {
        const { data: newDeck, error: deckErr } = await supabase
          .from('decks').insert({ coach_id: user.id, title: editDeck.title }).select().single();
        if (deckErr) throw new Error('deck insert: ' + deckErr.message);
        deckId = newDeck.id;
      } else {
        const { error: deckErr } = await supabase.from('decks').update({ title: editDeck.title }).eq('id', deckId);
        if (deckErr) throw new Error('deck update: ' + deckErr.message);
      }

      for (const slideId of slidesToDelete) {
        await supabase.from('responses').delete().eq('slide_id', slideId);
        const { error } = await supabase.from('slides').delete().eq('id', slideId);
        if (error) throw new Error('slide delete: ' + error.message);
      }
      setSlidesToDelete([]);

      for (const slide of editDeck.slides) {
        const payload = { deck_id: deckId, position: slide.position, type: slide.type, question: slide.question, options: slide.options, correct_answer: slide.correct_answer, time_limit: slide.time_limit, branch_targets: slide.branch_targets || null, image_url: slide.image_url || null, video_url: slide.video_url || null };
        if (String(slide.id).startsWith('new-')) {
          const { error } = await supabase.from('slides').insert(payload);
          if (error) throw new Error('slide insert: ' + error.message);
        } else {
          const { error } = await supabase.from('slides').update(payload).eq('id', slide.id);
          if (error) throw new Error('slide update: ' + error.message);
        }
      }

      await loadDecks();
      setSub('list');
    } catch (err) {
      console.error('[save] ERROR:', err.message);
      toast('Save error: ' + err.message);
    }
    setSaving(false);
  }

  async function deleteDeck(id) {
    const { data: slideRows } = await supabase.from('slides').select('id').eq('deck_id', id);
    const slideIds = (slideRows || []).map(s => s.id);
    if (slideIds.length > 0) {
      const { error: rErr } = await supabase.from('responses').delete().in('slide_id', slideIds);
      if (rErr) { toast('Error deleting responses: ' + rErr.message); return; }
    }
    const { error: sErr } = await supabase.from('slides').delete().eq('deck_id', id);
    if (sErr) { toast('Error deleting slides: ' + sErr.message); return; }
    const { error: seErr } = await supabase.from('sessions').delete().eq('deck_id', id);
    if (seErr) { toast('Error deleting sessions: ' + seErr.message); return; }
    const { error: dErr } = await supabase.from('decks').delete().eq('id', id);
    if (dErr) { toast('Error deleting deck: ' + dErr.message); return; }
    loadDecks();
  }

  function deleteSlide(idx) {
    const slide = editDeck.slides[idx];
    if (!String(slide.id).startsWith('new-')) {
      setSlidesToDelete(prev => [...prev, slide.id]);
    }
    const newSlides = editDeck.slides.filter((_, i) => i !== idx).map((s, i) => ({ ...s, position: i }));
    setEditDeck(p => ({ ...p, slides: newSlides }));
    setEditingSlide(newSlides.length ? Math.min(idx, newSlides.length - 1) : null);
  }

  function makeSlide(type, position) {
    return {
      id: 'new-' + Date.now(), deck_id: editDeck.id, position,
      type, question: '', options: ['','','',''], correct_answer: null,
      time_limit: ['multiple_choice','story_choice'].includes(type) ? 30 : 0,
      branch_targets: type === 'story_choice' ? [null,null,null,null] : null,
      image_url: null, video_url: null,
    };
  }

  function addSlide(type) {
    const s = makeSlide(type, editDeck.slides.length);
    const newSlides = [...editDeck.slides, s];
    setEditDeck(p => ({ ...p, slides: newSlides }));
    setEditingSlide(newSlides.length - 1);
  }

  function addSlideAfter(afterIdx, type) {
    const s = makeSlide(type, afterIdx + 1);
    const before = editDeck.slides.slice(0, afterIdx + 1);
    const after  = editDeck.slides.slice(afterIdx + 1);
    const all    = [...before, s, ...after].map((sl, i) => ({ ...sl, position: i }));
    setEditDeck(p => ({ ...p, slides: all }));
    setEditingSlide(afterIdx + 1);
  }

  function updateSlide(idx, field, value) {
    setEditDeck(p => ({ ...p, slides: p.slides.map((s, i) => i === idx ? { ...s, [field]: value } : s) }));
  }

  function updateOption(slideIdx, optIdx, value) {
    const opts = [...(editDeck.slides[slideIdx].options || ['','','',''])];
    opts[optIdx] = value;
    updateSlide(slideIdx, 'options', opts);
  }

  function updateBranchTarget(slideIdx, optIdx, value) {
    const targets = [...(editDeck.slides[slideIdx].branch_targets || [null,null,null,null])];
    targets[optIdx] = value === '' ? null : parseInt(value);
    updateSlide(slideIdx, 'branch_targets', targets);
  }

  function createBranches(slideIdx) {
    const slide = editDeck.slides[slideIdx];
    const validOpts = (slide.options || []).map((o, i) => ({ o, i })).filter(x => x.o.trim());
    if (validOpts.length < 2) return;
    const insertAt = slideIdx + 1;
    const newSlides = validOpts.map(({ o }, bi) => ({
      id: 'new-' + Date.now() + '-' + bi,
      deck_id: editDeck.id, position: insertAt + bi,
      type: 'story', question: '',
      options: ['','','',''], correct_answer: null, time_limit: 0, branch_targets: null,
    }));
    const branchTargets = (slide.options || []).map((o, oi) => {
      if (!o.trim()) return null;
      const bi = validOpts.findIndex(x => x.i === oi);
      return bi >= 0 ? insertAt + bi : null;
    });
    const updatedChoice = { ...slide, branch_targets: branchTargets };
    const before = editDeck.slides.slice(0, slideIdx);
    const after  = editDeck.slides.slice(slideIdx + 1).map((s, i) => ({ ...s, position: insertAt + newSlides.length + i }));
    const all = [...before, updatedChoice, ...newSlides, ...after].map((s, i) => ({ ...s, position: i }));
    setEditDeck(p => ({ ...p, slides: all }));
    setEditingSlide(insertAt);
  }

  async function startSession(deckId, title) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { data: sess } = await supabase.from('sessions').insert({ deck_id: deckId, coach_id: user.id, code, status: 'waiting', current_slide_index: 0 }).select().single();
    const { data: slides } = await supabase.from('slides').select('*').eq('deck_id', deckId).order('position');
    setSession({ ...sess, deck_title: title });
    setSessionSlides(slides || []);
    setParticipants([]);
    setResponses([]);
    setSub('host');
    if (chanRef.current) supabase.removeChannel(chanRef.current);
    chanRef.current = supabase.channel('session-' + sess.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'session_participants', filter: `session_id=eq.${sess.id}` }, p => setParticipants(prev => [...prev, p.new]))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'responses', filter: `session_id=eq.${sess.id}` }, p => setResponses(prev => {
        const filtered = prev.filter(r => !(r.participant_id === p.new.participant_id && r.slide_id === p.new.slide_id));
        return [...filtered, p.new];
      }))
      .subscribe();
  }

  async function advanceSlide(newIdx) {
    const { data } = await supabase.from('sessions').update({ current_slide_index: newIdx, slide_started_at: new Date().toISOString() }).eq('id', session.id).select().single();
    setSession(p => ({ ...p, ...data }));
    setResponses([]);
  }

  async function setStatus(status) {
    const { data } = await supabase.from('sessions').update({ status }).eq('id', session.id).select().single();
    setSession(p => ({ ...p, ...data }));
    if (status === 'ended' && chanRef.current) supabase.removeChannel(chanRef.current);
  }

  async function advanceToWinner() {
    const slide = sessionSlides[session.current_slide_index];
    const slideResps = responses.filter(r => r.slide_id === slide?.id);
    const counts = (slide.options || []).map((_, oi) => slideResps.filter(r => r.answer === String(oi)).length);
    const maxCount = Math.max(...counts, 0);
    const winnerIdx = counts.findIndex(c => c === maxCount && maxCount > 0);
    const targets = slide.branch_targets || [];
    const targetIdx = (winnerIdx >= 0 && targets[winnerIdx] != null) ? targets[winnerIdx] : session.current_slide_index + 1;
    if (targetIdx < sessionSlides.length) await advanceSlide(targetIdx);
    else await setStatus('ended');
  }

  // ── LIST ────────────────────────────────────────────────────────
  if (sub === 'list') return (
    <div style={{ maxWidth: 760, width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <p style={{ fontSize: 15, color: C.text2 }}>Interactive presentations for your live classes.</p>
        <button onClick={createDeck} style={{ background: C.green, border: 'none', borderRadius: 50, color: '#0d0b08', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, padding: '7px 20px', cursor: 'pointer', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          + New
        </button>
      </div>
      {loading ? <p style={{ color: C.text2, fontSize: 13 }}>Loading...</p>
        : decks.length === 0 ? (
          <div style={{ ...CARD, borderRadius: 16, padding: '3rem', textAlign: 'center' }}>
            <Icon name="slides" size={32} color={C.text3} />
            <p style={{ fontSize: 15, fontWeight: 700, color: C.text, marginTop: '1rem', marginBottom: 4 }}>No presentations yet</p>
            <p style={{ fontSize: 13, color: C.text2 }}>Create your first interactive deck.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {decks.map(d => (
              <div key={d.id} style={{ ...CARD, borderRadius: 14, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(240,236,224,0.06)', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="slides" size={18} color={C.text2} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</p>
                  <p style={{ fontSize: 12, color: C.text3 }}>{d.slide_count} slide{d.slide_count !== 1 ? 's' : ''}</p>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => openEditor(d)} style={GHOST}>Edit</button>
                  <button onClick={() => startSession(d.id, d.title)} style={BTN}>Start</button>
                  <button onClick={() => deleteDeck(d.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.text3, fontSize: 18, padding: '0 4px', lineHeight: 1 }}>×</button>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );

  // ── EDITOR ──────────────────────────────────────────────────────
  if (sub === 'editor' && editDeck) {
    const slide = editingSlide !== null ? editDeck.slides[editingSlide] : null;
    return (
      <div style={{ maxWidth: 860, width: '100%' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
            <button onClick={() => { loadDecks(); setSub('list'); }} style={{ background: 'transparent', border: `1px solid ${C.border2}`, borderRadius: 50, color: C.text2, fontFamily: 'inherit', fontSize: 16, fontWeight: 700, padding: '4px 14px', cursor: 'pointer', lineHeight: 1 }}>‹</button>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => { setPreviewSlide(editingSlide ?? 0); setSub('preview'); }}
                style={{ background: 'rgba(240,236,224,0.08)', border: `1px solid rgba(240,236,224,0.2)`, borderRadius: 50, color: C.text, fontFamily: 'inherit', fontSize: 13, fontWeight: 700, padding: '7px 20px', cursor: 'pointer', letterSpacing: '0.04em' }}>
                Preview
              </button>
              <button onClick={saveDeck} disabled={saving}
                style={{ background: C.green, border: 'none', borderRadius: 50, color: '#0d0b08', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, padding: '7px 20px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.5 : 1, letterSpacing: '0.04em' }}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {titleEditing ? (
              <input autoFocus value={editDeck.title}
                onChange={e => setEditDeck(p => ({ ...p, title: e.target.value }))}
                onBlur={() => setTitleEditing(false)}
                onKeyDown={e => e.key === 'Enter' && setTitleEditing(false)}
                style={{ flex: 1, background: 'rgba(240,236,224,0.05)', border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 10px', fontSize: 18, fontWeight: 700, color: C.text, fontFamily: 'inherit', outline: 'none' }} />
            ) : (
              <>
                <p style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{editDeck.title || 'Untitled'}</p>
                <button onClick={() => setTitleEditing(true)} title="Rename" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.text3, fontSize: 14, padding: '2px 4px', lineHeight: 1 }}>✎</button>
              </>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          {/* Slide list */}
          <div style={{ width: 170, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
            {editDeck.slides.map((s, i) => (
              <button key={s.id} onClick={() => setEditingSlide(i)}
                style={{ textAlign: 'left', padding: '8px 10px', borderRadius: 9, border: `1px solid ${editingSlide === i ? C.border2 : C.border}`, background: editingSlide === i ? 'rgba(240,236,224,0.06)' : 'transparent', cursor: 'pointer', color: C.text, fontFamily: 'inherit' }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.text3, marginBottom: 2 }}>
                  {({story:'Story',story_choice:'Choice',open_question:'Open',info:'Info',multiple_choice:'Quiz'})[s.type] || s.type} · {i + 1}
                </p>
                <p style={{ fontSize: 12, color: s.question ? C.text2 : C.text3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 148 }}>
                  {s.question ? s.question.replace(/<[^>]+>/g, '') : 'Sin texto'}
                </p>
              </button>
            ))}
            <button onClick={() => addSlide('story')} style={{ ...GHOST, width: '100%', marginTop: 4, fontSize: 11 }}>+ Story</button>
            <button onClick={() => addSlide('story_choice')} style={{ ...GHOST, width: '100%', marginTop: 4, fontSize: 11 }}>+ Choice</button>
            <button onClick={() => addSlide('open_question')} style={{ ...GHOST, width: '100%', marginTop: 4, fontSize: 11 }}>+ Open Q</button>
            <button onClick={() => addSlide('multiple_choice')} style={{ ...GHOST, width: '100%', marginTop: 4, fontSize: 11 }}>+ Quiz MC</button>
            <button onClick={() => addSlide('info')} style={{ ...GHOST, width: '100%', marginTop: 4, fontSize: 11 }}>+ Info</button>
          </div>

          {/* Slide editor */}
          <div style={{ flex: 1, ...CARD, borderRadius: 14, padding: '1.25rem', minHeight: 360 }}>
            {!slide ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 300, color: C.text3, fontSize: 13 }}>
                Select or add a slide
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Type + delete */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[{id:'story',label:'Story'},{id:'story_choice',label:'Choice'},{id:'open_question',label:'Open Q'},{id:'multiple_choice',label:'Quiz MC'},{id:'info',label:'Info'}].map(t => (
                    <button key={t.id} onClick={() => updateSlide(editingSlide, 'type', t.id)}
                      style={{ ...GHOST, fontSize: 11, padding: '4px 10px', borderColor: slide.type === t.id ? C.text3 : C.border, color: slide.type === t.id ? C.text : C.text2 }}>
                      {t.label}
                    </button>
                  ))}
                  <button onClick={() => deleteSlide(editingSlide)} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer', color: C.text3, fontSize: 12, fontFamily: 'inherit' }}>
                    Delete slide
                  </button>
                </div>

                {/* Question / Content — rich text editor */}
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3, display: 'block', marginBottom: 5 }}>
                    {slide.type === 'info' ? 'Content' : slide.type === 'story' ? 'Narration' : 'Question'}
                  </label>
                  <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', background: 'rgba(240,236,224,0.05)' }}>
                    {/* Toolbar */}
                    <div style={{ display: 'flex', gap: 2, padding: '5px 8px', borderBottom: `1px solid ${C.border}`, background: 'rgba(240,236,224,0.03)' }}>
                      {[
                        { cmd: 'bold',          label: <b>B</b> },
                        { cmd: 'italic',        label: <i>I</i> },
                        { cmd: 'underline',     label: <u>U</u> },
                        { cmd: 'insertUnorderedList', label: '≡' },
                      ].map(({ cmd, label }) => (
                        <button key={cmd} onMouseDown={e => { e.preventDefault(); document.execCommand(cmd, false, null); rtfRef.current?.focus(); updateSlide(editingSlide, 'question', rtfRef.current?.innerHTML || ''); }}
                          style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 5, color: C.text2, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, padding: '2px 8px', lineHeight: 1.4 }}>
                          {label}
                        </button>
                      ))}
                    </div>
                    {/* Editable area */}
                    <div ref={rtfRef} contentEditable suppressContentEditableWarning
                      onInput={() => updateSlide(editingSlide, 'question', rtfRef.current?.innerHTML || '')}
                      style={{ minHeight: slide.type === 'story' ? 110 : 72, padding: '9px 12px', color: C.text, fontSize: 14, fontFamily: 'inherit', outline: 'none', lineHeight: 1.6 }}
                      data-placeholder={
                        slide.type === 'info'         ? 'Information for students...' :
                        slide.type === 'story'        ? 'Write the story narration here...' :
                        slide.type === 'story_choice' ? 'What should the protagonist do?' :
                        slide.type === 'open_question'? 'How would you feel if...?' :
                        'What is the correct form of...?'
                      }
                    />
                  </div>
                </div>

                {/* Options — MC */}
                {slide.type === 'multiple_choice' && (
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3, display: 'block', marginBottom: 5 }}>
                      Options <span style={{ fontWeight: 400, fontSize: 10 }}>(tap the letter to mark correct)</span>
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {(slide.options || ['','','','']).map((opt, oi) => (
                        <div key={oi} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <button onClick={() => updateSlide(editingSlide, 'correct_answer', slide.correct_answer === oi ? null : oi)}
                            style={{ width: 28, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer', background: slide.correct_answer === oi ? OPT_COLORS[oi] : 'rgba(240,236,224,0.1)', color: '#fff', fontWeight: 900, fontSize: 13, flexShrink: 0, fontFamily: 'inherit' }}>
                            {String.fromCharCode(65 + oi)}
                          </button>
                          <input value={opt} onChange={e => updateOption(editingSlide, oi, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                            style={{ flex: 1, background: 'rgba(240,236,224,0.05)', border: `1px solid ${C.border}`, borderRadius: 7, padding: '6px 10px', color: C.text, fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Options + branch targets — story_choice */}
                {slide.type === 'story_choice' && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                      <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3 }}>
                        Options <span style={{ fontWeight: 400 }}>— branch target per option</span>
                      </label>
                      <button onClick={() => createBranches(editingSlide)}
                        style={{ ...GHOST, fontSize: 10, padding: '3px 10px', color: C.text3 }}
                        title="Inserts one Story slide per filled option and wires up branch targets automatically">
                        ✦ Create branches
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(slide.options || ['','','','']).map((opt, oi) => (
                        <div key={oi} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span style={{ width: 28, height: 28, borderRadius: 6, background: OPT_COLORS[oi], color: '#fff', fontWeight: 900, fontSize: 13, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>
                            {String.fromCharCode(65 + oi)}
                          </span>
                          <input value={opt} onChange={e => updateOption(editingSlide, oi, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                            style={{ flex: 1, background: 'rgba(240,236,224,0.05)', border: `1px solid ${C.border}`, borderRadius: 7, padding: '6px 10px', color: C.text, fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                          <select value={slide.branch_targets?.[oi] ?? ''}
                            onChange={e => updateBranchTarget(editingSlide, oi, e.target.value)}
                            style={{ background: 'rgba(240,236,224,0.05)', border: `1px solid ${C.border}`, borderRadius: 7, padding: '6px 8px', color: C.text2, fontSize: 11, fontFamily: 'inherit', outline: 'none', width: 96 }}>
                            <option value="">→ Next</option>
                            {editDeck.slides.map((_, si) => (
                              <option key={si} value={si}>→ Slide {si + 1}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timer — only for timed types */}
                {['multiple_choice','story_choice'].includes(slide.type) && (
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3, display: 'block', marginBottom: 5 }}>Timer</label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {[0,15,30,60,90].map(t => (
                        <button key={t} onClick={() => updateSlide(editingSlide, 'time_limit', t)}
                          style={{ ...GHOST, fontSize: 11, padding: '4px 10px', borderColor: slide.time_limit === t ? C.text3 : C.border, color: slide.time_limit === t ? C.text : C.text2 }}>
                          {t === 0 ? 'No limit' : `${t}s`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Image URL */}
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3, display: 'block', marginBottom: 5 }}>Image URL <span style={{ fontWeight: 400 }}>(optional)</span></label>
                  <input type="url" value={slide.image_url || ''} onChange={e => updateSlide(editingSlide, 'image_url', e.target.value || null)}
                    placeholder="https://..."
                    style={{ width: '100%', background: 'rgba(240,236,224,0.05)', border: `1px solid ${C.border}`, borderRadius: 8, padding: '7px 10px', color: C.text, fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                  {slide.image_url && (
                    <img src={slide.image_url} alt="" onError={e => e.target.style.display='none'}
                      style={{ marginTop: 8, width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 8, border: `1px solid ${C.border}` }} />
                  )}
                </div>

                {/* YouTube URL */}
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3, display: 'block', marginBottom: 5 }}>YouTube URL <span style={{ fontWeight: 400 }}>(optional)</span></label>
                  <input type="url" value={slide.video_url || ''} onChange={e => updateSlide(editingSlide, 'video_url', e.target.value || null)}
                    placeholder="https://youtube.com/watch?v=..."
                    style={{ width: '100%', background: 'rgba(240,236,224,0.05)', border: `1px solid ${C.border}`, borderRadius: 8, padding: '7px 10px', color: C.text, fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                  {getYouTubeId(slide.video_url) && (
                    <div style={{ marginTop: 8, borderRadius: 8, overflow: 'hidden', border: `1px solid ${C.border}` }}>
                      <iframe src={`https://www.youtube.com/embed/${getYouTubeId(slide.video_url)}`}
                        style={{ width: '100%', height: 160, border: 'none', display: 'block' }}
                        allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen />
                    </div>
                  )}
                </div>

                {/* Quick insert after this slide */}
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '0.75rem' }}>
                  <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3, display: 'block', marginBottom: 6 }}>Insert after this slide</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {[{type:'story',label:'Story ↓'},{type:'story_choice',label:'Choice ↓'},{type:'open_question',label:'Open Q ↓'},{type:'multiple_choice',label:'Quiz MC ↓'},{type:'info',label:'Info ↓'}].map(t => (
                      <button key={t.type} onClick={() => addSlideAfter(editingSlide, t.type)}
                        style={{ ...GHOST, fontSize: 11, padding: '4px 10px' }}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── PREVIEW ──────────────────────────────────────────────────────
  if (sub === 'preview' && editDeck) {
    const pvSlide = editDeck.slides[previewSlide];
    const pvTotal = editDeck.slides.length;
    const TYPE_LABELS_PV = {story:'Story',story_choice:'Choose your path',open_question:'Open question',info:'Information',multiple_choice:`Question ${previewSlide + 1} of ${pvTotal}`};

    return (
      <div style={{ maxWidth: 780, width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <button onClick={() => setSub('editor')} style={{ ...GHOST, flexShrink: 0 }}>← Editor</button>
          <p style={{ fontSize: 13, color: C.text2, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{editDeck.title}</p>
          <button onClick={() => setPreviewSlide(p => Math.max(0, p - 1))} disabled={previewSlide === 0} style={{ ...GHOST, opacity: previewSlide === 0 ? 0.35 : 1 }}>← Prev</button>
          <span style={{ fontSize: 12, color: C.text3, minWidth: 54, textAlign: 'center' }}>{previewSlide + 1} / {pvTotal}</span>
          <button onClick={() => setPreviewSlide(p => Math.min(pvTotal - 1, p + 1))} disabled={previewSlide === pvTotal - 1} style={{ ...GHOST, opacity: previewSlide === pvTotal - 1 ? 0.35 : 1 }}>Next →</button>
        </div>

        {/* Slide pills */}
        <div style={{ display: 'flex', gap: 4, marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: 4 }}>
          {editDeck.slides.map((s, i) => (
            <button key={s.id} onClick={() => setPreviewSlide(i)}
              style={{ flexShrink: 0, padding: '3px 10px', borderRadius: 20, border: `1px solid ${i === previewSlide ? C.text : C.border}`, background: i === previewSlide ? 'rgba(240,236,224,0.08)' : 'transparent', cursor: 'pointer', fontSize: 10, fontWeight: 700, color: i === previewSlide ? C.text : C.text3, fontFamily: 'inherit', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {({story:'S',story_choice:'C',open_question:'O',info:'I',multiple_choice:'Q'})[s.type] || '?'}{i + 1}
            </button>
          ))}
        </div>

        {/* Phone frame */}
        <div style={{ maxWidth: 390, margin: '0 auto', background: '#0d0b08', border: `2px solid ${C.border}`, borderRadius: 36, padding: '2rem 1.5rem 2.5rem', minHeight: 560, display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 0 0 6px rgba(240,236,224,0.03)' }}>
          {pvSlide ? (
            <>
              {/* Progress dots */}
              <div style={{ display: 'flex', gap: 4, width: '100%', marginBottom: '1.5rem' }}>
                {editDeck.slides.map((_, i) => (
                  <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < previewSlide ? 'rgba(240,236,224,0.25)' : i === previewSlide ? '#f0ece0' : 'rgba(240,236,224,0.1)' }} />
                ))}
              </div>

              {/* Type label */}
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(240,236,224,0.3)', marginBottom: '1rem', textAlign: 'center' }}>
                {TYPE_LABELS_PV[pvSlide.type] || pvSlide.type}
              </p>

              {/* Media */}
              {pvSlide.image_url && (
                <img src={pvSlide.image_url} alt="" style={{ width: '100%', maxHeight: 170, objectFit: 'cover', borderRadius: 12, marginBottom: '1rem', border: '1px solid rgba(240,236,224,0.1)' }} />
              )}
              {!pvSlide.image_url && getYouTubeId(pvSlide.video_url) && (
                <div style={{ width: '100%', borderRadius: 12, overflow: 'hidden', marginBottom: '1rem', border: '1px solid rgba(240,236,224,0.1)' }}>
                  <iframe src={`https://www.youtube.com/embed/${getYouTubeId(pvSlide.video_url)}`}
                    style={{ width: '100%', height: 170, border: 'none', display: 'block' }}
                    allow="accelerometer;autoplay;encrypted-media;picture-in-picture" allowFullScreen />
                </div>
              )}

              {/* Story / Info: large text */}
              {(pvSlide.type === 'story' || pvSlide.type === 'info') && (
                pvSlide.question
                  ? <div dangerouslySetInnerHTML={{ __html: pvSlide.question }} style={{ fontSize: 15, fontWeight: pvSlide.type === 'story' ? 400 : 500, color: '#f0ece0', lineHeight: 1.65, textAlign: 'center', maxWidth: 320 }} />
                  : <span style={{ color: 'rgba(240,236,224,0.2)', fontSize: 15 }}>No text yet</span>
              )}

              {/* Question-based types */}
              {['story_choice','multiple_choice','open_question'].includes(pvSlide.type) && (
                <>
                  {pvSlide.question
                    ? <div dangerouslySetInnerHTML={{ __html: pvSlide.question }} style={{ fontSize: 16, fontWeight: 700, color: '#f0ece0', textAlign: 'center', marginBottom: '1.5rem', lineHeight: 1.35, maxWidth: 320 }} />
                    : <span style={{ color: 'rgba(240,236,224,0.2)', fontSize: 16, marginBottom: '1.5rem' }}>No question yet</span>
                  }

                  {/* Choice / MC buttons */}
                  {(pvSlide.type === 'story_choice' || pvSlide.type === 'multiple_choice') && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', width: '100%' }}>
                      {(pvSlide.options || []).filter(o => o).map((opt, oi) => (
                        <div key={oi} style={{ background: 'transparent', border: `2px solid ${OPT_COLORS[oi % OPT_COLORS.length]}`, borderRadius: 12, padding: '0.85rem 0.7rem', fontSize: 13, fontWeight: 600, color: '#f0ece0', textAlign: 'center', lineHeight: 1.3 }}>
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Open question box */}
                  {pvSlide.type === 'open_question' && (
                    <div style={{ width: '100%', background: 'rgba(240,236,224,0.04)', border: '1px solid rgba(240,236,224,0.1)', borderRadius: 12, padding: '0.9rem 1rem', fontSize: 14, color: 'rgba(240,236,224,0.25)', fontFamily: 'inherit', minHeight: 110, boxSizing: 'border-box' }}>
                      Write your answer...
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <p style={{ color: 'rgba(240,236,224,0.2)', fontSize: 13, margin: 'auto' }}>No slides yet</p>
          )}
        </div>
      </div>
    );
  }

  // ── SESSION HOST ─────────────────────────────────────────────────
  if (sub === 'host' && session) {
    const isWaiting = session.status === 'waiting';
    const isActive  = session.status === 'active';
    const isEnded   = session.status === 'ended';
    const idx       = session.current_slide_index;
    const total     = sessionSlides.length;
    const slide     = sessionSlides[idx];
    const slideLink = `https://dilo.club/app/session.html?code=${session.code}`;
    const slideResponses = responses.filter(r => r.slide_id === slide?.id);
    const isVoteType = ['multiple_choice','story_choice'].includes(slide?.type);
    const optCounts = isVoteType
      ? (slide.options || []).map((_, oi) => slideResponses.filter(r => r.answer === String(oi)).length)
      : [];
    const TYPE_LABELS = {story:'Story',story_choice:'Choice',open_question:'Open Question',info:'Info',multiple_choice:'Quiz MC'};

    return (
      <div style={{ maxWidth: 780, width: '100%' }}>
        {isEnded && <button onClick={() => { setSub('list'); setSession(null); loadDecks(); }} style={{ ...GHOST, marginBottom: '1rem' }}>← Back</button>}

        {/* Code banner */}
        <div style={{ ...CARD, borderRadius: 16, padding: '1.25rem 1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.text3, marginBottom: 4 }}>Code</p>
            <p style={{ fontSize: 44, fontWeight: 900, letterSpacing: '0.18em', color: C.text, lineHeight: 1 }}>{session.code}</p>
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.text3, marginBottom: 4 }}>Session link</p>
            <p style={{ fontSize: 12, color: C.text2, marginBottom: 6, wordBreak: 'break-all' }}>dilo.club/app/session.html?code={session.code}</p>
            <button onClick={() => navigator.clipboard?.writeText(slideLink)} style={{ ...GHOST, fontSize: 11, padding: '4px 12px' }}>Copy link</button>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.text3, marginBottom: 4 }}>Connected</p>
            <p style={{ fontSize: 40, fontWeight: 900, color: C.text, lineHeight: 1 }}>{participants.length}</p>
          </div>
        </div>

        {/* Waiting room */}
        {isWaiting && (
          <div style={{ ...CARD, borderRadius: 14, padding: '1.25rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: 8 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: C.text2 }}>Waiting room — {participants.length} connected</p>
              <button onClick={() => setStatus('active')} disabled={participants.length === 0} style={{ ...BTN, opacity: participants.length === 0 ? 0.4 : 1 }}>Start session</button>
            </div>
            {participants.length === 0
              ? <p style={{ fontSize: 13, color: C.text3 }}>Waiting for students to join with the link...</p>
              : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {participants.map(p => <span key={p.id} style={{ background: 'rgba(240,236,224,0.07)', border: `1px solid ${C.border}`, borderRadius: 20, padding: '4px 12px', fontSize: 13, color: C.text }}>{p.name}</span>)}
                </div>
            }
          </div>
        )}

        {/* Active slide control */}
        {isActive && slide && (
          <div style={{ ...CARD, borderRadius: 14, padding: '1.25rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: 8 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3 }}>
                Slide {idx + 1} / {total} · {TYPE_LABELS[slide.type] || slide.type}
              </p>
              {slide.type !== 'story' && slide.type !== 'info' && (
                <p style={{ fontSize: 12, color: C.text2 }}>{slideResponses.length} / {participants.length} responses</p>
              )}
            </div>

            {slide.image_url && (
              <img src={slide.image_url} alt="" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 10, marginBottom: '0.75rem', border: `1px solid ${C.border}` }} />
            )}
            {getYouTubeId(slide.video_url) && (
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ borderRadius: 10, overflow: 'hidden', marginBottom: '0.5rem', border: `1px solid ${C.border}` }}>
                  <iframe src={`https://www.youtube.com/embed/${getYouTubeId(slide.video_url)}`}
                    style={{ width: '100%', height: 180, border: 'none', display: 'block' }}
                    allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen />
                </div>
              </div>
            )}

            <div dangerouslySetInnerHTML={{ __html: slide.question || '—' }} style={{ fontSize: slide.type === 'story' ? 15 : 16, fontWeight: slide.type === 'story' ? 400 : 700, color: C.text, marginBottom: '1rem', lineHeight: 1.5 }} />

            {/* Vote bars — MC and story_choice */}
            {isVoteType && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: '1.25rem' }}>
                {(slide.options || []).filter(o => o).map((opt, oi) => {
                  const count = optCounts[oi] || 0;
                  const pct   = participants.length > 0 ? Math.round((count / participants.length) * 100) : 0;
                  const isCor = slide.type === 'multiple_choice' && slide.correct_answer === oi;
                  const branchTarget = slide.branch_targets?.[oi];
                  const voters = slideResponses
                    .filter(r => r.answer === String(oi))
                    .map(r => participants.find(p => p.id === r.participant_id)?.name || '?');
                  return (
                    <div key={oi} style={{ background: `${OPT_COLORS[oi]}18`, border: `1px solid ${isCor ? OPT_COLORS[oi] : 'transparent'}`, borderRadius: 10, padding: '10px 12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ fontSize: 12, color: OPT_COLORS[oi], fontWeight: 700 }}>{opt}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{count}</span>
                      </div>
                      {slide.type === 'story_choice' && branchTarget != null && (
                        <p style={{ fontSize: 10, color: C.text3, marginBottom: 3 }}>→ Slide {branchTarget + 1}</p>
                      )}
                      <div style={{ height: 4, background: 'rgba(240,236,224,0.1)', borderRadius: 2, overflow: 'hidden', marginBottom: voters.length > 0 ? 6 : 0 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: OPT_COLORS[oi], borderRadius: 2, transition: 'width 0.4s' }} />
                      </div>
                      {voters.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                          {voters.map((name, ni) => (
                            <span key={ni} style={{ fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 50, background: `${OPT_COLORS[oi]}22`, color: OPT_COLORS[oi] }}>{name}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Open question feed */}
            {slide.type === 'open_question' && (
              <div style={{ maxHeight: 220, overflowY: 'auto', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {slideResponses.length === 0
                  ? <p style={{ fontSize: 13, color: C.text3 }}>Waiting for responses...</p>
                  : slideResponses.map(r => {
                      const pName = participants.find(p => p.id === r.participant_id)?.name;
                      return (
                        <div key={r.id} style={{ background: 'rgba(240,236,224,0.04)', border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px' }}>
                          {pName && <p style={{ fontSize: 10, fontWeight: 700, color: C.text3, marginBottom: 3 }}>{pName}</p>}
                          <p style={{ fontSize: 13, color: C.text, lineHeight: 1.4 }}>{r.answer}</p>
                        </div>
                      );
                    })
                }
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => advanceSlide(idx - 1)} disabled={idx === 0} style={{ ...GHOST, opacity: idx === 0 ? 0.35 : 1 }}>← Previous</button>
              {slide.type === 'story_choice'
                ? <button onClick={advanceToWinner} style={BTN}>Advance to winner →</button>
                : idx < total - 1
                  ? <button onClick={() => advanceSlide(idx + 1)} style={BTN}>Next →</button>
                  : <button onClick={() => setStatus('ended')} style={{ ...BTN, background: C.red }}>End session</button>
              }
              {slide.type === 'story_choice' && idx < total - 1 && (
                <button onClick={() => advanceSlide(idx + 1)} style={{ ...GHOST, fontSize: 12 }}>Skip →</button>
              )}
            </div>
          </div>
        )}

        {/* Participants during active session */}
        {isActive && (
          <div style={{ ...CARD, borderRadius: 12, padding: '0.9rem 1.1rem' }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3, marginBottom: 6 }}>Participants</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {participants.map(p => <span key={p.id} style={{ background: 'rgba(240,236,224,0.05)', borderRadius: 20, padding: '3px 10px', fontSize: 12, color: C.text2 }}>{p.name}</span>)}
            </div>
          </div>
        )}

        {/* Ended */}
        {isEnded && (
          <div style={{ ...CARD, borderRadius: 14, padding: '2.5rem', textAlign: 'center' }}>
            <p style={{ fontSize: 28, fontWeight: 900, color: C.text, marginBottom: 8 }}>Session ended</p>
            <p style={{ fontSize: 14, color: C.text2 }}>{participants.length} participants · {total} slides</p>
          </div>
        )}
      </div>
    );
  }

  return null;
}


