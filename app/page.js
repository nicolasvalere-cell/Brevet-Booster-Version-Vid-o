'use client'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { supabase } from '../lib/supabase'

const BREVET_DATE = new Date('2026-06-29T08:00:00')
const BADGES = [
  { id: 'diamond', name: 'Diamant', emoji: '💎', min: 20, color: '#7C3AED' },
  { id: 'gold', name: 'Or', emoji: '🥇', min: 15, color: '#F59E0B' },
  { id: 'silver', name: 'Argent', emoji: '🥈', min: 10, color: '#64748B' },
  { id: 'bronze', name: 'Bronze', emoji: '🥉', min: 3, color: '#C2410C' },
]
function getBadge(c) { return BADGES.find(b => c >= b.min) || null }

const XP_ACTIONS = { complete_chapter: { xp: 50, label: 'Chapitre terminé' }, watch_video: { xp: 15, label: 'Vidéo vue' }, open_pdf: { xp: 5, label: 'PDF ouvert' }, streak_day: { xp: 20, label: 'Streak' }, game_played: { xp: 10, label: 'Jeu terminé' } }
const XP_LEVELS = [{ level:1,name:'Débutant',min:0,emoji:'🌱' },{ level:2,name:'Apprenti',min:100,emoji:'📗' },{ level:3,name:'Intermédiaire',min:250,emoji:'📘' },{ level:4,name:'Avancé',min:500,emoji:'⚡' },{ level:5,name:'Expert',min:1000,emoji:'🔥' },{ level:6,name:'Maître',min:2000,emoji:'👑' },{ level:7,name:'Légende',min:3500,emoji:'🏆' }]
function getLevel(xp) { return [...XP_LEVELS].reverse().find(l => xp >= l.min) || XP_LEVELS[0] }
function getNextLevel(xp) { return XP_LEVELS.find(l => xp < l.min) || null }

const FUN_FACTS = [
  "Le nombre π a été calculé à plus de 100 000 milliards de décimales !",
  "Le mot « calcul » vient du latin « calculus » qui signifie petit caillou.",
  "Un googol, c'est 10 puissance 100. C'est de là que vient le nom Google !",
  "Al-Khwarizmi, un savant musulman du 9e siècle, est le père de l'algèbre.",
  "111 111 111 × 111 111 111 = 12 345 678 987 654 321. Magique !",
  "Le zéro a été inventé en Inde au 7e siècle.",
  "Le nombre d'or (1,618) se retrouve dans la nature : coquillages, tournesols, galaxies...",
  "La probabilité d'avoir le même anniversaire dans un groupe de 23 personnes dépasse 50% !",
  "La somme des angles d'un triangle fait toujours 180°.",
  "Le symbole = a été inventé en 1557 par Robert Recorde.",
]

const IC = {
  home: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  book: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  target: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  play: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  check: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>,
  close: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  logout: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  chev: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>,
  pdf: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  users: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>,
  plus: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  trash: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  dash: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  chart: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  game: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/></svg>,
  edit: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  menu: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  arrowL: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  arrowR: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  up: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>,
  down: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>,
  grip: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.4"><circle cx="9" cy="5" r="1" fill="currentColor"/><circle cx="15" cy="5" r="1" fill="currentColor"/><circle cx="9" cy="12" r="1" fill="currentColor"/><circle cx="15" cy="12" r="1" fill="currentColor"/><circle cx="9" cy="19" r="1" fill="currentColor"/><circle cx="15" cy="19" r="1" fill="currentColor"/></svg>,
  clock: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
}

function ProgressBar({ value, max, height = 8 }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return <div style={{ background: 'var(--border)', borderRadius: 20, height, overflow: 'hidden', width: '100%' }}><div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--accent-dark))', borderRadius: 20, transition: 'width 0.5s' }} /></div>
}
function Modal({ title, children, onClose }) {
  return <div className="modal-overlay" onClick={onClose}><div className="modal" onClick={e => e.stopPropagation()}><div className="modal-header"><h2 className="modal-title">{title}</h2><div onClick={onClose} style={{ cursor: 'pointer', color: 'var(--text-sec)' }}>{IC.close}</div></div>{children}</div></div>
}
function Toast({ message }) { return <div className="toast">{IC.check} {message}</div> }

function getVideoEmbed(url) {
  if (!url) return null
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch) return { type: 'youtube', id: ytMatch[1] }
  // Loom
  if (url.includes('loom.com')) { const m = url.match(/loom\.com\/(?:share|embed)\/([a-f0-9]+)/); if (m) return { type: 'loom', id: m[1] } }
  // Bunny Stream (iframe.mediadelivery.net or player.mediadelivery.net)
  if (url.includes('mediadelivery.net')) return { type: 'bunny', url: url.replace('/play/', '/embed/') }
  // Direct video files
  if (url.match(/\.(mp4|webm|mov)(\?|$)/i)) return { type: 'mp4', url }
  // Fallback: treat as iframe embed
  return { type: 'iframe', url }
}

// ═══ LOGIN ═══
function LoginPage({ onLogin }) {
  const [u, setU] = useState(''); const [p, setP] = useState(''); const [err, setErr] = useState(''); const [ld, setLd] = useState(false)
  const go = async (e) => { e.preventDefault(); setErr(''); setLd(true); await onLogin(u.trim(), p.trim(), setErr); setLd(false) }
  return (
    <div className="login-page"><div className="login-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: 20 }}>B</div>
        <span style={{ fontSize: 24, fontWeight: 900 }}>Brevet <span style={{ color: 'var(--accent)' }}>Booster</span></span>
      </div>
      <p style={{ color: 'var(--text-sec)', fontSize: 14, marginBottom: 32 }}>Connecte-toi pour accéder à ta formation</p>
      {err && <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 16 }}>{err}</div>}
      <form onSubmit={go}>
        <div className="form-group"><label className="form-label">Identifiant</label><input className="form-input" value={u} onChange={e => setU(e.target.value)} placeholder="Ton identifiant" /></div>
        <div className="form-group"><label className="form-label">Mot de passe</label><input className="form-input" type="password" value={p} onChange={e => setP(e.target.value)} placeholder="Ton mot de passe" /></div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: 14, fontSize: 15, borderRadius: 12 }} disabled={ld}>{ld ? 'Connexion...' : 'Se connecter'}</button>
      </form>
    </div></div>
  )
}

// ═══ SIDEBAR ═══
function Sidebar({ items, current, setCurrent, onLogout, role, mobileOpen, setMobileOpen }) {
  return (
    <>
      <div className="mobile-topbar"><div onClick={() => setMobileOpen(true)} style={{ cursor: 'pointer', padding: 4 }}>{IC.menu}</div><span style={{ fontSize: 16, fontWeight: 800 }}>Brevet <span style={{ color: 'var(--accent)' }}>Booster</span></span><div style={{ width: 26 }} /></div>
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}
      <div className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand"><div className="sidebar-logo">B</div><span className="sidebar-title">Brevet <span>Booster</span></span><div className="sidebar-close" onClick={() => setMobileOpen(false)} style={{ marginLeft: 'auto', cursor: 'pointer', color: 'var(--text-sec)' }}>{IC.close}</div></div>
        {role && <div className="sidebar-role">{role === 'admin' ? 'Administration' : 'Espace élève'}</div>}
        <nav className="sidebar-nav">{items.map(it => (
          <div key={it.id} className={`sidebar-item ${current === it.id ? 'active' : ''}`} onClick={() => { setCurrent(it.id); setMobileOpen(false) }}>{it.icon}<span>{it.label}</span></div>
        ))}</nav>
        <div className="sidebar-bottom"><button className="sidebar-logout" onClick={onLogout}>{IC.logout}<span>Déconnexion</span></button></div>
      </div>
    </>
  )
}

// ═══ WELCOME (improved) ═══
function WelcomePage({ completedChapters, totalChapters, completedVideos, totalVideos, streak, xp, sections, onNavigate, onContinue, allSections, userName }) {
  const pct = totalChapters > 0 ? Math.round((completedChapters.length / totalChapters) * 100) : 0
  const badge = getBadge(completedChapters.length)
  const level = getLevel(xp); const nextLevel = getNextLevel(xp)
  const xpIn = nextLevel ? xp - level.min : 0; const xpFor = nextLevel ? nextLevel.min - level.min : 1
  const diff = BREVET_DATE - new Date(); const daysLeft = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))

  // Compute section progress for roadmap
  const sectionProgress = useMemo(() => {
    return sections.map(sec => {
      const chs = sec.chapters || []
      const total = chs.length
      const done = chs.filter(c => completedChapters.includes(c.id)).length
      const status = total === 0 ? 'empty' : done === total ? 'done' : done > 0 ? 'active' : 'todo'
      return { ...sec, total, done, status }
    })
  }, [sections, completedChapters])

  const completedSections = sectionProgress.filter(s => s.status === 'done').length
  const roadmapPct = sectionProgress.length > 0 ? Math.round((completedSections / sectionProgress.length) * 100) : 0

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 2 }}>Salut {userName || 'champion'} \u{1F44B}</h1>
          <p style={{ fontSize: 14, color: 'var(--text-sec)' }}>Brevet de maths dans <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--accent)' }}>{daysLeft} jours</span></p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'linear-gradient(135deg, #1E1B4B, #312E81)', padding: '10px 18px', borderRadius: 12, color: 'white' }}>
          <span style={{ fontSize: 20 }}>{level.emoji}</span>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Niveau {level.level}</div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>{level.name} <span style={{ fontFamily: 'monospace', color: '#A5B4FC', marginLeft: 4 }}>{xp} XP</span></div>
          </div>
        </div>
      </div>

      {/* XP progress to next level */}
      {nextLevel && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-sec)', marginBottom: 4 }}>
            <span>{level.emoji} {level.name}</span>
            <span>{nextLevel.emoji} {nextLevel.name} — {nextLevel.min} XP</span>
          </div>
          <div style={{ background: 'var(--border)', borderRadius: 20, height: 6, overflow: 'hidden' }}>
            <div style={{ width: Math.min(100, (xpIn / xpFor) * 100) + '%', height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--accent-dark))', borderRadius: 20 }} />
          </div>
        </div>
      )}

      {/* ═══ ROADMAP ═══ */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '28px 24px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Ton parcours</div>
          <div style={{ fontSize: 14, fontWeight: 800, fontFamily: 'monospace', color: 'var(--accent)' }}>{pct}%</div>
        </div>

        {/* Roadmap line with dots */}
        <div style={{ position: 'relative', padding: '0 24px', marginBottom: 12 }}>
          {/* Background line */}
          <div style={{ position: 'absolute', top: 16, left: 24, right: 24, height: 3, background: 'var(--border)', borderRadius: 2 }} />
          {/* Active line */}
          <div style={{ position: 'absolute', top: 16, left: 24, width: roadmapPct + '%', maxWidth: 'calc(100% - 48px)', height: 3, background: 'var(--accent)', borderRadius: 2, transition: 'width 0.8s ease' }} />
          {/* Dots */}
          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
            {sectionProgress.map((sec, i) => (
              <div key={sec.id} style={{ textAlign: 'center', width: 72, flexShrink: 0 }}>
                {sec.status === 'done' ? (
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--success)', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(5,150,105,0.3)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                ) : sec.status === 'active' ? (
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--accent)', border: '3px solid white', boxShadow: '0 0 0 3px var(--accent), 0 2px 8px rgba(79,70,229,0.3)', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'white', fontFamily: 'monospace' }}>{sec.done}/{sec.total}</span>
                  </div>
                ) : (
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--card)', border: '2px solid var(--border)', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 14 }}>{sec.emoji}</span>
                  </div>
                )}
                <div style={{ fontSize: 11, fontWeight: 600, color: sec.status === 'done' ? 'var(--success)' : sec.status === 'active' ? 'var(--accent)' : 'var(--text-sec)', lineHeight: 1.3 }}>{sec.title}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Continue button */}
      <button onClick={onContinue} style={{ width: '100%', padding: 16, fontSize: 16, fontWeight: 700, background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))', color: 'white', border: 'none', borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 20, transition: 'all 0.15s' }}>
        Continuer la formation \u{2192}
      </button>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
        <div className="card" style={{ padding: '16px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: 24 }}>\u{1F525}</div>
          <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'monospace', color: '#F59E0B', lineHeight: 1, marginTop: 4 }}>{streak.current_streak || 0}</div>
          <div style={{ fontSize: 11, color: 'var(--text-sec)', marginTop: 4 }}>jour{(streak.current_streak || 0) > 1 ? 's' : ''} de suite</div>
        </div>
        <div className="card" style={{ padding: '16px 12px', textAlign: 'center' }}>
          {badge ? (
            <><div style={{ fontSize: 24 }}>{badge.emoji}</div><div style={{ fontSize: 15, fontWeight: 800, color: badge.color, marginTop: 4 }}>{badge.name}</div></>
          ) : (
            <><div style={{ fontSize: 24, opacity: 0.3 }}>\u{1F949}</div><div style={{ fontSize: 12, color: 'var(--text-sec)', marginTop: 4 }}>3 chap. pour le 1er</div></>
          )}
          <div style={{ fontSize: 11, color: 'var(--text-sec)', marginTop: 2 }}>badge</div>
        </div>
        <div className="card" style={{ padding: '16px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: 24 }}>\u{23F3}</div>
          <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'monospace', lineHeight: 1, marginTop: 4 }}>{daysLeft}</div>
          <div style={{ fontSize: 11, color: 'var(--text-sec)', marginTop: 4 }}>jours restants</div>
        </div>
      </div>

      {/* Badges progression */}
      <div className="card" style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-sec)' }}>Badges</div>
          <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>Plus tu avances, plus tu montes en grade</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          {[...BADGES].reverse().map(b => (
            <div key={b.id} style={{ textAlign: 'center', opacity: completedChapters.length >= b.min ? 1 : 0.3 }}>
              <div style={{ fontSize: 24 }}>{b.emoji}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: completedChapters.length >= b.min ? b.color : 'var(--text-sec)' }}>{b.name}</div>
              <div style={{ fontSize: 9, color: 'var(--text-sec)' }}>{b.min} chap.</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


// ═══ COURSE VIEW (shared between Formation + Prépa Brevet) ═══
function CourseView({ sections, completedVideos, completedChapters, toggleVideoComplete, toggleChapterComplete, trackPdf, earnXP, userId, title, subtitle }) {
  const [openChapters, setOpenChapters] = useState(new Set())
  const [viewingVideo, setViewingVideo] = useState(null)
  const [viewingPdf, setViewingPdf] = useState(null)

  const toggleChapter = (id) => setOpenChapters(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  })

  const openPdf = (url, t, type) => { trackPdf(type, t); setViewingPdf({ url, title: t, type }) }

  // PDF Viewer
  if (viewingPdf) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <button onClick={() => setViewingPdf(null)} className="btn btn-secondary btn-sm">{IC.arrowL} Retour</button>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{viewingPdf.title}</div>
          <a href={viewingPdf.url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }}>↗ Nouvel onglet</a>
        </div>
        <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)', background: '#525659' }}>
          <iframe src={`${viewingPdf.url}#toolbar=1`} style={{ width: '100%', height: 'calc(100vh - 180px)', minHeight: 400, border: 'none' }} />
        </div>
      </div>
    )
  }

  // Video Player
  if (viewingVideo) {
    const embed = getVideoEmbed(viewingVideo.video_url)
    const chapter = sections.flatMap(s => s.chapters || []).find(c => (c.videos || []).some(v => v.id === viewingVideo.id))
    const allVids = chapter?.videos || []; const idx = allVids.findIndex(v => v.id === viewingVideo.id)
    const isDone = completedVideos.includes(viewingVideo.id)
    return (
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <button onClick={() => setViewingVideo(null)} className="btn btn-secondary btn-sm">{IC.arrowL} Retour</button>
          <div style={{ fontSize: 13, color: 'var(--text-sec)' }}>{chapter?.title} › <span style={{ color: 'var(--text)', fontWeight: 500 }}>{viewingVideo.title}</span></div>
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{viewingVideo.title}</h1>
        <p style={{ fontSize: 13, color: 'var(--text-sec)', marginBottom: 16 }}>Vidéo {idx + 1}/{allVids.length}{viewingVideo.duration_minutes > 0 ? ` · ${viewingVideo.duration_minutes} min` : ''}</p>
        {/* Player */}
        {embed?.type === 'youtube' ? <div style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 16, position: 'relative', paddingBottom: '56.25%', background: '#000' }}><iframe src={`https://www.youtube.com/embed/${embed.id}?rel=0&modestbranding=1`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} allowFullScreen /></div>
        : embed?.type === 'loom' ? <div style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 16, position: 'relative', paddingBottom: '56.25%', background: '#000' }}><iframe src={`https://www.loom.com/embed/${embed.id}`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} allowFullScreen /></div>
        : embed?.type === 'bunny' || embed?.type === 'iframe' ? <div style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 16, position: 'relative', paddingBottom: '56.25%', background: '#000' }}><iframe src={embed.url} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture" allowFullScreen /></div>
        : embed?.type === 'mp4' ? <div style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 16, background: '#000' }}><video controls style={{ width: '100%', display: 'block' }} src={embed.url} /></div>
        : <div style={{ borderRadius: 14, background: 'var(--bg)', border: '1px solid var(--border)', padding: 60, textAlign: 'center', marginBottom: 16 }}><div style={{ fontSize: 40, marginBottom: 8 }}>🎥</div><p style={{ color: 'var(--text-sec)' }}>Vidéo bientôt disponible</p></div>}
        {/* Nav buttons */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <button onClick={() => idx > 0 && setViewingVideo(allVids[idx - 1])} disabled={idx <= 0} className="btn btn-secondary" style={{ flex: 1, minWidth: 100, opacity: idx > 0 ? 1 : 0.4 }}>{IC.arrowL} Préc.</button>
          <button onClick={() => { toggleVideoComplete(viewingVideo.id); if (!isDone) earnXP(userId, 'watch_video') }} className={`btn ${isDone ? 'btn-secondary' : 'btn-primary'}`} style={{ flex: 2, minWidth: 140 }}>{isDone ? '✅ Vue' : 'Marquer comme vue'}</button>
          <button onClick={() => idx < allVids.length - 1 && setViewingVideo(allVids[idx + 1])} disabled={idx >= allVids.length - 1} className="btn btn-secondary" style={{ flex: 1, minWidth: 100, opacity: idx < allVids.length - 1 ? 1 : 0.4 }}>Suiv. {IC.arrowR}</button>
        </div>
        {/* Playlist */}
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 8 }}>Vidéos du chapitre</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>{allVids.map((v, vi) => {
          const active = v.id === viewingVideo.id; const done = completedVideos.includes(v.id)
          return <div key={v.id} onClick={() => setViewingVideo(v)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', cursor: 'pointer', borderRadius: 10, background: active ? 'var(--accent-bg)' : done ? 'var(--success-bg)' : 'var(--bg)', border: active ? '1.5px solid var(--accent-light)' : '1px solid transparent', transition: 'all 0.15s' }}>
            {done && !active ? (
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></div>
            ) : (
              <div style={{ width: 28, height: 28, borderRadius: 8, background: active ? 'var(--accent)' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: active ? 'white' : 'var(--text-sec)', fontSize: 12, fontWeight: 800, fontFamily: 'monospace' }}>{active ? '▶' : vi + 1}</div>
            )}
            <span style={{ flex: 1, fontSize: 14, fontWeight: active ? 700 : 500, color: active ? 'var(--accent)' : done ? 'var(--success)' : 'var(--text)' }}>{v.title}</span>
            {v.duration_minutes > 0 && <div style={{ padding: '3px 10px', borderRadius: 20, background: active ? 'rgba(79,70,229,0.15)' : 'var(--border)', fontSize: 11, fontWeight: 600, color: active ? 'var(--accent)' : 'var(--text-sec)' }}>{v.duration_minutes} min</div>}
          </div>
        })}</div>
        {/* PDFs */}
        {chapter && (chapter.pdf_url || chapter.exercises_pdf_url || chapter.eval_pdf_url) && <div><div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 8 }}>Ressources</div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {chapter.pdf_url && <button onClick={() => openPdf(chapter.pdf_url, chapter.title, 'cours')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--accent-bg)', color: 'var(--accent)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>📘 Cours</button>}
          {chapter.exercises_pdf_url && <button onClick={() => openPdf(chapter.exercises_pdf_url, chapter.title, 'exercices')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--danger-bg)', color: 'var(--danger)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>✏️ Exercices</button>}
          {chapter.eval_pdf_url && <button onClick={() => openPdf(chapter.eval_pdf_url, chapter.title, 'auto-eval')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10, borderRadius: 10, border: '1px solid var(--border)', background: '#FEF3C7', color: '#92400E', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>📝 Auto-éval</button>}
        </div></div>}
      </div>
    )
  }

  // Chapter list (improved hierarchy)
  const totalVids = sections.flatMap(s => (s.chapters || []).flatMap(c => c.videos || [])).length
  return (
    <div>
      <h1 className="page-title">{title}</h1>
      <p className="page-subtitle">{subtitle || `${sections.reduce((a, s) => a + (s.chapters?.length || 0), 0)} chapitres · ${totalVids} vidéos`}</p>
      {sections.map(section => (
        <div key={section.id} style={{ marginBottom: 28 }}>
          {/* SECTION TITLE - big and prominent */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14, padding: '18px 22px', background: 'linear-gradient(135deg, var(--accent-bg), #E0E7FF)', borderRadius: 14, border: '1px solid var(--accent-light)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0, color: 'white', boxShadow: '0 4px 12px rgba(79,70,229,0.25)' }}>{section.emoji}</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', lineHeight: 1.2 }}>{section.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-sec)', marginTop: 2 }}>{(section.chapters || []).length} chapitre{(section.chapters || []).length > 1 ? 's' : ''}</div>
            </div>
          </div>
          {(section.chapters || []).map((ch, ci) => {
            const vids = ch.videos || []; const isOpen = openChapters.has(ch.id)
            const doneVids = vids.filter(v => completedVideos.includes(v.id)).length
            const chDone = completedChapters.includes(ch.id)
            return (
              <div key={ch.id} style={{ marginBottom: 10, background: 'var(--card)', border: isOpen ? '1.5px solid var(--accent-light)' : '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', transition: 'all 0.2s' }}>
                {/* CHAPTER TITLE */}
                <div onClick={() => toggleChapter(ch.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                    <div className={`checkbox ${chDone ? 'checked' : ''}`} onClick={e => { e.stopPropagation(); toggleChapterComplete(ch.id) }}>{chDone && IC.check}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: chDone ? 'var(--text-sec)' : 'var(--text)', textDecoration: chDone ? 'line-through' : 'none', lineHeight: 1.3 }}>{ch.title}</div>
                      {vids.length > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <div style={{ width: 60 }}><ProgressBar value={doneVids} max={vids.length} height={4} /></div>
                        <span style={{ fontSize: 12, color: doneVids === vids.length && vids.length > 0 ? 'var(--success)' : 'var(--text-sec)', fontWeight: 600 }}>{doneVids}/{vids.length} vidéo{vids.length > 1 ? 's' : ''}</span>
                      </div>}
                    </div>
                  </div>
                  <div style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: 'var(--text-sec)' }}>{IC.chev}</div>
                </div>
                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--border)' }}>
                    {/* VIDEO LIST */}
                    <div style={{ padding: '12px 16px 8px' }}>
                      {vids.length > 0 ? vids.map((v, vi) => {
                        const done = completedVideos.includes(v.id)
                        return <div key={v.id} onClick={() => setViewingVideo(v)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', marginBottom: 6, cursor: 'pointer', borderRadius: 10, background: done ? 'var(--success-bg)' : 'var(--bg)', border: '1px solid transparent', transition: 'all 0.15s' }} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--accent-light)'; e.currentTarget.style.transform = 'translateX(4px)' }} onMouseOut={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.transform = 'none' }}>
                          {/* Number or check */}
                          {done ? (
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></div>
                          ) : (
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--accent)', fontSize: 12, fontWeight: 800, fontFamily: 'monospace' }}>{vi + 1}</div>
                          )}
                          {/* Play icon */}
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: done ? 'rgba(5,150,105,0.1)' : 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: done ? 'var(--success)' : 'var(--accent)' }}>{IC.play}</div>
                          {/* Title */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: done ? 'var(--success)' : 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.title}</div>
                          </div>
                          {/* Duration badge */}
                          {v.duration_minutes > 0 && <div style={{ padding: '3px 10px', borderRadius: 20, background: done ? 'rgba(5,150,105,0.15)' : 'var(--border)', fontSize: 11, fontWeight: 600, color: done ? 'var(--success)' : 'var(--text-sec)', flexShrink: 0 }}>{v.duration_minutes} min</div>}
                        </div>
                      }) : <div style={{ padding: '20px 14px', fontSize: 14, color: 'var(--text-sec)', textAlign: 'center' }}>Aucune vidéo pour le moment</div>}
                    </div>
                    {/* PDF buttons */}
                    <div style={{ padding: '8px 16px 14px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      {[['📘', 'Cours', ch.pdf_url, 'cours', '#EEF2FF', '#4F46E5', '#C7D2FE'], ['✏️', 'Exercices', ch.exercises_pdf_url, 'exercices', '#FEF2F2', '#DC2626', '#FECACA'], ['📝', 'Auto-éval', ch.eval_pdf_url, 'auto-eval', '#FFFBEB', '#92400E', '#FDE68A']].map(([icon, label, url, type, bg, color, border]) => (
                        <button key={type} onClick={() => url && openPdf(url, ch.title, type)} disabled={!url} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 8px', borderRadius: 10, border: `1.5px solid ${url ? border : 'var(--border)'}`, background: url ? bg : 'var(--bg)', color: url ? color : 'var(--text-sec)', fontSize: 13, fontWeight: 700, cursor: url ? 'pointer' : 'default', fontFamily: 'inherit', opacity: url ? 1 : 0.35, transition: 'all 0.15s' }}>{icon} {label}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ═══ GAMES (improved visuals) ═══
function GameTimer({ tl }) { return <div style={{ width: '100%', background: 'var(--border)', borderRadius: 20, height: 10, overflow: 'hidden' }}><div style={{ width: `${(tl / 60) * 100}%`, height: '100%', background: tl > 20 ? 'var(--success)' : tl > 10 ? 'var(--orange)' : 'var(--danger)', borderRadius: 20, transition: 'width 1s linear' }} /></div> }
function MathGame({ userId, type, title, emoji, gen, onBack, earnXP }) {
  const [st, setSt] = useState('ready'); const [sc, setSc] = useState(0); const [tl, setTl] = useState(60); const [q, setQ] = useState(null); const [inp, setInp] = useState(''); const [rec, setRec] = useState(0); const [fb, setFb] = useState(null); const ir = useRef(null)
  useEffect(() => { (async () => { try { const { data } = await supabase.from('game_records').select('best_score').eq('user_id', userId).eq('game_type', type).single(); if (data) setRec(data.best_score) } catch {} })() }, [userId, type])
  const nq = useCallback(() => { setQ(gen()); setInp(''); setFb(null); setTimeout(() => ir.current?.focus(), 50) }, [gen])
  const start = () => { setSt('playing'); setSc(0); setTl(60); nq() }
  useEffect(() => { if (st !== 'playing' || tl <= 0) { if (st === 'playing' && tl <= 0) { setSt('done'); (async () => { try { const { data } = await supabase.from('game_records').select('best_score').eq('user_id', userId).eq('game_type', type).single(); if (data) { if (sc > data.best_score) await supabase.from('game_records').update({ best_score: sc }).eq('user_id', userId).eq('game_type', type) } else { await supabase.from('game_records').insert({ user_id: userId, game_type: type, best_score: sc }) }; if (sc > rec) setRec(sc); await earnXP(userId, 'game_played') } catch {} })() }; return }; const t = setTimeout(() => setTl(p => p - 1), 1000); return () => clearTimeout(t) }, [tl, st])
  const chk = () => { if (!inp || !q) return; if (parseInt(inp) === q.answer) { setSc(p => p + 1); setFb('ok'); setTimeout(() => nq(), 200) } else { setFb('no'); setTimeout(() => setFb(null), 400); setInp('') } }
  if (st === 'ready') return <div style={{ textAlign: 'center', padding: '60px 20px' }}><div style={{ fontSize: 60, marginBottom: 16 }}>{emoji}</div><h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{title}</h2><p style={{ color: 'var(--text-sec)', fontSize: 15, marginBottom: 24 }}>60 secondes pour un max de bonnes réponses !</p>{rec > 0 && <div style={{ display: 'inline-block', padding: '8px 20px', borderRadius: 12, background: '#FEF3C7', color: '#92400E', fontWeight: 700, marginBottom: 20 }}>🏆 Record actuel : {rec}</div>}<br/><button className="btn btn-primary" onClick={start} style={{ padding: '16px 50px', fontSize: 16, borderRadius: 14 }}>C&apos;est parti !</button><div style={{ marginTop: 16 }}><button className="btn btn-secondary" onClick={onBack}>← Retour</button></div></div>
  if (st === 'done') return <div style={{ textAlign: 'center', padding: '60px 20px' }}><div style={{ fontSize: 60, marginBottom: 16 }}>{sc >= rec && rec > 0 ? '🎉' : '⏱️'}</div><div style={{ fontSize: 52, fontWeight: 900, fontFamily: 'monospace', color: 'var(--accent)' }}>{sc}</div><p style={{ color: 'var(--text-sec)', fontSize: 16, marginBottom: 4 }}>bonnes réponses</p>{sc > rec && <div style={{ padding: '8px 20px', borderRadius: 12, background: 'var(--success-bg)', color: 'var(--success)', fontWeight: 700, display: 'inline-block', marginTop: 8, marginBottom: 16 }}>🎉 Nouveau record !</div>}<div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}><button className="btn btn-primary" onClick={start} style={{ padding: '14px 30px' }}>Rejouer</button><button className="btn btn-secondary" onClick={onBack} style={{ padding: '14px 30px' }}>Retour</button></div></div>
  return <div style={{ maxWidth: 500, margin: '0 auto' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}><span style={{ fontSize: 14, color: 'var(--text-sec)' }}>Score : <span style={{ color: 'var(--accent)', fontSize: 20, fontWeight: 800 }}>{sc}</span></span><span style={{ fontSize: 28, fontWeight: 900, fontFamily: 'monospace', color: tl <= 10 ? 'var(--danger)' : 'var(--text)' }}>{tl}s</span></div><GameTimer tl={tl} /><div style={{ textAlign: 'center', padding: '48px 0' }}><div style={{ fontSize: 48, fontWeight: 900, fontFamily: 'monospace', marginBottom: 24 }}>{q?.display} = ?</div><div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}><input ref={ir} type="number" value={inp} onChange={e => setInp(e.target.value)} onKeyDown={e => e.key === 'Enter' && chk()} autoFocus style={{ width: 130, padding: 14, fontSize: 24, fontWeight: 800, textAlign: 'center', borderRadius: 14, border: `3px solid ${fb === 'ok' ? 'var(--success)' : fb === 'no' ? 'var(--danger)' : 'var(--border)'}`, background: fb === 'ok' ? 'var(--success-bg)' : fb === 'no' ? 'var(--danger-bg)' : 'white', outline: 'none', fontFamily: 'monospace', transition: 'border-color 0.2s, background 0.2s' }} /><button className="btn btn-primary" onClick={chk} style={{ padding: '14px 24px', fontSize: 16 }}>OK</button></div></div></div>
}
function GamesPage({ userId, earnXP }) {
  const [active, setActive] = useState(null); const [records, setRecords] = useState({})
  useEffect(() => { (async () => { try { const { data } = await supabase.from('game_records').select('game_type, best_score').eq('user_id', userId); const m = {}; (data || []).forEach(r => m[r.game_type] = r.best_score); setRecords(m) } catch {} })() }, [userId, active])
  const multiGen = useCallback(() => { const a = 2 + Math.floor(Math.random() * 10), b = 2 + Math.floor(Math.random() * 10); return { display: `${a} × ${b}`, answer: a * b } }, [])
  const calcGen = useCallback(() => { const ops = ['+', '-', '×']; const op = ops[Math.floor(Math.random() * 3)]; let a = 10 + Math.floor(Math.random() * 40), b = 10 + Math.floor(Math.random() * 40); if (op === '×') { a = 2 + Math.floor(Math.random() * 12); b = 2 + Math.floor(Math.random() * 12) }; if (op === '-' && a < b) [a, b] = [b, a]; return { display: `${a} ${op} ${b}`, answer: op === '+' ? a + b : op === '-' ? a - b : a * b } }, [])
  if (active === 'multi') return <MathGame userId={userId} type="multiplication" title="Tables de multiplication" emoji="✖️" gen={multiGen} onBack={() => setActive(null)} earnXP={earnXP} />
  if (active === 'calc') return <MathGame userId={userId} type="calcul_mental" title="Calcul mental" emoji="🧮" gen={calcGen} onBack={() => setActive(null)} earnXP={earnXP} />
  return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      <h1 className="page-title">Entraînement</h1>
      <p className="page-subtitle">Entraîne-toi en t&apos;amusant et bats tes records !</p>
      {[{ id: 'multi', emoji: '✖️', title: 'Tables de multiplication', desc: '60 secondes de multiplications non-stop', color: '#7C3AED', bg: '#EDE9FE', rec: records.multiplication },
        { id: 'calc', emoji: '🧮', title: 'Calcul mental', desc: 'Additions, soustractions et multiplications', color: '#2563EB', bg: '#DBEAFE', rec: records.calcul_mental }
      ].map(g => (
        <div key={g.id} onClick={() => setActive(g.id)} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, cursor: 'pointer', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 18, transition: 'all 0.15s' }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: g.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>{g.emoji}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{g.title}</div>
            <div style={{ fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.4 }}>{g.desc}</div>
          </div>
          {g.rec > 0 && <div style={{ padding: '6px 14px', borderRadius: 20, background: '#FEF3C7', color: '#92400E', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>🏆 {g.rec}</div>}
        </div>
      ))}
    </div>
  )
}

// ═══ SIMULATOR ═══
function SimulatorPage() {
  const [cc, setCc] = useState(''); const [fr, setFr] = useState(''); const [ma, setMa] = useState(''); const [hg, setHg] = useState(''); const [em, setEm] = useState(''); const [sc, setSc] = useState(''); const [or, setOr] = useState('')
  const parse = v => { const n = parseFloat(v); return isNaN(n) ? null : Math.min(20, Math.max(0, n)) }
  const result = useMemo(() => {
    const ccV = parse(cc); if (ccV === null) return null
    const notes = [{val:parse(fr),coef:2},{val:parse(ma),coef:2},{val:parse(hg),coef:1.5},{val:parse(em),coef:0.5},{val:parse(sc),coef:2},{val:parse(or),coef:2}]
    const filled = notes.filter(n => n.val !== null); if (!filled.length) return { moyenne: ccV * 0.4, partial: true }
    const ep = filled.reduce((a, n) => a + n.val * n.coef, 0) / filled.reduce((a, n) => a + n.coef, 0)
    const moy = ccV * 0.4 + ep * 0.6; const mention = moy >= 18 ? 'Très bien avec félicitations 🎉' : moy >= 16 ? 'Très bien' : moy >= 14 ? 'Bien' : moy >= 12 ? 'Assez bien' : moy >= 10 ? 'Admis' : 'Non admis'
    return { moyenne: Math.round(moy * 100) / 100, mention, partial: filled.length < 6 }
  }, [cc, fr, ma, hg, em, sc, or])
  const is = { width: '100%', padding: '10px 12px', border: '2px solid var(--border)', borderRadius: 10, fontSize: 15, fontWeight: 700, textAlign: 'center', outline: 'none', fontFamily: 'monospace', background: 'var(--bg)' }
  const ls = { fontSize: 11, fontWeight: 700, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, display: 'block' }
  return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Simulateur de note — Brevet 2026</h3>
        <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--accent)' }}>① Contrôle continu (40%)</h4>
        <div style={{ marginBottom: 16 }}><label style={ls}>Moyenne générale /20</label><input type="number" step="0.1" min="0" max="20" placeholder="12.5" value={cc} onChange={e => setCc(e.target.value)} style={is} /></div>
        <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--accent)' }}>② Épreuves finales (60%)</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[['Français (×2)', fr, setFr],['Maths (×2)', ma, setMa],['HG (×1.5)', hg, setHg],['EMC (×0.5)', em, setEm],['Sciences (×2)', sc, setSc],['Oral (×2)', or, setOr]].map(([l, v, s]) => <div key={l}><label style={ls}>{l}</label><input type="number" step="0.5" min="0" max="20" placeholder="/20" value={v} onChange={e => s(e.target.value)} style={is} /></div>)}
        </div>
        {result && <div style={{ marginTop: 20, textAlign: 'center', padding: 24, background: 'var(--bg)', borderRadius: 14, border: '1px solid var(--border)' }}>
          {result.partial && <p style={{ fontSize: 11, color: 'var(--text-sec)', marginBottom: 6 }}>⚠️ Estimation partielle</p>}
          <div style={{ fontSize: 48, fontWeight: 900, fontFamily: 'monospace', color: result.moyenne >= 10 ? 'var(--accent)' : 'var(--danger)' }}>{result.moyenne.toFixed(2)}</div>
          <div style={{ fontSize: 14, color: 'var(--text-sec)', marginBottom: 12 }}>/20</div>
          <div style={{ display: 'inline-block', padding: '8px 24px', borderRadius: 20, fontSize: 15, fontWeight: 800, color: 'white', background: result.moyenne >= 16 ? '#F59E0B' : result.moyenne >= 14 ? 'var(--accent)' : result.moyenne >= 10 ? 'var(--success)' : 'var(--danger)' }}>{result.mention}</div>
        </div>}
      </div>
    </div>
  )
}

// ═══ ASSIGNMENTS ═══
function AssignmentsPage({ userId, earnXP }) {
  const [assignments, setAssignments] = useState([]); const [subs, setSubs] = useState([]); const [uploading, setUploading] = useState(null); const [ld, setLd] = useState(true)
  useEffect(() => { (async () => { const { data: a } = await supabase.from('assignments').select('*').order('created_at', { ascending: false }); const { data: as } = await supabase.from('assignment_students').select('assignment_id').eq('user_id', userId); const { data: allAs } = await supabase.from('assignment_students').select('assignment_id'); const { data: s } = await supabase.from('submissions').select('*').eq('user_id', userId); const specific = [...new Set((allAs || []).map(x => x.assignment_id))]; const mine = (as || []).map(x => x.assignment_id); setAssignments((a || []).filter(x => !specific.includes(x.id) || mine.includes(x.id))); setSubs(s || []); setLd(false) })() }, [userId])
  const getSub = aid => subs.find(s => s.assignment_id === aid)
  const upload = async (aid, file) => { if (!file) return; setUploading(aid); try { const path = `${userId}/${aid}_${Date.now()}.${file.name.split('.').pop()}`; await supabase.storage.from('submissions').upload(path, file, { upsert: true }); const { data: u } = supabase.storage.from('submissions').getPublicUrl(path); await supabase.from('submissions').upsert({ assignment_id: aid, user_id: userId, image_url: u.publicUrl, submitted_at: new Date().toISOString(), corrected: false }); const { data: s } = await supabase.from('submissions').select('*').eq('user_id', userId); setSubs(s || []); await earnXP(userId, 'open_pdf') } catch (e) { alert('Erreur: ' + e.message) }; setUploading(null) }
  if (ld) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-sec)' }}>Chargement...</div>
  return (
    <div><h1 className="page-title">Mes devoirs</h1><p className="page-subtitle">Prends en photo ta copie et envoie-la</p>
      {!assignments.length ? <div className="card" style={{ padding: 60, textAlign: 'center', color: 'var(--text-sec)' }}><div style={{ fontSize: 40, marginBottom: 12 }}>📝</div><p style={{ fontWeight: 600 }}>Aucun devoir</p></div> :
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{assignments.map(a => { const sub = getSub(a.id); const overdue = a.due_date && new Date(a.due_date) < new Date() && !sub; return (
          <div key={a.id} className="card" style={{ padding: 20, borderColor: overdue ? 'var(--danger)' : undefined }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
              {!sub && !overdue && <span className="badge" style={{ background: '#FEF3C7', color: '#92400E' }}>🔴 À rendre</span>}
              {overdue && <span className="badge badge-danger">⚠️ En retard</span>}
              {sub && !sub.corrected && <span className="badge" style={{ background: '#FEF3C7', color: '#92400E' }}>🟡 En attente</span>}
              {sub?.corrected && <span className="badge badge-success">🟢 {sub.score}/20</span>}
              {a.due_date && <span className="badge" style={{ background: 'var(--bg)', color: 'var(--text-sec)' }}>📅 {new Date(a.due_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</span>}
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{a.title}</h3>
            {a.description && <p style={{ fontSize: 13, color: 'var(--text-sec)', marginBottom: 8 }}>{a.description}</p>}
            {a.image_url && <a href={a.image_url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: 'var(--accent)', marginBottom: 8, display: 'inline-block' }}>📎 Voir l&apos;énoncé</a>}
            {!sub ? <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 12, background: 'var(--accent)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 8 }}>📷 {uploading === a.id ? 'Envoi...' : 'Envoyer'}<input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => upload(a.id, e.target.files[0])} disabled={uploading === a.id} /></label> :
              <div style={{ marginTop: 8 }}>{sub.corrected && <div style={{ marginBottom: 4 }}><span style={{ fontSize: 24, fontWeight: 900, fontFamily: 'monospace', color: sub.score >= 10 ? 'var(--success)' : 'var(--danger)' }}>{sub.score}/20</span>{sub.feedback && <p style={{ fontSize: 12, color: 'var(--text-sec)', marginTop: 4 }}>{sub.feedback}</p>}</div>}<a href={sub.image_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--accent)' }}>Voir ma copie</a></div>}
          </div>
        ) })}</div>}
    </div>
  )
}

// ═══ ADMIN ═══
function AdminDash({ students, sections, videos }) { return <div><h1 className="page-title">Dashboard</h1><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}><div className="stat-card"><div className="stat-label">Élèves actifs</div><div className="stat-value" style={{ color: 'var(--accent)' }}>{students.filter(s => s.active).length}</div></div><div className="stat-card"><div className="stat-label">Chapitres</div><div className="stat-value" style={{ color: 'var(--success)' }}>{sections.reduce((a, s) => a + (s.chapters?.length || 0), 0)}</div></div><div className="stat-card"><div className="stat-label">Vidéos</div><div className="stat-value" style={{ color: 'var(--orange)' }}>{videos.length}</div></div></div></div> }

function AdminStudents({ students, reload, showToast }) {
  const [modal, setModal] = useState(false); const [f, setF] = useState({ first_name: '', last_name: '', username: '', password: '' })
  const add = async () => { if (!f.first_name || !f.username || !f.password) return; await supabase.from('users').insert({ ...f, role: 'student', active: true }); setModal(false); setF({ first_name: '', last_name: '', username: '', password: '' }); showToast('Ajouté !'); reload() }
  const del = async id => { await supabase.from('users').delete().eq('id', id); showToast('Supprimé'); reload() }
  const toggle = async (id, a) => { await supabase.from('users').update({ active: !a }).eq('id', id); reload() }
  return (
    <div><h1 className="page-title">Élèves</h1><button className="btn btn-primary" onClick={() => setModal(true)} style={{ marginBottom: 16 }}>{IC.plus} Ajouter</button>
      <div className="card">{students.map(s => <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: 8 }}>
        <div><span style={{ fontWeight: 600 }}>{s.first_name} {s.last_name}</span><span style={{ marginLeft: 10, fontFamily: 'monospace', fontSize: 12, color: 'var(--text-sec)' }}>{s.username} / {s.password}</span></div>
        <div className="row gap-sm"><span className={`badge ${s.active ? 'badge-success' : 'badge-danger'}`} style={{ cursor: 'pointer' }} onClick={() => toggle(s.id, s.active)}>{s.active ? 'Actif' : 'Inactif'}</span><button onClick={() => del(s.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-sec)' }}>{IC.trash}</button></div>
      </div>)}</div>
      {modal && <Modal title="Nouvel élève" onClose={() => setModal(false)}>{[['Prénom', 'first_name', 'Yasmine'], ['Nom', 'last_name', 'B.'], ['Identifiant', 'username', 'yasmine'], ['Mot de passe', 'password', 'brevet2026']].map(([l, k, ph]) => <div className="form-group" key={k}><label className="form-label">{l}</label><input className="form-input" value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })} placeholder={ph} /></div>)}<div className="modal-actions"><button className="btn btn-secondary btn-sm" onClick={() => setModal(false)}>Annuler</button><button className="btn btn-primary btn-sm" onClick={add}>Créer</button></div></Modal>}
    </div>
  )
}

// ═══ ADMIN CONTENT (with edit + drag reorder) ═══
function AdminContent({ sections, reload, showToast, contentType }) {
  const filtered = sections.filter(s => s.type === contentType)
  const [secModal, setSecModal] = useState(false); const [chModal, setChModal] = useState(null); const [vidModal, setVidModal] = useState(null)
  const [editSecModal, setEditSecModal] = useState(null); const [editChModal, setEditChModal] = useState(null); const [editVidModal, setEditVidModal] = useState(null)
  const [secTitle, setSecTitle] = useState(''); const [secEmoji, setSecEmoji] = useState('📘')
  const [chTitle, setChTitle] = useState(''); const [chPdf, setChPdf] = useState(''); const [chExo, setChExo] = useState(''); const [chEval, setChEval] = useState('')
  const [vidTitle, setVidTitle] = useState(''); const [vidUrl, setVidUrl] = useState(''); const [vidDur, setVidDur] = useState('')
  const [dragItem, setDragItem] = useState(null)

  const addSec = async () => { if (!secTitle) return; await supabase.from('sections').insert({ title: secTitle, emoji: secEmoji, sort_order: filtered.length + 1, type: contentType }); setSecTitle(''); setSecEmoji('📘'); setSecModal(false); showToast('Section créée !'); reload() }
  const updateSec = async () => { if (!editSecModal) return; await supabase.from('sections').update({ title: secTitle, emoji: secEmoji }).eq('id', editSecModal.id); setEditSecModal(null); showToast('Modifié !'); reload() }
  const delSec = async id => { await supabase.from('sections').delete().eq('id', id); showToast('Supprimée'); reload() }

  const addCh = async secId => { if (!chTitle) return; const chs = filtered.find(s => s.id === secId)?.chapters || []; await supabase.from('chapters').insert({ section_id: secId, title: chTitle, sort_order: chs.length + 1, pdf_url: chPdf, exercises_pdf_url: chExo, eval_pdf_url: chEval }); setChTitle(''); setChPdf(''); setChExo(''); setChEval(''); setChModal(null); showToast('Chapitre créé !'); reload() }
  const updateCh = async () => { if (!editChModal) return; await supabase.from('chapters').update({ title: chTitle, pdf_url: chPdf, exercises_pdf_url: chExo, eval_pdf_url: chEval }).eq('id', editChModal.id); setEditChModal(null); showToast('Modifié !'); reload() }
  const delCh = async id => { await supabase.from('chapters').delete().eq('id', id); showToast('Supprimé'); reload() }

  const addVid = async chId => { if (!vidTitle) return; const ch = filtered.flatMap(s => s.chapters || []).find(c => c.id === chId); const vids = ch?.videos || []; await supabase.from('videos').insert({ chapter_id: chId, title: vidTitle, video_url: vidUrl, duration_minutes: parseInt(vidDur) || 0, sort_order: vids.length + 1 }); setVidTitle(''); setVidUrl(''); setVidDur(''); setVidModal(null); showToast('Vidéo ajoutée !'); reload() }
  const updateVid = async () => { if (!editVidModal) return; await supabase.from('videos').update({ title: vidTitle, video_url: vidUrl, duration_minutes: parseInt(vidDur) || 0 }).eq('id', editVidModal.id); setEditVidModal(null); showToast('Modifié !'); reload() }
  const delVid = async id => { await supabase.from('videos').delete().eq('id', id); showToast('Supprimée'); reload() }

  // Drag & drop reorder for sections
  const handleDragSec = async (fromIdx, toIdx) => {
    if (fromIdx === toIdx) return
    const reordered = [...filtered]; const [moved] = reordered.splice(fromIdx, 1); reordered.splice(toIdx, 0, moved)
    for (let i = 0; i < reordered.length; i++) { await supabase.from('sections').update({ sort_order: i + 1 }).eq('id', reordered[i].id) }
    reload()
  }
  // Drag & drop for chapters within a section
  const handleDragCh = async (secId, fromIdx, toIdx) => {
    if (fromIdx === toIdx) return
    const sec = filtered.find(s => s.id === secId); if (!sec) return
    const chs = [...(sec.chapters || [])]; const [moved] = chs.splice(fromIdx, 1); chs.splice(toIdx, 0, moved)
    for (let i = 0; i < chs.length; i++) { await supabase.from('chapters').update({ sort_order: i + 1 }).eq('id', chs[i].id) }
    reload()
  }
  // Drag & drop for videos within a chapter
  const handleDragVid = async (chId, fromIdx, toIdx) => {
    if (fromIdx === toIdx) return
    const ch = filtered.flatMap(s => s.chapters || []).find(c => c.id === chId); if (!ch) return
    const vids = [...(ch.videos || [])]; const [moved] = vids.splice(fromIdx, 1); vids.splice(toIdx, 0, moved)
    for (let i = 0; i < vids.length; i++) { await supabase.from('videos').update({ sort_order: i + 1 }).eq('id', vids[i].id) }
    reload()
  }

  const moveItem = async (table, items, idx, dir) => {
    const newIdx = idx + dir; if (newIdx < 0 || newIdx >= items.length) return
    await supabase.from(table).update({ sort_order: newIdx + 1 }).eq('id', items[idx].id)
    await supabase.from(table).update({ sort_order: idx + 1 }).eq('id', items[newIdx].id)
    reload()
  }

  return (
    <div>
      <h1 className="page-title">{contentType === 'formation' ? 'Contenu — Formation' : 'Contenu — Prépa Brevet'}</h1>
      <p className="page-subtitle">Sections, chapitres et vidéos</p>
      <button className="btn btn-primary" onClick={() => { setSecTitle(''); setSecEmoji('📘'); setSecModal(true) }} style={{ marginBottom: 20 }}>{IC.plus} Nouvelle section</button>
      {filtered.map((sec, si) => (
        <div key={sec.id} style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, padding: '8px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="row gap-sm" style={{ color: 'var(--text-sec)' }}>
                <div onClick={() => moveItem('sections', filtered, si, -1)} style={{ cursor: si > 0 ? 'pointer' : 'default', opacity: si > 0 ? 1 : 0.2 }}>{IC.up}</div>
                <div onClick={() => moveItem('sections', filtered, si, 1)} style={{ cursor: si < filtered.length - 1 ? 'pointer' : 'default', opacity: si < filtered.length - 1 ? 1 : 0.2 }}>{IC.down}</div>
              </div>
              <span style={{ fontSize: 18, fontWeight: 800 }}>{sec.emoji} {sec.title}</span>
            </div>
            <div className="row gap-sm">
              <button className="btn btn-sm btn-secondary" onClick={() => { setSecTitle(sec.title); setSecEmoji(sec.emoji); setEditSecModal(sec) }}>{IC.edit}</button>
              <button className="btn btn-primary btn-sm" onClick={() => { setChTitle(''); setChPdf(''); setChExo(''); setChEval(''); setChModal(sec.id) }}>{IC.plus} Chapitre</button>
              <button onClick={() => delSec(sec.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-sec)' }}>{IC.trash}</button>
            </div>
          </div>
          {(sec.chapters || []).map((ch, ci) => (
            <div key={ch.id} className="card" style={{ marginBottom: 8 }}>
              <div className="card-header" style={{ background: 'var(--bg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="row gap-sm" style={{ color: 'var(--text-sec)' }}>
                    <div onClick={() => moveItem('chapters', sec.chapters, ci, -1)} style={{ cursor: ci > 0 ? 'pointer' : 'default', opacity: ci > 0 ? 1 : 0.2 }}>{IC.up}</div>
                    <div onClick={() => moveItem('chapters', sec.chapters, ci, 1)} style={{ cursor: ci < (sec.chapters || []).length - 1 ? 'pointer' : 'default', opacity: ci < (sec.chapters || []).length - 1 ? 1 : 0.2 }}>{IC.down}</div>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{ch.title}</span>
                </div>
                <div className="row gap-sm">
                  <button className="btn btn-sm btn-secondary" onClick={() => { setChTitle(ch.title); setChPdf(ch.pdf_url || ''); setChExo(ch.exercises_pdf_url || ''); setChEval(ch.eval_pdf_url || ''); setEditChModal(ch) }}>{IC.edit}</button>
                  <button className="btn btn-primary btn-sm" onClick={() => { setVidTitle(''); setVidUrl(''); setVidDur(''); setVidModal(ch.id) }}>{IC.plus} Vidéo</button>
                  <button onClick={() => delCh(ch.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-sec)' }}>{IC.trash}</button>
                </div>
              </div>
              {(ch.videos || []).map((v, vi) => <div key={v.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="row gap-sm" style={{ color: 'var(--text-sec)' }}>
                    <div onClick={() => moveItem('videos', ch.videos, vi, -1)} style={{ cursor: vi > 0 ? 'pointer' : 'default', opacity: vi > 0 ? 1 : 0.2 }}>{IC.up}</div>
                    <div onClick={() => moveItem('videos', ch.videos, vi, 1)} style={{ cursor: vi < (ch.videos || []).length - 1 ? 'pointer' : 'default', opacity: vi < (ch.videos || []).length - 1 ? 1 : 0.2 }}>{IC.down}</div>
                  </div>
                  <span style={{ width: 20, height: 20, borderRadius: 5, background: 'var(--accent-bg)', color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, fontFamily: 'monospace' }}>{vi + 1}</span>
                  <span style={{ fontSize: 13 }}>{v.title}</span>
                  {v.video_url && <span style={{ fontSize: 11, color: 'var(--success)' }}>🎥</span>}
                  {v.duration_minutes > 0 && <span style={{ fontSize: 11, color: 'var(--text-sec)' }}>{v.duration_minutes}m</span>}
                </div>
                <div className="row gap-sm">
                  <button onClick={() => { setVidTitle(v.title); setVidUrl(v.video_url || ''); setVidDur(String(v.duration_minutes || '')); setEditVidModal(v) }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-sec)' }}>{IC.edit}</button>
                  <button onClick={() => delVid(v.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-sec)' }}>{IC.trash}</button>
                </div>
              </div>)}
              {(!ch.videos || !ch.videos.length) && <div style={{ padding: '12px 20px', fontSize: 13, color: 'var(--text-sec)', textAlign: 'center' }}>Aucune vidéo</div>}
            </div>
          ))}
        </div>
      ))}
      {/* Modals */}
      {secModal && <Modal title="Nouvelle section" onClose={() => setSecModal(false)}><div className="form-group"><label className="form-label">Nom</label><input className="form-input" value={secTitle} onChange={e => setSecTitle(e.target.value)} placeholder="Ex: Algèbre" autoFocus /></div><div className="form-group"><label className="form-label">Emoji</label><input className="form-input" value={secEmoji} onChange={e => setSecEmoji(e.target.value)} /></div><div className="modal-actions"><button className="btn btn-secondary btn-sm" onClick={() => setSecModal(false)}>Annuler</button><button className="btn btn-primary btn-sm" onClick={addSec}>Créer</button></div></Modal>}
      {editSecModal && <Modal title="Modifier la section" onClose={() => setEditSecModal(null)}><div className="form-group"><label className="form-label">Nom</label><input className="form-input" value={secTitle} onChange={e => setSecTitle(e.target.value)} autoFocus /></div><div className="form-group"><label className="form-label">Emoji</label><input className="form-input" value={secEmoji} onChange={e => setSecEmoji(e.target.value)} /></div><div className="modal-actions"><button className="btn btn-secondary btn-sm" onClick={() => setEditSecModal(null)}>Annuler</button><button className="btn btn-primary btn-sm" onClick={updateSec}>Enregistrer</button></div></Modal>}
      {chModal && <Modal title="Nouveau chapitre" onClose={() => setChModal(null)}><div className="form-group"><label className="form-label">Titre</label><input className="form-input" value={chTitle} onChange={e => setChTitle(e.target.value)} placeholder="Ex: Pythagore" autoFocus /></div><div className="form-group"><label className="form-label">URL PDF Cours</label><input className="form-input" value={chPdf} onChange={e => setChPdf(e.target.value)} placeholder="https://..." /></div><div className="form-group"><label className="form-label">URL PDF Exercices</label><input className="form-input" value={chExo} onChange={e => setChExo(e.target.value)} /></div><div className="form-group"><label className="form-label">URL PDF Auto-éval</label><input className="form-input" value={chEval} onChange={e => setChEval(e.target.value)} /></div><div className="modal-actions"><button className="btn btn-secondary btn-sm" onClick={() => setChModal(null)}>Annuler</button><button className="btn btn-primary btn-sm" onClick={() => addCh(chModal)}>Créer</button></div></Modal>}
      {editChModal && <Modal title="Modifier le chapitre" onClose={() => setEditChModal(null)}><div className="form-group"><label className="form-label">Titre</label><input className="form-input" value={chTitle} onChange={e => setChTitle(e.target.value)} autoFocus /></div><div className="form-group"><label className="form-label">URL PDF Cours</label><input className="form-input" value={chPdf} onChange={e => setChPdf(e.target.value)} /></div><div className="form-group"><label className="form-label">URL PDF Exercices</label><input className="form-input" value={chExo} onChange={e => setChExo(e.target.value)} /></div><div className="form-group"><label className="form-label">URL PDF Auto-éval</label><input className="form-input" value={chEval} onChange={e => setChEval(e.target.value)} /></div><div className="modal-actions"><button className="btn btn-secondary btn-sm" onClick={() => setEditChModal(null)}>Annuler</button><button className="btn btn-primary btn-sm" onClick={updateCh}>Enregistrer</button></div></Modal>}
      {vidModal && <Modal title="Nouvelle vidéo" onClose={() => setVidModal(null)}><div className="form-group"><label className="form-label">Titre</label><input className="form-input" value={vidTitle} onChange={e => setVidTitle(e.target.value)} placeholder="Ex: Introduction" autoFocus /></div><div className="form-group"><label className="form-label">URL vidéo</label><input className="form-input" value={vidUrl} onChange={e => setVidUrl(e.target.value)} placeholder="YouTube, Loom ou MP4" /></div><div className="form-group"><label className="form-label">Durée (min)</label><input className="form-input" type="number" value={vidDur} onChange={e => setVidDur(e.target.value)} placeholder="10" /></div><div className="modal-actions"><button className="btn btn-secondary btn-sm" onClick={() => setVidModal(null)}>Annuler</button><button className="btn btn-primary btn-sm" onClick={() => addVid(vidModal)}>Ajouter</button></div></Modal>}
      {editVidModal && <Modal title="Modifier la vidéo" onClose={() => setEditVidModal(null)}><div className="form-group"><label className="form-label">Titre</label><input className="form-input" value={vidTitle} onChange={e => setVidTitle(e.target.value)} autoFocus /></div><div className="form-group"><label className="form-label">URL vidéo</label><input className="form-input" value={vidUrl} onChange={e => setVidUrl(e.target.value)} /></div><div className="form-group"><label className="form-label">Durée (min)</label><input className="form-input" type="number" value={vidDur} onChange={e => setVidDur(e.target.value)} /></div><div className="modal-actions"><button className="btn btn-secondary btn-sm" onClick={() => setEditVidModal(null)}>Annuler</button><button className="btn btn-primary btn-sm" onClick={updateVid}>Enregistrer</button></div></Modal>}
    </div>
  )
}

function AdminProgress({ students, sections }) {
  const [data, setData] = useState({}); const [streaks, setStreaks] = useState({}); const [pdfs, setPdfs] = useState({}); const [xps, setXps] = useState({}); const [times, setTimes] = useState({})
  const totalCh = sections.reduce((a, s) => a + (s.chapters?.length || 0), 0)
  useEffect(() => { (async () => {
    const [cpR, stR, pcR, xpR, ttR] = await Promise.all([supabase.from('chapter_progress').select('user_id, chapter_id'), supabase.from('student_streaks').select('*'), supabase.from('pdf_clicks').select('user_id'), supabase.from('student_xp').select('user_id, total_xp'), supabase.from('time_tracking').select('user_id, total_seconds, video_seconds')])
    const g = {}; (cpR.data || []).forEach(p => { if (!g[p.user_id]) g[p.user_id] = []; g[p.user_id].push(p.chapter_id) }); setData(g)
    const sm = {}; (stR.data || []).forEach(s => sm[s.user_id] = s); setStreaks(sm)
    const pm = {}; (pcR.data || []).forEach(c => pm[c.user_id] = (pm[c.user_id] || 0) + 1); setPdfs(pm)
    const xm = {}; (xpR.data || []).forEach(x => xm[x.user_id] = x.total_xp); setXps(xm)
    const tm = {}; (ttR.data || []).forEach(t => { if (!tm[t.user_id]) tm[t.user_id] = { total: 0, video: 0 }; tm[t.user_id].total += t.total_seconds; tm[t.user_id].video += t.video_seconds }); setTimes(tm)
  })() }, [])
  const fmtTime = s => { if (!s) return '0m'; const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); return h > 0 ? `${h}h${m}m` : `${m}m` }
  const fmtDate = d => { if (!d) return '—'; const df = Math.floor((new Date() - new Date(d)) / 86400000); return df === 0 ? "Aujourd'hui" : df === 1 ? 'Hier' : df < 7 ? `Il y a ${df}j` : new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) }
  return (
    <div><h1 className="page-title">Progression</h1><p className="page-subtitle">Suivi des élèves</p>
      <div className="card" style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead><tr style={{ background: 'var(--bg)', borderBottom: '2px solid var(--border)' }}>{['Élève', '%', 'Temps', 'Dernière co.', 'Connexions', 'PDF', 'XP'].map(h => <th key={h} style={{ padding: '10px 10px', textAlign: 'center', fontWeight: 700, color: 'var(--text-sec)', fontSize: 11, textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
        <tbody>{students.map(s => { const done = (data[s.id] || []).length; const pct = totalCh > 0 ? Math.round((done / totalCh) * 100) : 0; const stk = streaks[s.id]; const inactive = stk?.last_login && Math.floor((new Date() - new Date(stk.last_login)) / 86400000) >= 3; const t = times[s.id]; return <tr key={s.id} style={{ borderBottom: '1px solid var(--border)', background: inactive ? '#FEF2F2' : 'white' }}>
          <td style={{ padding: '10px', textAlign: 'left' }}><div style={{ fontWeight: 600 }}>{s.first_name} {s.last_name}</div>{inactive && <div style={{ fontSize: 10, color: 'var(--danger)', fontWeight: 700 }}>⚠️ Inactif</div>}</td>
          <td style={{ padding: '10px', textAlign: 'center', fontWeight: 800, fontFamily: 'monospace', color: pct >= 75 ? 'var(--success)' : 'var(--accent)' }}>{pct}%</td>
          <td style={{ padding: '10px', textAlign: 'center', fontFamily: 'monospace' }}>{fmtTime(t?.total)}</td>
          <td style={{ padding: '10px', textAlign: 'center', color: inactive ? 'var(--danger)' : 'var(--text)' }}>{fmtDate(stk?.last_login)}</td>
          <td style={{ padding: '10px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent)' }}>{stk?.total_logins || 0}</td>
          <td style={{ padding: '10px', textAlign: 'center', fontFamily: 'monospace' }}>{pdfs[s.id] || 0}</td>
          <td style={{ padding: '10px', textAlign: 'center', fontFamily: 'monospace', color: '#7C3AED' }}>{xps[s.id] || 0}</td>
        </tr> })}</tbody>
      </table></div>
    </div>
  )
}

function AdminAssignments({ students }) {
  const [assignments, setAssignments] = useState([]); const [subs, setSubs] = useState([]); const [aMap, setAMap] = useState({}); const [modal, setModal] = useState(false); const [corrModal, setCorrModal] = useState(null)
  const [title, setTitle] = useState(''); const [desc, setDesc] = useState(''); const [dueDate, setDueDate] = useState(''); const [imgFile, setImgFile] = useState(null); const [selSt, setSelSt] = useState([]); const [assignAll, setAssignAll] = useState(true)
  const [score, setScore] = useState(''); const [feedback, setFeedback] = useState(''); const [creating, setCreating] = useState(false)
  const load = async () => { const { data: a } = await supabase.from('assignments').select('*').order('created_at', { ascending: false }); const { data: s } = await supabase.from('submissions').select('*'); const { data: as } = await supabase.from('assignment_students').select('*'); setAssignments(a || []); setSubs(s || []); const m = {}; (as || []).forEach(x => { if (!m[x.assignment_id]) m[x.assignment_id] = []; m[x.assignment_id].push(x.user_id) }); setAMap(m) }
  useEffect(() => { load() }, [])
  const create = async () => { if (!title) return; setCreating(true); let iu = ''; if (imgFile) { const p = `enonces/${Date.now()}.${imgFile.name.split('.').pop()}`; const { error } = await supabase.storage.from('submissions').upload(p, imgFile); if (!error) { const { data } = supabase.storage.from('submissions').getPublicUrl(p); iu = data.publicUrl } }; const { data: na } = await supabase.from('assignments').insert({ title, description: desc, due_date: dueDate || null, image_url: iu }).select().single(); if (!assignAll && selSt.length && na) await supabase.from('assignment_students').insert(selSt.map(uid => ({ assignment_id: na.id, user_id: uid }))); setTitle(''); setDesc(''); setDueDate(''); setImgFile(null); setSelSt([]); setAssignAll(true); setModal(false); setCreating(false); load() }
  const correct = async () => { if (!corrModal) return; await supabase.from('submissions').update({ score: parseFloat(score), feedback, corrected: true }).eq('id', corrModal.id); setCorrModal(null); setScore(''); setFeedback(''); load() }
  const getTargeted = aid => { const sp = aMap[aid]; if (!sp?.length) return students.filter(s => s.active); return students.filter(s => sp.includes(s.id)) }
  return (
    <div><h1 className="page-title">Devoirs</h1><button className="btn btn-primary" onClick={() => setModal(true)} style={{ marginBottom: 20 }}>{IC.plus} Nouveau</button>
      {assignments.map(a => { const targeted = getTargeted(a.id); const subsList = subs.filter(s => s.assignment_id === a.id); const notDone = targeted.filter(s => !subsList.some(sub => sub.user_id === s.id)); return (
        <div key={a.id} className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><div><span style={{ fontWeight: 700 }}>{a.title}</span><br/><span style={{ fontSize: 12, color: 'var(--text-sec)' }}>{!aMap[a.id]?.length ? '👥 Tous' : `👤 ${targeted.map(s => s.first_name).join(', ')}`}{a.due_date ? ` · 📅 ${new Date(a.due_date).toLocaleDateString('fr-FR')}` : ''}</span></div><div className="row gap-sm"><span className="badge" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>{subsList.length}/{targeted.length}</span><button onClick={() => { supabase.from('assignments').delete().eq('id', a.id); load() }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-sec)' }}>{IC.trash}</button></div></div>
          {subsList.map(sub => { const st = students.find(s => s.id === sub.user_id); return <div key={sub.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: 8 }}><div className="row gap-sm"><span className="badge badge-success" style={{ fontSize: 10, padding: '2px 6px' }}>✅</span><span style={{ fontWeight: 600, fontSize: 13 }}>{st ? `${st.first_name} ${st.last_name}` : '?'}</span></div><div className="row gap-sm">{sub.corrected ? <span className="badge badge-success" style={{ fontWeight: 800 }}>{sub.score}/20</span> : <button className="btn btn-primary btn-sm" onClick={() => { setCorrModal(sub); setScore(''); setFeedback('') }}>Corriger</button>}<a href={sub.image_url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">📷</a></div></div> })}
          {notDone.map(st => { const overdue = a.due_date && new Date(a.due_date) < new Date(); return <div key={st.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid var(--border)', background: overdue ? '#FEF2F2' : undefined }}><div className="row gap-sm"><span className="badge" style={{ background: overdue ? 'var(--danger-bg)' : 'var(--bg)', color: overdue ? 'var(--danger)' : 'var(--text-sec)', fontSize: 10, padding: '2px 6px' }}>{overdue ? '⚠️' : '⏳'}</span><span style={{ fontSize: 13, color: overdue ? 'var(--danger)' : 'var(--text)' }}>{st.first_name} {st.last_name}</span></div><span style={{ fontSize: 12, color: overdue ? 'var(--danger)' : 'var(--text-sec)' }}>{overdue ? 'En retard' : 'Pas rendu'}</span></div> })}
        </div>
      ) })}
      {modal && <Modal title="Nouveau devoir" onClose={() => setModal(false)}>
        <div className="form-group"><label className="form-label">Titre *</label><input className="form-input" value={title} onChange={e => setTitle(e.target.value)} autoFocus /></div>
        <div className="form-group"><label className="form-label">Consigne</label><input className="form-input" value={desc} onChange={e => setDesc(e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Date limite</label><input className="form-input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Énoncé</label><input type="file" accept="image/*" onChange={e => setImgFile(e.target.files[0])} style={{ fontSize: 13 }} /></div>
        <div className="form-group"><label className="form-label">Assigner à</label><div style={{ display: 'flex', gap: 8, marginBottom: 10 }}><button className={`btn btn-sm ${assignAll ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setAssignAll(true); setSelSt([]) }}>Tous</button><button className={`btn btn-sm ${!assignAll ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setAssignAll(false)}>Choisir</button></div>
          {!assignAll && <div style={{ border: '1px solid var(--border)', borderRadius: 10, maxHeight: 200, overflowY: 'auto' }}>{students.filter(s => s.active).map(s => <div key={s.id} onClick={() => setSelSt(p => p.includes(s.id) ? p.filter(i => i !== s.id) : [...p, s.id])} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)', background: selSt.includes(s.id) ? 'var(--accent-bg)' : 'white' }}><div style={{ width: 18, height: 18, borderRadius: 4, border: selSt.includes(s.id) ? 'none' : '2px solid var(--border)', background: selSt.includes(s.id) ? 'var(--accent)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{selSt.includes(s.id) && IC.check}</div><span style={{ fontSize: 13 }}>{s.first_name} {s.last_name}</span></div>)}</div>}
        </div>
        <div className="modal-actions"><button className="btn btn-secondary btn-sm" onClick={() => setModal(false)}>Annuler</button><button className="btn btn-primary btn-sm" onClick={create} disabled={creating}>{creating ? '...' : 'Créer'}</button></div>
      </Modal>}
      {corrModal && <Modal title="Corriger" onClose={() => setCorrModal(null)}><a href={corrModal.image_url} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', marginBottom: 16 }}>📷 Voir</a><div className="form-group"><label className="form-label">Note /20</label><input className="form-input" type="number" step="0.5" min="0" max="20" value={score} onChange={e => setScore(e.target.value)} /></div><div className="form-group"><label className="form-label">Commentaire</label><input className="form-input" value={feedback} onChange={e => setFeedback(e.target.value)} /></div><div className="modal-actions"><button className="btn btn-secondary btn-sm" onClick={() => setCorrModal(null)}>Annuler</button><button className="btn btn-primary btn-sm" onClick={correct}>Valider</button></div></Modal>}
    </div>
  )
}

// ═══ MAIN APP ═══
export default function Home() {
  const [user, setUser] = useState(null); const [page, setPage] = useState('welcome'); const [toast, setToast] = useState(null); const [loading, setLoading] = useState(true); const [mobileOpen, setMobileOpen] = useState(false)
  const [students, setStudents] = useState([]); const [allSections, setAllSections] = useState([]); const [videos, setVideos] = useState([]); const [settings, setSettings] = useState({}); const [completedVideos, setCompletedVideos] = useState([]); const [completedChapters, setCompletedChapters] = useState([]); const [streak, setStreak] = useState({}); const [xp, setXp] = useState(0); const [xpPopup, setXpPopup] = useState(null); const [weeklyVideos, setWeeklyVideos] = useState(0); const [lastVideo, setLastVideo] = useState(null); const [showCert, setShowCert] = useState(false)
  const showToast = useCallback(m => { setToast(m); setTimeout(() => setToast(null), 2500) }, [])
  const formSections = useMemo(() => allSections.filter(s => s.type === 'formation'), [allSections])
  const prepSections = useMemo(() => allSections.filter(s => s.type === 'prep'), [allSections])
  const totalChapters = useMemo(() => formSections.reduce((a, s) => a + (s.chapters?.length || 0), 0), [formSections])
  const totalVideos = useMemo(() => videos.filter(v => { const fChIds = formSections.flatMap(s => (s.chapters || []).map(c => c.id)); return fChIds.includes(v.chapter_id) }).length, [videos, formSections])

  const earnXP = useCallback(async (userId, actionKey) => {
    const action = XP_ACTIONS[actionKey]; if (!action || !userId) return
    try { await supabase.from('xp_history').insert({ user_id: userId, action: actionKey, xp_earned: action.xp }); const { data } = await supabase.from('student_xp').select('*').eq('user_id', userId).single(); const nt = (data?.total_xp || 0) + action.xp; const nl = getLevel(nt).level; if (data) { await supabase.from('student_xp').update({ total_xp: nt, level: nl }).eq('user_id', userId) } else { await supabase.from('student_xp').insert({ user_id: userId, total_xp: nt, level: nl }) }; setXp(nt); setXpPopup({ xp: action.xp, label: action.label }); setTimeout(() => setXpPopup(null), 2000) } catch {}
  }, [])

  const loadData = useCallback(async () => {
    const [stuR, secR, chR, vidR, setR] = await Promise.all([supabase.from('users').select('*').eq('role', 'student').order('created_at'), supabase.from('sections').select('*').order('sort_order'), supabase.from('chapters').select('*').order('sort_order'), supabase.from('videos').select('*').order('sort_order'), supabase.from('settings').select('*')])
    setStudents(stuR.data || []); setVideos(vidR.data || [])
    const allCh = chR.data || []; const allVid = vidR.data || []
    const chWithVid = allCh.map(c => ({ ...c, videos: allVid.filter(v => v.chapter_id === c.id) }))
    const secWithAll = (secR.data || []).map(s => ({ ...s, chapters: chWithVid.filter(c => c.section_id === s.id) }))
    setAllSections(secWithAll)
    const sm = {}; (setR.data || []).forEach(s => sm[s.key] = s.value); setSettings(sm)
    setLoading(false)
  }, [])

  const loadStudentData = useCallback(async userId => {
    const [vpR, cpR] = await Promise.all([supabase.from('video_progress').select('video_id, completed_at').eq('user_id', userId).eq('completed', true).order('completed_at', { ascending: false }), supabase.from('chapter_progress').select('chapter_id').eq('user_id', userId).eq('completed', true)])
    const vpData = vpR.data || []
    setCompletedVideos(vpData.map(r => r.video_id)); setCompletedChapters((cpR.data || []).map(r => r.chapter_id))
    // Weekly count
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
    setWeeklyVideos(vpData.filter(v => v.completed_at && v.completed_at >= weekAgo).length)
    // Last video
    if (vpData.length > 0) setLastVideo(vpData[0].video_id)
    try { const { data } = await supabase.from('student_xp').select('total_xp').eq('user_id', userId).single(); if (data) setXp(data.total_xp) } catch {}
  }, [])

  const updateStreak = useCallback(async userId => {
    const today = new Date().toISOString().split('T')[0]; const now = new Date().toISOString()
    try { const { data: ex } = await supabase.from('student_streaks').select('*').eq('user_id', userId).single()
      if (ex) { if (ex.last_login === today) { await supabase.from('student_streaks').update({ last_login_time: now }).eq('user_id', userId); setStreak(ex); return }; const yest = new Date(Date.now() - 86400000).toISOString().split('T')[0]; let ns = ex.last_login === yest ? ex.current_streak + 1 : 1; const bs = Math.max(ns, ex.best_streak || 0); const tl = (ex.total_logins || 0) + 1; await supabase.from('student_streaks').update({ current_streak: ns, last_login: today, best_streak: bs, total_logins: tl, last_login_time: now }).eq('user_id', userId); setStreak({ current_streak: ns, last_login: today, best_streak: bs, total_logins: tl }); if (ns > 1) await earnXP(userId, 'streak_day') }
      else { await supabase.from('student_streaks').insert({ user_id: userId, current_streak: 1, last_login: today, best_streak: 1, total_logins: 1, last_login_time: now }); setStreak({ current_streak: 1, best_streak: 1, total_logins: 1 }) }
    } catch { setStreak({ current_streak: 0 }) }
  }, [earnXP])

  // Time tracking
  useEffect(() => {
    if (!user || user.role === 'admin') return
    const ping = async () => { const today = new Date().toISOString().split('T')[0]; try { const { data } = await supabase.from('time_tracking').select('*').eq('user_id', user.id).eq('session_date', today).single(); if (data) await supabase.from('time_tracking').update({ total_seconds: data.total_seconds + 30, last_ping: new Date().toISOString() }).eq('id', data.id); else await supabase.from('time_tracking').insert({ user_id: user.id, session_date: today, total_seconds: 30 }) } catch {} }
    const interval = setInterval(ping, 30000); ping(); return () => clearInterval(interval)
  }, [user])

  useEffect(() => { loadData() }, [loadData])

  const login = async (username, password, setErr) => {
    const { data, error } = await supabase.from('users').select('*').eq('username', username).eq('password', password).single()
    if (error || !data) { setErr('Identifiant ou mot de passe incorrect'); return }
    if (!data.active && data.role !== 'admin') { setErr('Compte désactivé'); return }
    setUser(data)
    if (data.role === 'admin') setPage('admin-dash')
    else { setPage('welcome'); await loadStudentData(data.id); await updateStreak(data.id) }
  }

  const toggleVideoComplete = async videoId => { if (!user) return; if (completedVideos.includes(videoId)) { await supabase.from('video_progress').delete().eq('user_id', user.id).eq('video_id', videoId); setCompletedVideos(p => p.filter(id => id !== videoId)) } else { await supabase.from('video_progress').upsert({ user_id: user.id, video_id: videoId, completed: true }); setCompletedVideos(p => [...p, videoId]) } }
  const toggleChapterComplete = async chapterId => { if (!user) return; if (completedChapters.includes(chapterId)) { await supabase.from('chapter_progress').delete().eq('user_id', user.id).eq('chapter_id', chapterId); setCompletedChapters(p => p.filter(id => id !== chapterId)) } else { await supabase.from('chapter_progress').upsert({ user_id: user.id, chapter_id: chapterId, completed: true }); setCompletedChapters(p => [...p, chapterId]); await earnXP(user.id, 'complete_chapter') } }
  const trackPdf = async (type, title) => { if (!user) return; try { await supabase.from('pdf_clicks').insert({ user_id: user.id, pdf_type: type, chapter_title: title }) } catch {}; await earnXP(user.id, 'open_pdf') }
  const logout = () => { setUser(null); setPage('welcome'); setCompletedVideos([]); setCompletedChapters([]); setStreak({}); setXp(0) }

  const handleContinue = () => { setPage('chapters') }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-sec)' }}>Chargement...</div>
  if (!user) return <LoginPage onLogin={login} />
  const isAdmin = user.role === 'admin'
  const studentNav = [{ id: 'welcome', label: 'Accueil', icon: IC.home }, { id: 'chapters', label: 'Formation', icon: IC.book }, { id: 'games', label: 'Entraînement', icon: IC.game }]
  const adminNav = [{ id: 'admin-dash', label: 'Dashboard', icon: IC.dash }, { id: 'admin-students', label: 'Élèves', icon: IC.users }, { id: 'admin-formation', label: 'Contenu', icon: IC.book }, { id: 'admin-progress', label: 'Progression', icon: IC.chart }]

  return (
    <div className="app-layout">
      <Sidebar items={isAdmin ? adminNav : studentNav} current={page} setCurrent={setPage} onLogout={logout} role={user.role} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="main-content">
        {!isAdmin && page === 'welcome' && <WelcomePage completedChapters={completedChapters} totalChapters={totalChapters} completedVideos={completedVideos.length} totalVideos={totalVideos} streak={streak} xp={xp} sections={formSections} onNavigate={setPage} onContinue={handleContinue} allSections={allSections} userName={user.first_name} />}
        {!isAdmin && page === 'chapters' && <CourseView sections={formSections} completedVideos={completedVideos} completedChapters={completedChapters} toggleVideoComplete={toggleVideoComplete} toggleChapterComplete={toggleChapterComplete} trackPdf={trackPdf} earnXP={earnXP} userId={user.id} title="Formation" subtitle={`${totalChapters} chapitres · ${totalVideos} vidéos`} />}
        {!isAdmin && page === 'games' && <GamesPage userId={user.id} earnXP={earnXP} />}
        {isAdmin && page === 'admin-dash' && <AdminDash students={students} sections={allSections} videos={videos} />}
        {isAdmin && page === 'admin-students' && <AdminStudents students={students} reload={loadData} showToast={showToast} />}
        {isAdmin && page === 'admin-formation' && <AdminContent sections={allSections} reload={loadData} showToast={showToast} contentType="formation" />}
        {isAdmin && page === 'admin-progress' && <AdminProgress students={students} sections={allSections} />}
      </div>
      {toast && <Toast message={toast} />}
      {xpPopup && <div style={{ position: 'fixed', top: 80, right: 24, background: 'linear-gradient(135deg, #312E81, #1E1B4B)', color: '#A5B4FC', padding: '12px 20px', borderRadius: 14, fontSize: 14, fontWeight: 800, zIndex: 300, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 30px rgba(0,0,0,0.3)', animation: 'toastIn 0.3s ease' }}>⚡ +{xpPopup.xp} XP — {xpPopup.label}</div>}
      {showCert && <div className="modal-overlay" onClick={() => setShowCert(false)}>
        <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 20, padding: 40, maxWidth: 600, width: '100%', textAlign: 'center' }}>
          <div style={{ border: '3px solid #F59E0B', borderRadius: 16, padding: '40px 30px', background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Certificat de réussite</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#78350F', marginBottom: 4 }}>Brevet Booster</div>
            <div style={{ fontSize: 14, color: '#92400E', marginBottom: 20 }}>Formation Mathématiques — Brevet 2026</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#78350F', marginBottom: 4 }}>Décerné à</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#4F46E5', marginBottom: 20 }}>{user?.first_name} {user?.last_name}</div>
            <div style={{ fontSize: 13, color: '#92400E', lineHeight: 1.6 }}>Pour avoir complété l&apos;intégralité de la formation<br/>avec succès et détermination.</div>
            <div style={{ marginTop: 20, fontSize: 12, color: '#B45309' }}>Délivré le {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
            <button className="btn btn-primary" onClick={() => window.print()}>🖨️ Imprimer</button>
            <button className="btn btn-secondary" onClick={() => setShowCert(false)}>Fermer</button>
          </div>
        </div>
      </div>}
    </div>
  )
}
