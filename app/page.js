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
function getNextBadge(c) { return [...BADGES].reverse().find(b => c < b.min) || null }

const XP_ACTIONS = { complete_chapter: { xp: 50, label: 'Chapitre terminé' }, watch_video: { xp: 15, label: 'Vidéo vue' }, open_pdf: { xp: 5, label: 'PDF ouvert' }, streak_day: { xp: 20, label: 'Streak' }, game_played: { xp: 10, label: 'Jeu terminé' } }
const XP_LEVELS = [{ level:1, name:'Débutant', min:0, emoji:'🌱' },{ level:2, name:'Apprenti', min:100, emoji:'📗' },{ level:3, name:'Intermédiaire', min:250, emoji:'📘' },{ level:4, name:'Avancé', min:500, emoji:'⚡' },{ level:5, name:'Expert', min:1000, emoji:'🔥' },{ level:6, name:'Maître', min:2000, emoji:'👑' },{ level:7, name:'Légende', min:3500, emoji:'🏆' }]
function getLevel(xp) { return [...XP_LEVELS].reverse().find(l => xp >= l.min) || XP_LEVELS[0] }
function getNextLevel(xp) { return XP_LEVELS.find(l => xp < l.min) || null }

const FUN_FACTS = [
  "Le nombre π a été calculé à plus de 100 000 milliards de décimales !",
  "Le mot « calcul » vient du latin « calculus » qui signifie petit caillou.",
  "Un googol, c'est 10 puissance 100. C'est de là que vient le nom Google !",
  "Le symbole = a été inventé en 1557 par Robert Recorde.",
  "Al-Khwarizmi, un savant musulman du 9e siècle, est le père de l'algèbre.",
  "111 111 111 × 111 111 111 = 12 345 678 987 654 321. Magique !",
  "Le zéro a été inventé en Inde au 7e siècle.",
  "La somme des angles d'un triangle fait toujours 180°.",
  "Le nombre d'or (1,618) se retrouve dans la nature : coquillages, tournesols, galaxies...",
  "La probabilité d'avoir le même anniversaire dans un groupe de 23 personnes dépasse 50% !",
]

const IC = {
  home: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  book: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  target: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  play: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
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
  edit: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  menu: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  arrowL: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  arrowR: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
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
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch) return { type: 'youtube', id: ytMatch[1] }
  if (url.includes('loom.com')) { const m = url.match(/loom\.com\/(?:share|embed)\/([a-f0-9]+)/); if (m) return { type: 'loom', id: m[1] } }
  return { type: 'mp4', url }
}

// ═══ LOGIN ═══
function LoginPage({ onLogin }) {
  const [u, setU] = useState(''); const [p, setP] = useState(''); const [err, setErr] = useState(''); const [loading, setLoading] = useState(false)
  const go = async (e) => { e.preventDefault(); setErr(''); setLoading(true); await onLogin(u.trim(), p.trim(), setErr); setLoading(false) }
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
        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: 14, fontSize: 15, borderRadius: 12 }} disabled={loading}>{loading ? 'Connexion...' : 'Se connecter'}</button>
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

// ═══ WELCOME ═══
function WelcomePage({ settings, completedChapters, totalChapters, completedVideos, totalVideos, streak, xp }) {
  const pct = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0
  const badge = getBadge(completedChapters)
  const [funFact] = useState(() => FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)])
  const level = getLevel(xp); const nextLevel = getNextLevel(xp)
  const xpInLevel = nextLevel ? xp - level.min : 0; const xpForNext = nextLevel ? nextLevel.min - level.min : 1
  const diff = BREVET_DATE - new Date(); const daysLeft = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
  return (
    <div>
      <h1 className="page-title">Bienvenue sur Brevet Booster</h1>
      <p className="page-subtitle">Ta plateforme de révision maths pour le brevet</p>
      <div style={{ background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)', borderRadius: 14, padding: '12px 18px', marginBottom: 16, border: '1px solid #C7D2FE', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 22 }}>🧠</span><div><div style={{ fontSize: 10, fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: 0.5 }}>Le savais-tu ?</div><div style={{ fontSize: 13, color: '#3730A3', lineHeight: 1.4 }}>{funFact}</div></div>
      </div>
      <div style={{ padding: 20, marginBottom: 16, background: 'linear-gradient(135deg, #1E1B4B, #312E81)', color: 'white', borderRadius: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontSize: 28 }}>{level.emoji}</span><div><div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Niveau {level.level}</div><div style={{ fontSize: 17, fontWeight: 800 }}>{level.name}</div></div></div>
          <div style={{ textAlign: 'right' }}><div style={{ fontSize: 24, fontWeight: 900, fontFamily: 'monospace', color: '#A5B4FC' }}>{xp}</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>XP total</div></div>
        </div>
        {nextLevel && <div><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}><span>{level.name}</span><span>{nextLevel.emoji} {nextLevel.name} — {nextLevel.min} XP</span></div><div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 20, height: 6, overflow: 'hidden' }}><div style={{ width: `${Math.min(100, (xpInLevel / xpForNext) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, #818CF8, #A5B4FC)', borderRadius: 20 }} /></div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 3 }}>Encore {nextLevel.min - xp} XP</div></div>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        <div className="card" style={{ padding: '14px 8px', textAlign: 'center' }}><div style={{ fontSize: 24, fontWeight: 900, fontFamily: 'monospace', color: 'var(--accent)' }}>{pct}%</div><div style={{ fontSize: 10, color: 'var(--text-sec)', marginTop: 4 }}>{completedChapters}/{totalChapters} chap.</div></div>
        <div className="card" style={{ padding: '14px 8px', textAlign: 'center' }}><div style={{ fontSize: 20, marginBottom: 2 }}>🔥</div><div style={{ fontSize: 20, fontWeight: 900, fontFamily: 'monospace', color: '#F59E0B' }}>{streak.current_streak || 0}j</div><div style={{ fontSize: 10, color: 'var(--text-sec)' }}>de suite</div></div>
        <div className="card" style={{ padding: '14px 8px', textAlign: 'center' }}>{badge ? <><div style={{ fontSize: 20 }}>{badge.emoji}</div><div style={{ fontSize: 12, fontWeight: 800, color: badge.color }}>{badge.name}</div></> : <><div style={{ fontSize: 20, opacity: 0.3 }}>🥉</div><div style={{ fontSize: 10, color: 'var(--text-sec)' }}>Aucun</div></>}</div>
        <div className="card" style={{ padding: '14px 8px', textAlign: 'center' }}><div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'monospace' }}>{daysLeft}j</div><div style={{ fontSize: 10, color: 'var(--text-sec)', marginTop: 4 }}>avant brevet</div></div>
      </div>
      <div className="card" style={{ padding: '12px 20px', marginBottom: 16 }}><div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-sec)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Badges</div><div style={{ display: 'flex', justifyContent: 'space-around' }}>{[...BADGES].reverse().map(b => <div key={b.id} style={{ textAlign: 'center', opacity: completedChapters >= b.min ? 1 : 0.3 }}><div style={{ fontSize: 22 }}>{b.emoji}</div><div style={{ fontSize: 10, fontWeight: 700, color: completedChapters >= b.min ? b.color : 'var(--text-sec)' }}>{b.min}</div></div>)}</div></div>
      {settings.welcome_video && <div className="card" style={{ padding: 18 }}><h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>Présentation</h2><p style={{ color: 'var(--text-sec)', fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>{settings.welcome_text || ''}</p><div style={{ borderRadius: 10, overflow: 'hidden', position: 'relative', paddingBottom: '45%', background: '#000' }}><iframe src={settings.welcome_video} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} allowFullScreen /></div></div>}
    </div>
  )
}

// ═══ CHAPTERS (Sections → Chapters → Videos + PDFs) ═══
function ChaptersPage({ sections, completedVideos, completedChapters, toggleVideoComplete, toggleChapterComplete, trackPdf, earnXP, userId }) {
  const [openChapter, setOpenChapter] = useState(null)
  const [viewingVideo, setViewingVideo] = useState(null)
  const [viewingPdf, setViewingPdf] = useState(null)

  const openPdf = (url, title, type) => { trackPdf(type, title); setViewingPdf({ url, title, type }) }

  if (viewingPdf) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <button onClick={() => setViewingPdf(null)} className="btn btn-secondary btn-sm">{IC.arrowL} Retour</button>
          <div><div style={{ fontSize: 16, fontWeight: 700 }}>{viewingPdf.title}</div></div>
          <a href={viewingPdf.url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }}>↗ Nouvel onglet</a>
        </div>
        <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)', background: '#525659' }}>
          <iframe src={`${viewingPdf.url}#toolbar=1`} style={{ width: '100%', height: 'calc(100vh - 180px)', minHeight: 400, border: 'none' }} />
        </div>
      </div>
    )
  }

  if (viewingVideo) {
    const embed = getVideoEmbed(viewingVideo.video_url)
    const chapter = sections.flatMap(s => s.chapters || []).find(c => (c.videos || []).some(v => v.id === viewingVideo.id))
    const allVideos = chapter?.videos || []
    const idx = allVideos.findIndex(v => v.id === viewingVideo.id)
    const isDone = completedVideos.includes(viewingVideo.id)
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <button onClick={() => setViewingVideo(null)} className="btn btn-secondary btn-sm">{IC.arrowL} Retour</button>
          <div style={{ fontSize: 13, color: 'var(--text-sec)' }}>{chapter?.title} › <span style={{ color: 'var(--text)', fontWeight: 500 }}>{viewingVideo.title}</span></div>
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{viewingVideo.title}</h1>
        <p style={{ fontSize: 13, color: 'var(--text-sec)', marginBottom: 16 }}>Vidéo {idx + 1}/{allVideos.length}{viewingVideo.duration_minutes > 0 ? ` · ${viewingVideo.duration_minutes} min` : ''}</p>
        {embed?.type === 'youtube' ? (
          <div style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 16, position: 'relative', paddingBottom: '56.25%', background: '#000' }}>
            <iframe src={`https://www.youtube.com/embed/${embed.id}?rel=0&modestbranding=1`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} allowFullScreen />
          </div>
        ) : embed?.type === 'loom' ? (
          <div style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 16, position: 'relative', paddingBottom: '56.25%', background: '#000' }}>
            <iframe src={`https://www.loom.com/embed/${embed.id}`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} allowFullScreen />
          </div>
        ) : embed?.type === 'mp4' ? (
          <div style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 16, background: '#000' }}>
            <video controls style={{ width: '100%', display: 'block' }} src={embed.url}>Ton navigateur ne supporte pas la vidéo.</video>
          </div>
        ) : (
          <div style={{ borderRadius: 14, background: 'var(--bg)', border: '1px solid var(--border)', padding: 60, textAlign: 'center', marginBottom: 16 }}><div style={{ fontSize: 40, marginBottom: 8 }}>🎥</div><p style={{ color: 'var(--text-sec)' }}>Vidéo bientôt disponible</p></div>
        )}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <button onClick={() => idx > 0 && setViewingVideo(allVideos[idx - 1])} disabled={idx <= 0} className="btn btn-secondary" style={{ flex: 1, opacity: idx > 0 ? 1 : 0.4 }}>{IC.arrowL} Précédente</button>
          <button onClick={() => { toggleVideoComplete(viewingVideo.id); if (!isDone) earnXP(userId, 'watch_video') }} className={`btn ${isDone ? 'btn-secondary' : 'btn-primary'}`} style={{ flex: 2 }}>{isDone ? '✅ Vue' : 'Marquer comme vue'}</button>
          <button onClick={() => idx < allVideos.length - 1 && setViewingVideo(allVideos[idx + 1])} disabled={idx >= allVideos.length - 1} className="btn btn-secondary" style={{ flex: 1, opacity: idx < allVideos.length - 1 ? 1 : 0.4 }}>Suivante {IC.arrowR}</button>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 8 }}>Vidéos du chapitre</div>
        <div className="card" style={{ marginBottom: 16 }}>{allVideos.map((v, i) => {
          const active = v.id === viewingVideo.id; const done = completedVideos.includes(v.id)
          return <div key={v.id} onClick={() => setViewingVideo(v)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', cursor: 'pointer', background: active ? 'var(--accent-bg)' : 'transparent', borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent', borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: done ? 'var(--success)' : 'transparent', border: done ? 'none' : '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}</div>
            <span style={{ flex: 1, fontSize: 13, fontWeight: active ? 600 : 400, color: active ? 'var(--accent)' : done ? 'var(--text-sec)' : 'var(--text)' }}>{v.title}</span>
            {v.duration_minutes > 0 && <span style={{ fontSize: 11, color: 'var(--text-sec)' }}>{v.duration_minutes}m</span>}
          </div>
        })}</div>
        {chapter && (chapter.pdf_url || chapter.exercises_pdf_url || chapter.eval_pdf_url) && (
          <div><div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 8 }}>Ressources</div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {chapter.pdf_url && <button onClick={() => openPdf(chapter.pdf_url, chapter.title, 'cours')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--accent-bg)', color: 'var(--accent)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>📘 Cours</button>}
            {chapter.exercises_pdf_url && <button onClick={() => openPdf(chapter.exercises_pdf_url, chapter.title, 'exercices')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--danger-bg)', color: 'var(--danger)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>✏️ Exercices</button>}
            {chapter.eval_pdf_url && <button onClick={() => openPdf(chapter.eval_pdf_url, chapter.title, 'auto-eval')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10, borderRadius: 10, border: '1px solid var(--border)', background: '#FEF3C7', color: '#92400E', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>📝 Auto-éval</button>}
          </div></div>
        )}
      </div>
    )
  }

  const totalVids = sections.flatMap(s => (s.chapters || []).flatMap(c => c.videos || [])).length
  return (
    <div>
      <h1 className="page-title">Chapitres</h1>
      <p className="page-subtitle">{sections.reduce((a, s) => a + (s.chapters?.length || 0), 0)} chapitres · {totalVids} vidéos</p>
      {sections.map(section => (
        <div key={section.id} style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-bg)', padding: '4px 14px', borderRadius: 8 }}>{section.emoji} {section.title}</span>
            <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
          </div>
          {(section.chapters || []).map((ch, ci) => {
            const vids = ch.videos || []; const isOpen = openChapter === ch.id
            const doneVids = vids.filter(v => completedVideos.includes(v.id)).length
            const chDone = completedChapters.includes(ch.id)
            return (
              <div key={ch.id} className="card" style={{ marginBottom: 8, borderColor: isOpen ? 'var(--accent)' : undefined }}>
                <div onClick={() => setOpenChapter(isOpen ? null : ch.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className={`checkbox ${chDone ? 'checked' : ''}`} onClick={e => { e.stopPropagation(); toggleChapterComplete(ch.id) }}>{chDone && IC.check}</div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-sec)', fontFamily: 'monospace' }}>{ci + 1}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, textDecoration: chDone ? 'line-through' : 'none', color: chDone ? 'var(--text-sec)' : 'var(--text)' }}>{ch.title}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {vids.length > 0 && <span style={{ fontSize: 12, color: doneVids === vids.length && vids.length > 0 ? 'var(--success)' : 'var(--text-sec)' }}>{doneVids}/{vids.length}</span>}
                    <div style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: 'var(--text-sec)' }}>{IC.chev}</div>
                  </div>
                </div>
                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--border)' }}>
                    {vids.length > 0 ? vids.map(v => {
                      const done = completedVideos.includes(v.id)
                      return <div key={v.id} onClick={() => setViewingVideo(v)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px 10px 56px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: done ? 'var(--success)' : 'transparent', border: done ? 'none' : '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}</div>
                        <span style={{ color: 'var(--accent)', flexShrink: 0 }}>{IC.play}</span>
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{v.title}</span>
                        {v.duration_minutes > 0 && <span style={{ fontSize: 11, color: 'var(--text-sec)' }}>{v.duration_minutes}m</span>}
                      </div>
                    }) : <div style={{ padding: '16px 56px', fontSize: 13, color: 'var(--text-sec)' }}>Aucune vidéo pour le moment</div>}
                    <div style={{ padding: '10px 18px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      <button onClick={() => ch.pdf_url && openPdf(ch.pdf_url, ch.title, 'cours')} disabled={!ch.pdf_url} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '8px 6px', borderRadius: 8, border: '1px solid var(--border)', background: ch.pdf_url ? 'var(--accent-bg)' : 'var(--bg)', color: ch.pdf_url ? 'var(--accent)' : 'var(--text-sec)', fontSize: 12, fontWeight: 600, cursor: ch.pdf_url ? 'pointer' : 'default', fontFamily: 'inherit', opacity: ch.pdf_url ? 1 : 0.4 }}>📘 Cours</button>
                      <button onClick={() => ch.exercises_pdf_url && openPdf(ch.exercises_pdf_url, ch.title, 'exercices')} disabled={!ch.exercises_pdf_url} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '8px 6px', borderRadius: 8, border: '1px solid var(--border)', background: ch.exercises_pdf_url ? 'var(--danger-bg)' : 'var(--bg)', color: ch.exercises_pdf_url ? 'var(--danger)' : 'var(--text-sec)', fontSize: 12, fontWeight: 600, cursor: ch.exercises_pdf_url ? 'pointer' : 'default', fontFamily: 'inherit', opacity: ch.exercises_pdf_url ? 1 : 0.4 }}>✏️ Exercices</button>
                      <button onClick={() => ch.eval_pdf_url && openPdf(ch.eval_pdf_url, ch.title, 'auto-eval')} disabled={!ch.eval_pdf_url} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '8px 6px', borderRadius: 8, border: '1px solid var(--border)', background: ch.eval_pdf_url ? '#FEF3C7' : 'var(--bg)', color: ch.eval_pdf_url ? '#92400E' : 'var(--text-sec)', fontSize: 12, fontWeight: 600, cursor: ch.eval_pdf_url ? 'pointer' : 'default', fontFamily: 'inherit', opacity: ch.eval_pdf_url ? 1 : 0.4 }}>📝 Auto-éval</button>
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

// ═══ GAMES ═══
function GameTimer({ timeLeft }) { return <div style={{ width: '100%', background: 'var(--border)', borderRadius: 20, height: 10, overflow: 'hidden' }}><div style={{ width: `${(timeLeft / 60) * 100}%`, height: '100%', background: timeLeft > 20 ? 'var(--success)' : timeLeft > 10 ? 'var(--orange)' : 'var(--danger)', borderRadius: 20, transition: 'width 1s linear' }} /></div> }
function MathGame({ userId, type, title, emoji, gen, onBack, earnXP }) {
  const [st, setSt] = useState('ready'); const [sc, setSc] = useState(0); const [tl, setTl] = useState(60); const [q, setQ] = useState(null); const [inp, setInp] = useState(''); const [rec, setRec] = useState(0); const [fb, setFb] = useState(null); const ir = useRef(null)
  useEffect(() => { (async () => { try { const { data } = await supabase.from('game_records').select('best_score').eq('user_id', userId).eq('game_type', type).single(); if (data) setRec(data.best_score) } catch {} })() }, [userId, type])
  const nq = useCallback(() => { setQ(gen()); setInp(''); setFb(null); setTimeout(() => ir.current?.focus(), 50) }, [gen])
  const start = () => { setSt('playing'); setSc(0); setTl(60); nq() }
  useEffect(() => { if (st !== 'playing' || tl <= 0) { if (st === 'playing' && tl <= 0) { setSt('done'); (async () => { try { const { data } = await supabase.from('game_records').select('best_score').eq('user_id', userId).eq('game_type', type).single(); if (data) { if (sc > data.best_score) await supabase.from('game_records').update({ best_score: sc }).eq('user_id', userId).eq('game_type', type) } else { await supabase.from('game_records').insert({ user_id: userId, game_type: type, best_score: sc }) }; if (sc > rec) setRec(sc); await earnXP(userId, 'game_played') } catch {} })() }; return }; const t = setTimeout(() => setTl(p => p - 1), 1000); return () => clearTimeout(t) }, [tl, st])
  const chk = () => { if (!inp || !q) return; if (parseInt(inp) === q.answer) { setSc(p => p + 1); setFb('ok'); setTimeout(() => nq(), 200) } else { setFb('no'); setTimeout(() => setFb(null), 400); setInp('') } }
  if (st === 'ready') return <div style={{ textAlign: 'center', padding: 40 }}><div style={{ fontSize: 50, marginBottom: 12 }}>{emoji}</div><h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>{title}</h2><p style={{ color: 'var(--text-sec)', fontSize: 14, marginBottom: 16 }}>60 secondes !</p>{rec > 0 && <p style={{ color: 'var(--orange)', fontWeight: 700, marginBottom: 16 }}>🏆 Record : {rec}</p>}<button className="btn btn-primary" onClick={start} style={{ padding: '14px 40px' }}>C&apos;est parti !</button><div style={{ marginTop: 12 }}><button className="btn btn-secondary btn-sm" onClick={onBack}>Retour</button></div></div>
  if (st === 'done') return <div style={{ textAlign: 'center', padding: 40 }}><div style={{ fontSize: 50, marginBottom: 12 }}>{sc > rec ? '🎉' : '⏱️'}</div><div style={{ fontSize: 42, fontWeight: 900, fontFamily: 'monospace', color: 'var(--accent)' }}>{sc}</div><p style={{ color: 'var(--text-sec)', marginBottom: 16 }}>bonnes réponses</p>{sc > rec && <p style={{ color: 'var(--success)', fontWeight: 700, marginBottom: 12 }}>Nouveau record !</p>}<div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}><button className="btn btn-primary" onClick={start}>Rejouer</button><button className="btn btn-secondary" onClick={onBack}>Retour</button></div></div>
  return <div><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}><span style={{ fontSize: 13, color: 'var(--text-sec)' }}>Score : <span style={{ color: 'var(--accent)', fontSize: 18, fontWeight: 800 }}>{sc}</span></span><span style={{ fontSize: 24, fontWeight: 900, fontFamily: 'monospace', color: tl <= 10 ? 'var(--danger)' : 'var(--text)' }}>{tl}s</span></div><GameTimer timeLeft={tl} /><div style={{ textAlign: 'center', padding: '36px 0' }}><div style={{ fontSize: 42, fontWeight: 900, fontFamily: 'monospace', marginBottom: 20 }}>{q?.display} = ?</div><div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}><input ref={ir} type="number" value={inp} onChange={e => setInp(e.target.value)} onKeyDown={e => e.key === 'Enter' && chk()} autoFocus style={{ width: 120, padding: 12, fontSize: 22, fontWeight: 800, textAlign: 'center', borderRadius: 12, border: `3px solid ${fb === 'ok' ? 'var(--success)' : fb === 'no' ? 'var(--danger)' : 'var(--border)'}`, outline: 'none', fontFamily: 'monospace' }} /><button className="btn btn-primary" onClick={chk} style={{ padding: '12px 20px' }}>OK</button></div></div></div>
}
function GamesPage({ userId, earnXP }) {
  const [active, setActive] = useState(null); const [records, setRecords] = useState({})
  useEffect(() => { (async () => { try { const { data } = await supabase.from('game_records').select('game_type, best_score').eq('user_id', userId); const m = {}; (data || []).forEach(r => m[r.game_type] = r.best_score); setRecords(m) } catch {} })() }, [userId, active])
  const multiGen = useCallback(() => { const a = 2 + Math.floor(Math.random() * 10), b = 2 + Math.floor(Math.random() * 10); return { display: `${a} × ${b}`, answer: a * b } }, [])
  const calcGen = useCallback(() => { const ops = ['+', '-', '×']; const op = ops[Math.floor(Math.random() * 3)]; let a = 10 + Math.floor(Math.random() * 40), b = 10 + Math.floor(Math.random() * 40); if (op === '×') { a = 2 + Math.floor(Math.random() * 12); b = 2 + Math.floor(Math.random() * 12) }; if (op === '-' && a < b) { [a, b] = [b, a] }; return { display: `${a} ${op} ${b}`, answer: op === '+' ? a + b : op === '-' ? a - b : a * b } }, [])
  if (active === 'multi') return <div className="card" style={{ padding: 0, overflow: 'hidden' }}><MathGame userId={userId} type="multiplication" title="Tables de multiplication" emoji="✖️" gen={multiGen} onBack={() => setActive(null)} earnXP={earnXP} /></div>
  if (active === 'calc') return <div className="card" style={{ padding: 0, overflow: 'hidden' }}><MathGame userId={userId} type="calcul_mental" title="Calcul mental" emoji="🧮" gen={calcGen} onBack={() => setActive(null)} earnXP={earnXP} /></div>
  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}><h1 className="page-title">Jeux</h1><p className="page-subtitle">Bats tes records !</p>
      {[{ id: 'multi', emoji: '✖️', title: 'Tables de multiplication', desc: '60s de multiplications', rec: records.multiplication }, { id: 'calc', emoji: '🧮', title: 'Calcul mental', desc: 'Additions, soustractions, multiplications', rec: records.calcul_mental }].map(g => (
        <div key={g.id} className="card" onClick={() => setActive(g.id)} style={{ padding: 22, cursor: 'pointer', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 50, height: 50, borderRadius: 14, background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{g.emoji}</div>
          <div style={{ flex: 1 }}><div style={{ fontWeight: 700 }}>{g.title}</div><div style={{ fontSize: 12, color: 'var(--text-sec)' }}>{g.desc}</div></div>
          {g.rec > 0 && <div style={{ padding: '4px 12px', borderRadius: 16, background: '#FEF3C7', color: '#92400E', fontSize: 12, fontWeight: 700 }}>🏆 {g.rec}</div>}
        </div>
      ))}
    </div>
  )
}

// ═══ PREP (Simulator) ═══
function PrepPage() {
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
    <div style={{ maxWidth: 600, margin: '0 auto' }}><h1 className="page-title">Préparation Brevet</h1><p className="page-subtitle">Simulateur de note officiel 2026</p>
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>① Contrôle continu (40%)</h3>
        <div style={{ marginBottom: 16 }}><label style={ls}>Moyenne générale /20</label><input type="number" step="0.1" min="0" max="20" placeholder="12.5" value={cc} onChange={e => setCc(e.target.value)} style={is} /></div>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>② Épreuves finales (60%)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[['Français (×2)', fr, setFr],['Maths (×2)', ma, setMa],['HG (×1.5)', hg, setHg],['EMC (×0.5)', em, setEm],['Sciences (×2)', sc, setSc],['Oral (×2)', or, setOr]].map(([l, v, s]) => <div key={l}><label style={ls}>{l}</label><input type="number" step="0.5" min="0" max="20" placeholder="/20" value={v} onChange={e => s(e.target.value)} style={is} /></div>)}
        </div>
        {result && <div style={{ marginTop: 20, textAlign: 'center', padding: 20, background: 'var(--bg)', borderRadius: 14, border: '1px solid var(--border)' }}>
          {result.partial && <p style={{ fontSize: 11, color: 'var(--text-sec)', marginBottom: 6 }}>⚠️ Estimation partielle</p>}
          <div style={{ fontSize: 42, fontWeight: 900, fontFamily: 'monospace', color: result.moyenne >= 10 ? 'var(--accent)' : 'var(--danger)' }}>{result.moyenne.toFixed(2)}</div>
          <div style={{ fontSize: 13, color: 'var(--text-sec)', marginBottom: 10 }}>/20</div>
          <div style={{ display: 'inline-block', padding: '6px 20px', borderRadius: 20, fontSize: 14, fontWeight: 800, color: 'white', background: result.moyenne >= 16 ? '#F59E0B' : result.moyenne >= 14 ? 'var(--accent)' : result.moyenne >= 10 ? 'var(--success)' : 'var(--danger)' }}>{result.mention}</div>
        </div>}
      </div>
    </div>
  )
}

// ═══ ASSIGNMENTS ═══
function AssignmentsPage({ userId, earnXP }) {
  const [assignments, setAssignments] = useState([]); const [submissions, setSubmissions] = useState([]); const [uploading, setUploading] = useState(null); const [loading, setLoading] = useState(true)
  useEffect(() => { (async () => { const { data: a } = await supabase.from('assignments').select('*').order('created_at', { ascending: false }); const { data: as } = await supabase.from('assignment_students').select('assignment_id').eq('user_id', userId); const { data: allAs } = await supabase.from('assignment_students').select('assignment_id'); const { data: s } = await supabase.from('submissions').select('*').eq('user_id', userId); const specific = [...new Set((allAs || []).map(x => x.assignment_id))]; const mine = (as || []).map(x => x.assignment_id); const visible = (a || []).filter(x => !specific.includes(x.id) || mine.includes(x.id)); setAssignments(visible); setSubmissions(s || []); setLoading(false) })() }, [userId])
  const getSub = aid => submissions.find(s => s.assignment_id === aid)
  const upload = async (aid, file) => { if (!file) return; setUploading(aid); try { const path = `${userId}/${aid}_${Date.now()}.${file.name.split('.').pop()}`; await supabase.storage.from('submissions').upload(path, file, { upsert: true }); const { data: u } = supabase.storage.from('submissions').getPublicUrl(path); await supabase.from('submissions').upsert({ assignment_id: aid, user_id: userId, image_url: u.publicUrl, submitted_at: new Date().toISOString(), corrected: false }); const { data: s } = await supabase.from('submissions').select('*').eq('user_id', userId); setSubmissions(s || []); await earnXP(userId, 'open_pdf') } catch (e) { alert('Erreur: ' + e.message) }; setUploading(null) }
  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-sec)' }}>Chargement...</div>
  return (
    <div><h1 className="page-title">Mes devoirs</h1><p className="page-subtitle">Prends en photo ta copie et envoie-la</p>
      {!assignments.length ? <div className="card" style={{ padding: 60, textAlign: 'center', color: 'var(--text-sec)' }}><div style={{ fontSize: 40, marginBottom: 12 }}>📝</div><p style={{ fontWeight: 600 }}>Aucun devoir</p></div> :
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{assignments.map(a => { const sub = getSub(a.id); const overdue = a.due_date && new Date(a.due_date) < new Date() && !sub; return (
          <div key={a.id} className="card" style={{ padding: 20, borderColor: overdue ? 'var(--danger)' : undefined }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
              {!sub && !overdue && <span className="badge" style={{ background: '#FEF3C7', color: '#92400E' }}>🔴 À rendre</span>}
              {overdue && <span className="badge badge-danger">⚠️ En retard</span>}
              {sub && !sub.corrected && <span className="badge" style={{ background: '#FEF3C7', color: '#92400E' }}>🟡 En attente</span>}
              {sub?.corrected && <span className="badge badge-success">🟢 Corrigé — {sub.score}/20</span>}
              {a.due_date && <span className="badge" style={{ background: 'var(--bg)', color: 'var(--text-sec)' }}>📅 {new Date(a.due_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</span>}
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{a.title}</h3>
            {a.description && <p style={{ fontSize: 13, color: 'var(--text-sec)', marginBottom: 8 }}>{a.description}</p>}
            {a.image_url && <a href={a.image_url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: 'var(--accent)', marginBottom: 8, display: 'inline-block' }}>📎 Voir l&apos;énoncé</a>}
            {!sub ? <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 12, background: 'var(--accent)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 8 }}>📷 {uploading === a.id ? 'Envoi...' : 'Envoyer ma copie'}<input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => upload(a.id, e.target.files[0])} disabled={uploading === a.id} /></label> :
              <div style={{ marginTop: 8 }}>{sub.corrected && <div><div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'monospace', color: sub.score >= 10 ? 'var(--success)' : 'var(--danger)' }}>{sub.score}/20</div>{sub.feedback && <p style={{ fontSize: 12, color: 'var(--text-sec)', marginTop: 4 }}>{sub.feedback}</p>}</div>}<a href={sub.image_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--accent)' }}>Voir ma copie</a></div>}
          </div>
        ) })}</div>}
    </div>
  )
}

// ═══ ADMIN PAGES ═══
function AdminDash({ students, sections, videos }) { return <div style={{ maxWidth: 700, margin: '0 auto' }}><h1 className="page-title">Dashboard</h1><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}><div className="stat-card"><div className="stat-label">Élèves</div><div className="stat-value" style={{ color: 'var(--accent)' }}>{students.filter(s => s.active).length}</div></div><div className="stat-card"><div className="stat-label">Chapitres</div><div className="stat-value" style={{ color: 'var(--success)' }}>{sections.reduce((a, s) => a + (s.chapters?.length || 0), 0)}</div></div><div className="stat-card"><div className="stat-label">Vidéos</div><div className="stat-value" style={{ color: 'var(--orange)' }}>{videos.length}</div></div></div></div> }

function AdminStudents({ students, reload, showToast }) {
  const [modal, setModal] = useState(false); const [f, setF] = useState({ first_name: '', last_name: '', username: '', password: '' })
  const add = async () => { if (!f.first_name || !f.username || !f.password) return; await supabase.from('users').insert({ ...f, role: 'student', active: true }); setModal(false); setF({ first_name: '', last_name: '', username: '', password: '' }); showToast('Ajouté !'); reload() }
  const del = async id => { await supabase.from('users').delete().eq('id', id); showToast('Supprimé'); reload() }
  const toggle = async (id, a) => { await supabase.from('users').update({ active: !a }).eq('id', id); reload() }
  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}><h1 className="page-title">Élèves</h1>
      <button className="btn btn-primary" onClick={() => setModal(true)} style={{ marginBottom: 16 }}>{IC.plus} Ajouter</button>
      <div className="card">{students.map(s => <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: 8 }}>
        <div><span style={{ fontWeight: 600 }}>{s.first_name} {s.last_name}</span><span style={{ marginLeft: 10, fontFamily: 'monospace', fontSize: 12, color: 'var(--text-sec)' }}>{s.username} / {s.password}</span></div>
        <div className="row gap-sm"><span className={`badge ${s.active ? 'badge-success' : 'badge-danger'}`} style={{ cursor: 'pointer' }} onClick={() => toggle(s.id, s.active)}>{s.active ? 'Actif' : 'Inactif'}</span><button onClick={() => del(s.id)} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-sec)' }}>{IC.trash}</button></div>
      </div>)}</div>
      {modal && <Modal title="Nouvel élève" onClose={() => setModal(false)}>{[['Prénom', 'first_name', 'Yasmine'], ['Nom', 'last_name', 'B.'], ['Identifiant', 'username', 'yasmine'], ['Mot de passe', 'password', 'brevet2026']].map(([l, k, ph]) => <div className="form-group" key={k}><label className="form-label">{l}</label><input className="form-input" value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })} placeholder={ph} /></div>)}<div className="modal-actions"><button className="btn btn-secondary btn-sm" onClick={() => setModal(false)}>Annuler</button><button className="btn btn-primary btn-sm" onClick={add}>Créer</button></div></Modal>}
    </div>
  )
}

function AdminContent({ sections, reload, showToast }) {
  const [secModal, setSecModal] = useState(false); const [chModal, setChModal] = useState(null); const [vidModal, setVidModal] = useState(null)
  const [secTitle, setSecTitle] = useState(''); const [secEmoji, setSecEmoji] = useState('📘')
  const [chTitle, setChTitle] = useState('')
  const [vidTitle, setVidTitle] = useState(''); const [vidUrl, setVidUrl] = useState(''); const [vidDur, setVidDur] = useState('')
  const addSec = async () => { if (!secTitle) return; const order = sections.length + 1; await supabase.from('sections').insert({ title: secTitle, emoji: secEmoji, sort_order: order }); setSecTitle(''); setSecEmoji('📘'); setSecModal(false); showToast('Section créée !'); reload() }
  const delSec = async id => { await supabase.from('sections').delete().eq('id', id); showToast('Supprimée'); reload() }
  const addCh = async secId => { if (!chTitle) return; const chs = sections.find(s => s.id === secId)?.chapters || []; await supabase.from('chapters').insert({ section_id: secId, title: chTitle, sort_order: chs.length + 1 }); setChTitle(''); setChModal(null); showToast('Chapitre créé !'); reload() }
  const delCh = async id => { await supabase.from('chapters').delete().eq('id', id); showToast('Supprimé'); reload() }
  const addVid = async chId => { if (!vidTitle) return; const ch = sections.flatMap(s => s.chapters || []).find(c => c.id === chId); const vids = ch?.videos || []; await supabase.from('videos').insert({ chapter_id: chId, title: vidTitle, video_url: vidUrl, duration_minutes: parseInt(vidDur) || 0, sort_order: vids.length + 1 }); setVidTitle(''); setVidUrl(''); setVidDur(''); setVidModal(null); showToast('Vidéo ajoutée !'); reload() }
  const delVid = async id => { await supabase.from('videos').delete().eq('id', id); showToast('Supprimée'); reload() }
  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}><h1 className="page-title">Contenu</h1><p className="page-subtitle">Sections, chapitres et vidéos</p>
      <button className="btn btn-primary" onClick={() => setSecModal(true)} style={{ marginBottom: 20 }}>{IC.plus} Nouvelle section</button>
      {sections.map(sec => (
        <div key={sec.id} style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 800 }}>{sec.emoji} {sec.title}</span>
            <div className="row gap-sm"><button className="btn btn-primary btn-sm" onClick={() => setChModal(sec.id)}>{IC.plus} Chapitre</button><button onClick={() => delSec(sec.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-sec)' }}>{IC.trash}</button></div>
          </div>
          {(sec.chapters || []).map(ch => (
            <div key={ch.id} className="card" style={{ marginBottom: 8 }}>
              <div className="card-header">
                <span style={{ fontWeight: 700, fontSize: 14 }}>{ch.title}</span>
                <div className="row gap-sm"><button className="btn btn-primary btn-sm" onClick={() => setVidModal(ch.id)}>{IC.plus} Vidéo</button><button onClick={() => delCh(ch.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-sec)' }}>{IC.trash}</button></div>
              </div>
              {(ch.videos || []).map((v, i) => <div key={v.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px', borderBottom: '1px solid var(--border)' }}>
                <div className="row gap-sm"><span style={{ width: 20, height: 20, borderRadius: 5, background: 'var(--accent-bg)', color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, fontFamily: 'monospace' }}>{i + 1}</span><span style={{ fontSize: 13 }}>{v.title}</span>{v.video_url && <span style={{ fontSize: 11, color: 'var(--success)' }}>🎥</span>}{v.duration_minutes > 0 && <span style={{ fontSize: 11, color: 'var(--text-sec)' }}>{v.duration_minutes}m</span>}</div>
                <button onClick={() => delVid(v.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-sec)' }}>{IC.trash}</button>
              </div>)}
              {(!ch.videos || !ch.videos.length) && <div style={{ padding: '12px 20px', fontSize: 13, color: 'var(--text-sec)', textAlign: 'center' }}>Aucune vidéo</div>}
            </div>
          ))}
        </div>
      ))}
      {secModal && <Modal title="Nouvelle section" onClose={() => setSecModal(false)}><div className="form-group"><label className="form-label">Nom</label><input className="form-input" value={secTitle} onChange={e => setSecTitle(e.target.value)} placeholder="Ex: Algèbre" autoFocus /></div><div className="form-group"><label className="form-label">Emoji</label><input className="form-input" value={secEmoji} onChange={e => setSecEmoji(e.target.value)} placeholder="📘" /></div><div className="modal-actions"><button className="btn btn-secondary btn-sm" onClick={() => setSecModal(false)}>Annuler</button><button className="btn btn-primary btn-sm" onClick={addSec}>Créer</button></div></Modal>}
      {chModal && <Modal title="Nouveau chapitre" onClose={() => setChModal(null)}><div className="form-group"><label className="form-label">Titre</label><input className="form-input" value={chTitle} onChange={e => setChTitle(e.target.value)} placeholder="Ex: Théorème de Pythagore" autoFocus /></div><div className="modal-actions"><button className="btn btn-secondary btn-sm" onClick={() => setChModal(null)}>Annuler</button><button className="btn btn-primary btn-sm" onClick={() => addCh(chModal)}>Créer</button></div></Modal>}
      {vidModal && <Modal title="Nouvelle vidéo" onClose={() => setVidModal(null)}><div className="form-group"><label className="form-label">Titre</label><input className="form-input" value={vidTitle} onChange={e => setVidTitle(e.target.value)} placeholder="Ex: Introduction" autoFocus /></div><div className="form-group"><label className="form-label">URL vidéo (YouTube, Loom ou MP4)</label><input className="form-input" value={vidUrl} onChange={e => setVidUrl(e.target.value)} placeholder="https://..." /></div><div className="form-group"><label className="form-label">Durée (minutes)</label><input className="form-input" type="number" value={vidDur} onChange={e => setVidDur(e.target.value)} placeholder="10" /></div><div className="modal-actions"><button className="btn btn-secondary btn-sm" onClick={() => setVidModal(null)}>Annuler</button><button className="btn btn-primary btn-sm" onClick={() => addVid(vidModal)}>Ajouter</button></div></Modal>}
    </div>
  )
}

function AdminProgress({ students, sections }) {
  const [data, setData] = useState({}); const [streaks, setStreaks] = useState({}); const [pdfs, setPdfs] = useState({}); const [xps, setXps] = useState({}); const [times, setTimes] = useState({})
  const totalCh = sections.reduce((a, s) => a + (s.chapters?.length || 0), 0)
  useEffect(() => { (async () => {
    const { data: cp } = await supabase.from('chapter_progress').select('user_id, chapter_id')
    const { data: st } = await supabase.from('student_streaks').select('*')
    const { data: pc } = await supabase.from('pdf_clicks').select('user_id')
    const { data: xp } = await supabase.from('student_xp').select('user_id, total_xp')
    const { data: tt } = await supabase.from('time_tracking').select('user_id, total_seconds, video_seconds')
    const g = {}; (cp || []).forEach(p => { if (!g[p.user_id]) g[p.user_id] = []; g[p.user_id].push(p.chapter_id) }); setData(g)
    const sm = {}; (st || []).forEach(s => sm[s.user_id] = s); setStreaks(sm)
    const pm = {}; (pc || []).forEach(c => pm[c.user_id] = (pm[c.user_id] || 0) + 1); setPdfs(pm)
    const xm = {}; (xp || []).forEach(x => xm[x.user_id] = x.total_xp); setXps(xm)
    const tm = {}; (tt || []).forEach(t => { if (!tm[t.user_id]) tm[t.user_id] = { total: 0, video: 0 }; tm[t.user_id].total += t.total_seconds; tm[t.user_id].video += t.video_seconds }); setTimes(tm)
  })() }, [])
  const fmtTime = s => { if (!s) return '0m'; const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); return h > 0 ? `${h}h${m}m` : `${m}m` }
  const fmtDate = d => { if (!d) return '—'; const diff = Math.floor((new Date() - new Date(d)) / 86400000); return diff === 0 ? "Aujourd'hui" : diff === 1 ? 'Hier' : diff < 7 ? `Il y a ${diff}j` : new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) }
  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}><h1 className="page-title">Progression</h1><p className="page-subtitle">Suivi des élèves — temps, vidéos, PDF</p>
      <div className="card" style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead><tr style={{ background: 'var(--bg)', borderBottom: '2px solid var(--border)' }}>
          {['Élève', 'Progression', 'Temps total', 'Temps vidéo', 'Dernière co.', 'Connexions', 'PDF', 'XP'].map(h => <th key={h} style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: 'var(--text-sec)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>)}
        </tr></thead>
        <tbody>{students.map(s => {
          const done = (data[s.id] || []).length; const pct = totalCh > 0 ? Math.round((done / totalCh) * 100) : 0
          const streak = streaks[s.id]; const inactive = streak?.last_login && Math.floor((new Date() - new Date(streak.last_login)) / 86400000) >= 3
          const t = times[s.id]
          return <tr key={s.id} style={{ borderBottom: '1px solid var(--border)', background: inactive ? '#FEF2F2' : 'white' }}>
            <td style={{ padding: '12px', textAlign: 'left' }}><div style={{ fontWeight: 600 }}>{s.first_name} {s.last_name}</div>{inactive && <div style={{ fontSize: 10, color: 'var(--danger)', fontWeight: 700 }}>⚠️ Inactif</div>}</td>
            <td style={{ padding: '12px', textAlign: 'center' }}><span style={{ fontWeight: 800, fontFamily: 'monospace', color: pct >= 75 ? 'var(--success)' : 'var(--accent)' }}>{pct}%</span></td>
            <td style={{ padding: '12px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 600 }}>{fmtTime(t?.total)}</td>
            <td style={{ padding: '12px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 600 }}>{fmtTime(t?.video)}</td>
            <td style={{ padding: '12px', textAlign: 'center', color: inactive ? 'var(--danger)' : 'var(--text)' }}>{fmtDate(streak?.last_login)}</td>
            <td style={{ padding: '12px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent)' }}>{streak?.total_logins || 0}</td>
            <td style={{ padding: '12px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 700 }}>{pdfs[s.id] || 0}</td>
            <td style={{ padding: '12px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 700, color: 'var(--video-text)' }}>{xps[s.id] || 0}</td>
          </tr>
        })}</tbody>
      </table></div>
    </div>
  )
}

function AdminAssignments({ students }) {
  const [assignments, setAssignments] = useState([]); const [submissions, setSubmissions] = useState([]); const [assignMap, setAssignMap] = useState({}); const [modal, setModal] = useState(false); const [corrModal, setCorrModal] = useState(null)
  const [title, setTitle] = useState(''); const [desc, setDesc] = useState(''); const [dueDate, setDueDate] = useState(''); const [imgFile, setImgFile] = useState(null); const [selStudents, setSelStudents] = useState([]); const [assignAll, setAssignAll] = useState(true)
  const [score, setScore] = useState(''); const [feedback, setFeedback] = useState(''); const [creating, setCreating] = useState(false)
  const load = async () => { const { data: a } = await supabase.from('assignments').select('*').order('created_at', { ascending: false }); const { data: s } = await supabase.from('submissions').select('*'); const { data: as } = await supabase.from('assignment_students').select('*'); setAssignments(a || []); setSubmissions(s || []); const m = {}; (as || []).forEach(x => { if (!m[x.assignment_id]) m[x.assignment_id] = []; m[x.assignment_id].push(x.user_id) }); setAssignMap(m) }
  useEffect(() => { load() }, [])
  const create = async () => { if (!title) return; setCreating(true); let iu = ''; if (imgFile) { const p = `enonces/${Date.now()}.${imgFile.name.split('.').pop()}`; const { error } = await supabase.storage.from('submissions').upload(p, imgFile); if (!error) { const { data } = supabase.storage.from('submissions').getPublicUrl(p); iu = data.publicUrl } }; const { data: na } = await supabase.from('assignments').insert({ title, description: desc, due_date: dueDate || null, image_url: iu }).select().single(); if (!assignAll && selStudents.length > 0 && na) await supabase.from('assignment_students').insert(selStudents.map(uid => ({ assignment_id: na.id, user_id: uid }))); setTitle(''); setDesc(''); setDueDate(''); setImgFile(null); setSelStudents([]); setAssignAll(true); setModal(false); setCreating(false); load() }
  const correct = async () => { if (!corrModal) return; await supabase.from('submissions').update({ score: parseFloat(score), feedback, corrected: true }).eq('id', corrModal.id); setCorrModal(null); setScore(''); setFeedback(''); load() }
  const getSt = uid => students.find(s => s.id === uid)
  const getTargeted = aid => { const sp = assignMap[aid]; if (!sp?.length) return students.filter(s => s.active); return students.filter(s => sp.includes(s.id)) }
  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}><h1 className="page-title">Devoirs</h1>
      <button className="btn btn-primary" onClick={() => setModal(true)} style={{ marginBottom: 20 }}>{IC.plus} Nouveau devoir</button>
      {assignments.map(a => { const targeted = getTargeted(a.id); const subs = submissions.filter(s => s.assignment_id === a.id); const notDone = targeted.filter(s => !subs.some(sub => sub.user_id === s.id)); return (
        <div key={a.id} className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><div><span style={{ fontWeight: 700 }}>{a.title}</span><br/><span style={{ fontSize: 12, color: 'var(--text-sec)' }}>{!assignMap[a.id]?.length ? '👥 Tous' : `👤 ${targeted.map(s => s.first_name).join(', ')}`}{a.due_date ? ` · 📅 ${new Date(a.due_date).toLocaleDateString('fr-FR')}` : ''}</span></div><div className="row gap-sm"><span className="badge" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>{subs.length}/{targeted.length}</span><button onClick={() => { supabase.from('assignments').delete().eq('id', a.id); load() }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-sec)' }}>{IC.trash}</button></div></div>
          {subs.map(sub => { const st = getSt(sub.user_id); return <div key={sub.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: 8 }}><div className="row gap-sm"><span className="badge badge-success" style={{ fontSize: 10, padding: '2px 6px' }}>✅</span><span style={{ fontWeight: 600, fontSize: 13 }}>{st ? `${st.first_name} ${st.last_name}` : 'Élève'}</span></div><div className="row gap-sm">{sub.corrected ? <span className="badge badge-success" style={{ fontWeight: 800 }}>{sub.score}/20</span> : <button className="btn btn-primary btn-sm" onClick={() => { setCorrModal(sub); setScore(''); setFeedback('') }}>Corriger</button>}<a href={sub.image_url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">📷</a></div></div> })}
          {notDone.map(st => { const overdue = a.due_date && new Date(a.due_date) < new Date(); return <div key={st.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid var(--border)', background: overdue ? '#FEF2F2' : undefined }}><div className="row gap-sm"><span className="badge" style={{ background: overdue ? 'var(--danger-bg)' : 'var(--bg)', color: overdue ? 'var(--danger)' : 'var(--text-sec)', fontSize: 10, padding: '2px 6px' }}>{overdue ? '⚠️' : '⏳'}</span><span style={{ fontSize: 13, color: overdue ? 'var(--danger)' : 'var(--text)' }}>{st.first_name} {st.last_name}</span></div><span style={{ fontSize: 12, color: overdue ? 'var(--danger)' : 'var(--text-sec)' }}>{overdue ? 'En retard' : 'Pas rendu'}</span></div> })}
        </div>
      ) })}
      {modal && <Modal title="Nouveau devoir" onClose={() => setModal(false)}>
        <div className="form-group"><label className="form-label">Titre *</label><input className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Devoir n°3" autoFocus /></div>
        <div className="form-group"><label className="form-label">Consigne</label><input className="form-input" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Ex: Exercices 1 à 4" /></div>
        <div className="form-group"><label className="form-label">Date limite</label><input className="form-input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Énoncé (image)</label><input type="file" accept="image/*" onChange={e => setImgFile(e.target.files[0])} style={{ fontSize: 13 }} /></div>
        <div className="form-group"><label className="form-label">Assigner à</label><div style={{ display: 'flex', gap: 8, marginBottom: 10 }}><button className={`btn btn-sm ${assignAll ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setAssignAll(true); setSelStudents([]) }}>Tous</button><button className={`btn btn-sm ${!assignAll ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setAssignAll(false)}>Choisir</button></div>
          {!assignAll && <div style={{ border: '1px solid var(--border)', borderRadius: 10, maxHeight: 200, overflowY: 'auto' }}>{students.filter(s => s.active).map(s => <div key={s.id} onClick={() => setSelStudents(p => p.includes(s.id) ? p.filter(i => i !== s.id) : [...p, s.id])} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)', background: selStudents.includes(s.id) ? 'var(--accent-bg)' : 'white' }}><div style={{ width: 18, height: 18, borderRadius: 4, border: selStudents.includes(s.id) ? 'none' : '2px solid var(--border)', background: selStudents.includes(s.id) ? 'var(--accent)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{selStudents.includes(s.id) && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}</div><span style={{ fontSize: 13 }}>{s.first_name} {s.last_name}</span></div>)}</div>}
        </div>
        <div className="modal-actions"><button className="btn btn-secondary btn-sm" onClick={() => setModal(false)}>Annuler</button><button className="btn btn-primary btn-sm" onClick={create} disabled={creating}>{creating ? 'Création...' : 'Créer'}</button></div>
      </Modal>}
      {corrModal && <Modal title="Corriger" onClose={() => setCorrModal(null)}><a href={corrModal.image_url} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', marginBottom: 16 }}>📷 Voir la copie</a><div className="form-group"><label className="form-label">Note /20</label><input className="form-input" type="number" step="0.5" min="0" max="20" value={score} onChange={e => setScore(e.target.value)} /></div><div className="form-group"><label className="form-label">Commentaire</label><input className="form-input" value={feedback} onChange={e => setFeedback(e.target.value)} /></div><div className="modal-actions"><button className="btn btn-secondary btn-sm" onClick={() => setCorrModal(null)}>Annuler</button><button className="btn btn-primary btn-sm" onClick={correct}>Valider</button></div></Modal>}
    </div>
  )
}

// ═══ MAIN APP ═══
export default function Home() {
  const [user, setUser] = useState(null); const [page, setPage] = useState('welcome'); const [toast, setToast] = useState(null); const [loading, setLoading] = useState(true); const [mobileOpen, setMobileOpen] = useState(false)
  const [students, setStudents] = useState([]); const [sections, setSections] = useState([]); const [videos, setVideos] = useState([]); const [settings, setSettings] = useState({}); const [completedVideos, setCompletedVideos] = useState([]); const [completedChapters, setCompletedChapters] = useState([]); const [streak, setStreak] = useState({}); const [xp, setXp] = useState(0); const [xpPopup, setXpPopup] = useState(null)
  const showToast = useCallback(m => { setToast(m); setTimeout(() => setToast(null), 2500) }, [])
  const totalChapters = useMemo(() => sections.reduce((a, s) => a + (s.chapters?.length || 0), 0), [sections])
  const totalVideos = useMemo(() => videos.length, [videos])

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
    setSections(secWithAll)
    const sm = {}; (setR.data || []).forEach(s => sm[s.key] = s.value); setSettings(sm)
    setLoading(false)
  }, [])

  const loadStudentData = useCallback(async userId => {
    const [vpR, cpR] = await Promise.all([supabase.from('video_progress').select('video_id').eq('user_id', userId).eq('completed', true), supabase.from('chapter_progress').select('chapter_id').eq('user_id', userId).eq('completed', true)])
    setCompletedVideos((vpR.data || []).map(r => r.video_id)); setCompletedChapters((cpR.data || []).map(r => r.chapter_id))
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
    const ping = async () => {
      const today = new Date().toISOString().split('T')[0]
      try { const { data } = await supabase.from('time_tracking').select('*').eq('user_id', user.id).eq('session_date', today).single()
        if (data) { await supabase.from('time_tracking').update({ total_seconds: data.total_seconds + 30, last_ping: new Date().toISOString() }).eq('id', data.id) }
        else { await supabase.from('time_tracking').insert({ user_id: user.id, session_date: today, total_seconds: 30 }) }
      } catch {}
    }
    const interval = setInterval(ping, 30000); ping()
    return () => clearInterval(interval)
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

  const toggleVideoComplete = async videoId => {
    if (!user) return
    if (completedVideos.includes(videoId)) { await supabase.from('video_progress').delete().eq('user_id', user.id).eq('video_id', videoId); setCompletedVideos(p => p.filter(id => id !== videoId)) }
    else { await supabase.from('video_progress').upsert({ user_id: user.id, video_id: videoId, completed: true }); setCompletedVideos(p => [...p, videoId]) }
  }

  const toggleChapterComplete = async chapterId => {
    if (!user) return
    if (completedChapters.includes(chapterId)) { await supabase.from('chapter_progress').delete().eq('user_id', user.id).eq('chapter_id', chapterId); setCompletedChapters(p => p.filter(id => id !== chapterId)) }
    else { await supabase.from('chapter_progress').upsert({ user_id: user.id, chapter_id: chapterId, completed: true }); setCompletedChapters(p => [...p, chapterId]); await earnXP(user.id, 'complete_chapter') }
  }

  const trackPdf = async (type, title) => { if (!user) return; try { await supabase.from('pdf_clicks').insert({ user_id: user.id, pdf_type: type, chapter_title: title }) } catch {}; await earnXP(user.id, 'open_pdf') }
  const logout = () => { setUser(null); setPage('welcome'); setCompletedVideos([]); setCompletedChapters([]); setStreak({}); setXp(0) }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-sec)' }}>Chargement...</div>
  if (!user) return <LoginPage onLogin={login} />
  const isAdmin = user.role === 'admin'
  const studentNav = [{ id: 'welcome', label: 'Accueil', icon: IC.home }, { id: 'chapters', label: 'Formation', icon: IC.book }, { id: 'prep', label: 'Prépa Brevet', icon: IC.target }, { id: 'assignments', label: 'Mes devoirs', icon: IC.edit }, { id: 'games', label: 'Jeux', icon: IC.game }]
  const adminNav = [{ id: 'admin-dash', label: 'Dashboard', icon: IC.dash }, { id: 'admin-students', label: 'Élèves', icon: IC.users }, { id: 'admin-content', label: 'Contenu', icon: IC.book }, { id: 'admin-progress', label: 'Progression', icon: IC.chart }, { id: 'admin-assignments', label: 'Devoirs', icon: IC.edit }]

  return (
    <div className="app-layout">
      <Sidebar items={isAdmin ? adminNav : studentNav} current={page} setCurrent={setPage} onLogout={logout} role={user.role} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="main-content">
        {!isAdmin && page === 'welcome' && <WelcomePage settings={settings} completedChapters={completedChapters.length} totalChapters={totalChapters} completedVideos={completedVideos.length} totalVideos={totalVideos} streak={streak} xp={xp} />}
        {!isAdmin && page === 'chapters' && <ChaptersPage sections={sections} completedVideos={completedVideos} completedChapters={completedChapters} toggleVideoComplete={toggleVideoComplete} toggleChapterComplete={toggleChapterComplete} trackPdf={trackPdf} earnXP={earnXP} userId={user.id} />}
        {!isAdmin && page === 'prep' && <PrepPage />}
        {!isAdmin && page === 'assignments' && <AssignmentsPage userId={user.id} earnXP={earnXP} />}
        {!isAdmin && page === 'games' && <GamesPage userId={user.id} earnXP={earnXP} />}
        {isAdmin && page === 'admin-dash' && <AdminDash students={students} sections={sections} videos={videos} />}
        {isAdmin && page === 'admin-students' && <AdminStudents students={students} reload={loadData} showToast={showToast} />}
        {isAdmin && page === 'admin-content' && <AdminContent sections={sections} reload={loadData} showToast={showToast} />}
        {isAdmin && page === 'admin-progress' && <AdminProgress students={students} sections={sections} />}
        {isAdmin && page === 'admin-assignments' && <AdminAssignments students={students} />}
      </div>
      {toast && <Toast message={toast} />}
      {xpPopup && <div style={{ position: 'fixed', top: 80, right: 24, background: 'linear-gradient(135deg, #312E81, #1E1B4B)', color: '#A5B4FC', padding: '12px 20px', borderRadius: 14, fontSize: 14, fontWeight: 800, zIndex: 300, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 30px rgba(0,0,0,0.3)', animation: 'toastIn 0.3s ease' }}>⚡ +{xpPopup.xp} XP — {xpPopup.label}</div>}
    </div>
  )
}
