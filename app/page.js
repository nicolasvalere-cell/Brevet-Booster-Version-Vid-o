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
const FUN_FACTS = ["Al-Khwarizmi, un savant musulman du 9e siècle, est le père de l'algèbre.","Le nombre π a été calculé à plus de 100 000 milliards de décimales !","Un googol, c'est 10 puissance 100. C'est de là que vient le nom Google !","111 111 111 × 111 111 111 = 12 345 678 987 654 321.","Le zéro a été inventé en Inde au 7e siècle.","Le nombre d'or (1,618) se retrouve dans la nature.","La somme des angles d'un triangle fait toujours 180°."]

const IC = {
  home: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  play: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  check: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>,
  close: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  logout: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  chevD: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>,
  chevR: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>,
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
  up: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>,
  down: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>,
  book: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  target: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
}

function ProgressBar({ value, max, height = 8 }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return <div style={{ background: 'var(--border)', borderRadius: 20, height, overflow: 'hidden', width: '100%' }}><div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--blue), var(--blue-dark))', borderRadius: 20, transition: 'width 0.5s' }} /></div>
}
function Modal({ title, children, onClose }) { return <div className="modal-overlay" onClick={onClose}><div className="modal" onClick={e => e.stopPropagation()}><div className="modal-header"><h2 className="modal-title">{title}</h2><div onClick={onClose} style={{ cursor: 'pointer', color: 'var(--text-sec)' }}>{IC.close}</div></div>{children}</div></div> }
function Toast({ message }) { return <div className="toast">{IC.check} {message}</div> }
function getVideoEmbed(url) {
  if (!url) return null
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
  if (yt) return { type: 'youtube', id: yt[1] }
  if (url.includes('loom.com')) { const m = url.match(/loom\.com\/(?:share|embed)\/([a-f0-9]+)/); if (m) return { type: 'loom', id: m[1] } }
  if (url.includes('mediadelivery.net')) return { type: 'bunny', url: url.replace('/play/', '/embed/') }
  if (url.match(/\.(mp4|webm|mov)(\?|$)/i)) return { type: 'mp4', url }
  return { type: 'iframe', url }
}

// ═══ LOGIN ═══
function LoginPage({ onLogin }) {
  const [u, setU] = useState(''); const [p, setP] = useState(''); const [err, setErr] = useState(''); const [ld, setLd] = useState(false)
  const go = async (e) => { e.preventDefault(); setErr(''); setLd(true); await onLogin(u.trim(), p.trim(), setErr); setLd(false) }
  return <div className="login-page"><div className="login-card">
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}><div className="sidebar-logo">B</div><span style={{ fontSize: 24, fontWeight: 800 }}>Brevet <span style={{ color: 'var(--blue)' }}>Booster</span></span></div>
    <p style={{ color: 'var(--text-sec)', fontSize: 15, marginBottom: 32 }}>Connecte-toi pour accéder à ta formation</p>
    {err && <div style={{ background: 'var(--red-bg)', color: 'var(--red)', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 16 }}>{err}</div>}
    <form onSubmit={go}>
      <div className="form-group"><label className="form-label">Identifiant</label><input className="form-input" value={u} onChange={e => setU(e.target.value)} placeholder="Ton identifiant" /></div>
      <div className="form-group"><label className="form-label">Mot de passe</label><input className="form-input" type="password" value={p} onChange={e => setP(e.target.value)} placeholder="Ton mot de passe" /></div>
      <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: 14, fontSize: 15, borderRadius: 12 }} disabled={ld}>{ld ? 'Connexion...' : 'Se connecter'}</button>
    </form>
  </div></div>
}

// ═══ SIDEBAR WITH TREE ═══
function CourseSidebar({ sections, completedVideos, completedChapters, currentPage, setPage, selectedVideo, onSelectVideo, onLogout, mobileOpen, setMobileOpen, myProf }) {
  const [openSections, setOpenSections] = useState(new Set())
  const [openChapters, setOpenChapters] = useState(new Set())
  const toggleSec = id => setOpenSections(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleCh = id => setOpenChapters(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  return (
    <>
      <div className="mobile-topbar"><div onClick={() => setMobileOpen(true)} style={{ cursor: 'pointer', padding: 4 }}>{IC.menu}</div><span style={{ fontSize: 16, fontWeight: 800 }}>Brevet <span style={{ color: 'var(--blue)' }}>Booster</span></span><div style={{ width: 26 }} /></div>
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}
      <div className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand"><div className="sidebar-logo">B</div><span className="sidebar-title">Brevet <span>Booster</span></span><div className="sidebar-close" onClick={() => setMobileOpen(false)} style={{ marginLeft: 'auto', cursor: 'pointer', color: 'var(--text-sec)' }}>{IC.close}</div></div>
        {/* Accueil */}
        <div style={{ padding: '4px 0' }}>
          <div className={`sidebar-nav-item ${currentPage === 'welcome' ? 'active' : ''}`} onClick={() => { setPage('welcome'); setMobileOpen(false) }}>{IC.home} <span>Accueil</span></div>
        </div>
        {/* Chapitres tree */}
        <div className="sidebar-section-label">Chapitres</div>
        <div className="sidebar-tree">
          {sections.map(sec => {
            const isOpen = openSections.has(sec.id)
            const chs = sec.chapters || []
            const doneCh = chs.filter(c => completedChapters.includes(c.id)).length
            return (
              <div key={sec.id}>
                <div className="sidebar-tree-section" onClick={() => toggleSec(sec.id)}>
                  <span style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(0)' : 'rotate(-90deg)', display: 'flex' }}>{IC.chevD}</span>
                  <span style={{ flex: 1 }}>{sec.title}</span>
                  <span style={{ fontSize: 11, color: doneCh === chs.length && chs.length > 0 ? 'var(--green)' : 'var(--text-light)' }}>{doneCh}/{chs.length}</span>
                </div>
                {isOpen && chs.map(ch => {
                  const chOpen = openChapters.has(ch.id)
                  const vids = ch.videos || []
                  const chDone = completedChapters.includes(ch.id)
                  return (
                    <div key={ch.id}>
                      <div className="sidebar-tree-chapter" onClick={() => toggleCh(ch.id)}>
                        <span style={{ transition: 'transform 0.2s', transform: chOpen ? 'rotate(0)' : 'rotate(-90deg)', display: 'flex', color: 'var(--text-light)' }}>{IC.chevD}</span>
                        {chDone ? <span style={{ color: 'var(--green)' }}>{IC.check}</span> : <div style={{ width: 8, height: 8, borderRadius: '50%', border: '1.5px solid var(--border)', flexShrink: 0 }} />}
                        <span style={{ flex: 1, color: chDone ? 'var(--green)' : 'var(--text)' }}>{ch.title}</span>
                      </div>
                      {chOpen && vids.map(v => {
                        const vDone = completedVideos.includes(v.id)
                        const active = selectedVideo?.id === v.id
                        return <div key={v.id} className={`sidebar-tree-video ${active ? 'active' : ''} ${vDone && !active ? 'done' : ''}`} onClick={() => { onSelectVideo(v, ch); setMobileOpen(false) }}>
                          {vDone && !active ? IC.check : active ? IC.play : <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--border)', flexShrink: 0 }} />}
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title}</span>
                          {v.duration_minutes > 0 && <span style={{ fontSize: 11, color: 'var(--text-light)', flexShrink: 0 }}>{v.duration_minutes}m</span>}
                        </div>
                      })}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
        {/* Other nav */}
        <div style={{ borderTop: '1px solid var(--border)', padding: '4px 0' }}>
          <div className={`sidebar-nav-item ${currentPage === 'progress' ? 'active' : ''}`} onClick={() => { setPage('progress'); setMobileOpen(false) }}>{IC.chart} <span>Progrès</span></div>
          <div className={`sidebar-nav-item ${currentPage === 'games' ? 'active' : ''}`} onClick={() => { setPage('games'); setMobileOpen(false) }}>{IC.game} <span>Entraînement</span></div>
        </div>
        {/* Contact prof */}
        {myProf && <div className="sidebar-prof">
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Ton professeur</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--green-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--green)' }}>{myProf.first_name.charAt(0)}</div>
            <div><div style={{ fontSize: 13, fontWeight: 600 }}>{myProf.first_name} {myProf.last_name}</div>
            {myProf.whatsapp_url ? <a href={myProf.whatsapp_url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--green)', textDecoration: 'none' }}>Contacter</a> : myProf.phone && <span style={{ fontSize: 11, color: 'var(--text-sec)' }}>{myProf.phone}</span>}</div>
          </div>
        </div>}
        <div className="sidebar-bottom"><button className="sidebar-logout" onClick={onLogout}>{IC.logout}<span>Déconnexion</span></button></div>
      </div>
    </>
  )
}

// ═══ WELCOME ═══
function WelcomePage({ completedChapters, totalChapters, completedVideos, totalVideos, streak, xp, sections, onContinue, userName, totalTime }) {
  const pct = totalChapters > 0 ? Math.round((completedChapters.length / totalChapters) * 100) : 0
  const badge = getBadge(completedChapters.length)
  const level = getLevel(xp); const nextLevel = getNextLevel(xp)
  const xpIn = nextLevel ? xp - level.min : 0; const xpFor = nextLevel ? nextLevel.min - level.min : 1
  const diff = BREVET_DATE - new Date(); const daysLeft = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
  const fmtTime = s => { if (!s) return '0h'; const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); return h > 0 ? `${h}h${m > 0 ? m : ''}` : `${m}m` }
  const pctStroke = 314 - (314 * pct / 100)
  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <div className="welcome-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div><h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.3 }}>Salut {userName || 'champion'} 👋</h1><p style={{ fontSize: 15, color: 'var(--text-sec)' }}>Brevet dans <span style={{ fontWeight: 700, color: 'var(--blue)' }}>{daysLeft} jours</span></p></div>
        <div className="welcome-xp-badge" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #1E1B4B, #312E81)', padding: '10px 16px', borderRadius: 12, color: 'white' }}>
          <span style={{ fontSize: 18 }}>{level.emoji}</span><div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Niveau {level.level}</div><div style={{ fontSize: 14, fontWeight: 700 }}>{level.name} <span style={{ fontFamily: 'monospace', color: '#A5B4FC' }}>{xp} XP</span></div></div>
        </div>
      </div>
      {nextLevel && <div style={{ marginBottom: 24 }}><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-light)', marginBottom: 4 }}><span>{level.emoji} {level.name}</span><span>{nextLevel.emoji} {nextLevel.name} — {nextLevel.min} XP</span></div><div style={{ background: 'var(--border)', borderRadius: 20, height: 5, overflow: 'hidden' }}><div style={{ width: Math.min(100, (xpIn / xpFor) * 100) + '%', height: '100%', background: 'linear-gradient(90deg, var(--blue), var(--blue-dark))', borderRadius: 20 }} /></div></div>}
      {pct === 0 && <div style={{ background: 'var(--green-bg)', border: '1px solid var(--green-light)', borderRadius: 14, padding: '16px 20px', marginBottom: 20 }}><div style={{ fontSize: 16, fontWeight: 700, color: '#065F46', marginBottom: 4 }}>🎯 Par où commencer ?</div><div style={{ fontSize: 14, color: '#047857', lineHeight: 1.7 }}>1. Clique sur <b>Continuer la formation</b><br/>2. Ouvre le premier chapitre dans le menu<br/>3. Regarde les vidéos et coche-les</div></div>}
      {/* Circle + stats */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '28px 24px', marginBottom: 16, textAlign: 'center' }}>
        <svg width="130" height="130" viewBox="0 0 130 130" style={{ marginBottom: 12 }}>
          <circle cx="65" cy="65" r="50" fill="none" stroke="var(--border)" strokeWidth="8"/>
          <circle cx="65" cy="65" r="50" fill="none" stroke="var(--blue)" strokeWidth="8" strokeDasharray="314" strokeDashoffset={pctStroke} strokeLinecap="round" transform="rotate(-90 65 65)" style={{ transition: 'stroke-dashoffset 1s ease' }}/>
          <text x="65" y="60" textAnchor="middle" fontSize="30" fontWeight="800" fontFamily="monospace" fill="var(--text)">{pct}%</text>
          <text x="65" y="78" textAnchor="middle" fontSize="12" fill="var(--text-sec)">progression</text>
        </svg>
        {pct > 0 && pct < 100 && <p style={{ fontSize: 14, color: 'var(--text-sec)' }}>Continue comme ça, tu avances bien !</p>}
        {pct === 100 && <p style={{ fontSize: 14, color: 'var(--green)', fontWeight: 700 }}>🏆 Formation terminée, bravo !</p>}
      </div>
      <div className="welcome-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        {[['var(--blue)', completedChapters.length, 'chapitres'], ['var(--gold)', (streak.current_streak || 0) + 'j', 'streak'], ['var(--text)', fmtTime(totalTime), 'temps passé'], ['#7C3AED', completedVideos, 'vidéos vues']].map(([color, val, label], i) => (
          <div key={i} className="card" style={{ padding: '16px 10px', textAlign: 'center' }}><div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'monospace', color, lineHeight: 1 }}>{val}</div><div style={{ fontSize: 12, color: 'var(--text-sec)', marginTop: 6 }}>{label}</div></div>
        ))}
      </div>
      <button onClick={onContinue} className="btn btn-primary" style={{ width: '100%', padding: 16, fontSize: 16, borderRadius: 14, marginBottom: 16 }}>Continuer la formation →</button>
      <div className="card" style={{ padding: '14px 20px' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}><span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-sec)' }}>Badges</span><span style={{ fontSize: 12, color: 'var(--blue)', fontWeight: 600 }}>Plus tu avances, plus tu montes en grade</span></div><div style={{ display: 'flex', justifyContent: 'space-around' }}>{[...BADGES].reverse().map(b => <div key={b.id} style={{ textAlign: 'center', opacity: completedChapters.length >= b.min ? 1 : 0.3 }}><div style={{ fontSize: 24 }}>{b.emoji}</div><div style={{ fontSize: 10, fontWeight: 700, color: completedChapters.length >= b.min ? b.color : 'var(--text-sec)' }}>{b.name}</div></div>)}</div></div>
    </div>
  )
}

// ═══ VIDEO PLAYER ═══
function VideoPlayer({ video, chapter, isDone, onToggle, onNext, onPrev, hasNext, hasPrev, allVids, completedVideos, onSelectVideo, onOpenPdf }) {
  const embed = getVideoEmbed(video.video_url)
  const idx = allVids.findIndex(v => v.id === video.id)
  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ fontSize: 13, color: 'var(--text-sec)', marginBottom: 8 }}>{chapter?.title} › <span style={{ color: 'var(--text)', fontWeight: 600 }}>{video.title}</span></div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4, letterSpacing: -0.3 }}>{video.title}</h1>
      <p style={{ fontSize: 14, color: 'var(--text-sec)', marginBottom: 16 }}>Vidéo {idx + 1}/{allVids.length}{video.duration_minutes > 0 ? ` · ${video.duration_minutes} min` : ''}</p>
      {embed?.type === 'youtube' ? <div style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 16, position: 'relative', paddingBottom: '56.25%', background: '#000' }}><iframe src={`https://www.youtube.com/embed/${embed.id}?rel=0&modestbranding=1`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} allowFullScreen /></div>
      : (embed?.type === 'bunny' || embed?.type === 'iframe' || embed?.type === 'loom') ? <div style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 16, position: 'relative', paddingBottom: '56.25%', background: '#000' }}><iframe src={embed.type === 'loom' ? `https://www.loom.com/embed/${embed.id}` : embed.url} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture" allowFullScreen /></div>
      : embed?.type === 'mp4' ? <div style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 16, background: '#000' }}><video controls style={{ width: '100%', display: 'block' }} src={embed.url} /></div>
      : <div style={{ borderRadius: 14, background: 'var(--bg)', border: '1px solid var(--border)', padding: 60, textAlign: 'center', marginBottom: 16 }}><div style={{ fontSize: 40, marginBottom: 8 }}>🎥</div><p style={{ color: 'var(--text-sec)' }}>Vidéo bientôt disponible</p></div>}
      <div className="video-nav" style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button onClick={onPrev} disabled={!hasPrev} className="btn btn-secondary" style={{ flex: 1, opacity: hasPrev ? 1 : 0.4 }}>{IC.arrowL} Préc.</button>
        <button onClick={onToggle} className={`btn ${isDone ? 'btn-secondary' : 'btn-primary'}`} style={{ flex: 2 }}>{isDone ? '✅ Vue' : 'Marquer comme vue'}</button>
        <button onClick={onNext} disabled={!hasNext} className="btn btn-secondary" style={{ flex: 1, opacity: hasNext ? 1 : 0.4 }}>Suiv. {IC.arrowR}</button>
      </div>
      {/* Playlist */}
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-sec)', marginBottom: 8 }}>Vidéos du chapitre</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>{allVids.map((v, vi) => {
        const active = v.id === video.id; const done = completedVideos.includes(v.id)
        return <div key={v.id} onClick={() => onSelectVideo(v, chapter)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderRadius: 10, background: active ? 'var(--blue-bg)' : done ? 'var(--green-bg)' : 'var(--bg)', border: active ? '1.5px solid var(--blue-light)' : '1px solid transparent', cursor: 'pointer', transition: 'all 0.15s' }}>
          {done && !active ? <div style={{ width: 24, height: 24, borderRadius: 7, background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></div> : <div style={{ width: 24, height: 24, borderRadius: 7, background: active ? 'var(--blue)' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: active ? 'white' : 'var(--text-sec)', fontSize: 11, fontWeight: 700, fontFamily: 'monospace' }}>{active ? '▶' : vi + 1}</div>}
          <span style={{ flex: 1, fontSize: 14, fontWeight: active ? 700 : 500, color: active ? 'var(--blue)' : done ? 'var(--green)' : 'var(--text)' }}>{v.title}</span>
          {v.duration_minutes > 0 && <span style={{ padding: '2px 8px', borderRadius: 12, background: active ? 'rgba(37,99,235,0.12)' : 'var(--border)', fontSize: 11, fontWeight: 600, color: active ? 'var(--blue)' : 'var(--text-sec)' }}>{v.duration_minutes}m</span>}
        </div>
      })}</div>
      {/* PDFs */}
      {chapter && (chapter.pdf_url || chapter.exercises_pdf_url || chapter.eval_pdf_url) && <div><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-sec)', marginBottom: 8 }}>Ressources</div><div className="chapter-pdf-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {chapter.pdf_url && <button onClick={() => onOpenPdf(chapter.pdf_url, chapter.title, 'cours')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10, borderRadius: 10, border: '1.5px solid var(--blue-light)', background: 'var(--blue-bg)', color: 'var(--blue)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>📘 Cours</button>}
        {chapter.exercises_pdf_url && <button onClick={() => onOpenPdf(chapter.exercises_pdf_url, chapter.title, 'exercices')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10, borderRadius: 10, border: '1.5px solid var(--red-light)', background: 'var(--red-bg)', color: 'var(--red)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>✏️ Exercices</button>}
        {chapter.eval_pdf_url && <button onClick={() => onOpenPdf(chapter.eval_pdf_url, chapter.title, 'auto-eval')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10, borderRadius: 10, border: '1.5px solid var(--gold-light)', background: 'var(--gold-bg)', color: '#92400E', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>📝 Auto-éval</button>}
      </div></div>}
    </div>
  )
}

// ═══ PDF VIEWER ═══
function PdfViewer({ url, title, onBack }) {
  return <div><div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}><button onClick={onBack} className="btn btn-secondary btn-sm">{IC.arrowL} Retour</button><div style={{ fontSize: 16, fontWeight: 700 }}>{title}</div><a href={url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }}>↗ Nouvel onglet</a></div><div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)', background: '#525659' }}><iframe src={`${url}#toolbar=1`} style={{ width: '100%', height: 'calc(100vh - 180px)', minHeight: 400, border: 'none' }} /></div></div>
}

// ═══ PROGRESS ═══
function ProgressPage({ sections, completedChapters, completedVideos, xp }) {
  const level = getLevel(xp)
  const totalCh = sections.reduce((a, s) => a + (s.chapters || []).length, 0)
  const totalVids = sections.flatMap(s => (s.chapters || []).flatMap(c => c.videos || [])).length
  return (
    <div><h1 className="page-title">Mes progrès</h1><p className="page-subtitle">Ton avancement dans la formation</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        <div className="card" style={{ padding: 20, textAlign: 'center' }}><div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'monospace', color: 'var(--blue)' }}>{totalCh > 0 ? Math.round((completedChapters.length / totalCh) * 100) : 0}%</div><div style={{ fontSize: 13, color: 'var(--text-sec)', marginTop: 4 }}>chapitres</div></div>
        <div className="card" style={{ padding: 20, textAlign: 'center' }}><div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'monospace', color: '#7C3AED' }}>{totalVids > 0 ? Math.round((completedVideos.length / totalVids) * 100) : 0}%</div><div style={{ fontSize: 13, color: 'var(--text-sec)', marginTop: 4 }}>vidéos</div></div>
        <div className="card" style={{ padding: 20, textAlign: 'center' }}><div style={{ fontSize: 28 }}>{level.emoji}</div><div style={{ fontSize: 15, fontWeight: 700, color: 'var(--blue)', marginTop: 4 }}>{level.name}</div><div style={{ fontSize: 12, color: 'var(--text-sec)' }}>{xp} XP</div></div>
      </div>
      <div className="card"><div className="card-header">Progression par section</div>{sections.map(sec => { const chs = sec.chapters || []; const done = chs.filter(c => completedChapters.includes(c.id)).length; const p = chs.length > 0 ? Math.round((done / chs.length) * 100) : 0; return <div key={sec.id} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span style={{ fontSize: 15, fontWeight: 600 }}>{sec.emoji} {sec.title}</span><span style={{ fontSize: 14, fontWeight: 800, fontFamily: 'monospace', color: p === 100 ? 'var(--green)' : 'var(--blue)' }}>{p}%</span></div><ProgressBar value={done} max={chs.length} height={6} /><div style={{ fontSize: 12, color: 'var(--text-sec)', marginTop: 4 }}>{done}/{chs.length} chapitres</div></div> })}</div>
    </div>
  )
}

// ═══ GAMES ═══
function GameTimer({ tl }) { return <div style={{ width: '100%', background: 'var(--border)', borderRadius: 20, height: 10, overflow: 'hidden' }}><div style={{ width: `${(tl / 60) * 100}%`, height: '100%', background: tl > 20 ? 'var(--green)' : tl > 10 ? 'var(--gold)' : 'var(--red)', borderRadius: 20, transition: 'width 1s linear' }} /></div> }
function MathGame({ userId, type, title, emoji, gen, onBack, earnXP }) {
  const [st, setSt] = useState('ready'); const [sc, setSc] = useState(0); const [tl, setTl] = useState(60); const [q, setQ] = useState(null); const [inp, setInp] = useState(''); const [rec, setRec] = useState(0); const [fb, setFb] = useState(null); const ir = useRef(null)
  useEffect(() => { (async () => { try { const { data } = await supabase.from('game_records').select('best_score').eq('user_id', userId).eq('game_type', type).single(); if (data) setRec(data.best_score) } catch {} })() }, [userId, type])
  const nq = useCallback(() => { setQ(gen()); setInp(''); setFb(null); setTimeout(() => ir.current?.focus(), 50) }, [gen])
  const start = () => { setSt('playing'); setSc(0); setTl(60); nq() }
  useEffect(() => { if (st !== 'playing' || tl <= 0) { if (st === 'playing' && tl <= 0) { setSt('done'); (async () => { try { const { data } = await supabase.from('game_records').select('best_score').eq('user_id', userId).eq('game_type', type).single(); if (data) { if (sc > data.best_score) await supabase.from('game_records').update({ best_score: sc }).eq('user_id', userId).eq('game_type', type) } else { await supabase.from('game_records').insert({ user_id: userId, game_type: type, best_score: sc }) }; if (sc > rec) setRec(sc); await earnXP(userId, 'game_played') } catch {} })() }; return }; const t = setTimeout(() => setTl(p => p - 1), 1000); return () => clearTimeout(t) }, [tl, st])
  const chk = () => { if (!inp || !q) return; if (parseInt(inp) === q.answer) { setSc(p => p + 1); setFb('ok'); setTimeout(() => nq(), 200) } else { setFb('no'); setTimeout(() => setFb(null), 400); setInp('') } }
  if (st === 'ready') return <div style={{ textAlign: 'center', padding: '60px 20px' }}><div style={{ fontSize: 56, marginBottom: 16 }}>{emoji}</div><h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{title}</h2><p style={{ color: 'var(--text-sec)', fontSize: 15, marginBottom: 24 }}>60 secondes pour un max de bonnes réponses !</p>{rec > 0 && <div style={{ display: 'inline-block', padding: '8px 20px', borderRadius: 12, background: 'var(--gold-bg)', color: '#92400E', fontWeight: 700, marginBottom: 20 }}>🏆 Record : {rec}</div>}<br/><button className="btn btn-primary" onClick={start} style={{ padding: '16px 50px', fontSize: 16, borderRadius: 14 }}>C&apos;est parti !</button><div style={{ marginTop: 16 }}><button className="btn btn-secondary" onClick={onBack}>← Retour</button></div></div>
  if (st === 'done') return <div style={{ textAlign: 'center', padding: '60px 20px' }}><div style={{ fontSize: 56, marginBottom: 16 }}>{sc >= rec && rec > 0 ? '🎉' : '⏱️'}</div><div style={{ fontSize: 48, fontWeight: 800, fontFamily: 'monospace', color: 'var(--blue)' }}>{sc}</div><p style={{ color: 'var(--text-sec)', fontSize: 16, marginBottom: 16 }}>bonnes réponses</p>{sc > rec && <div style={{ padding: '8px 20px', borderRadius: 12, background: 'var(--green-bg)', color: 'var(--green)', fontWeight: 700, display: 'inline-block', marginBottom: 16 }}>Nouveau record !</div>}<div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}><button className="btn btn-primary" onClick={start}>Rejouer</button><button className="btn btn-secondary" onClick={onBack}>Retour</button></div></div>
  return <div style={{ maxWidth: 500, margin: '0 auto' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}><span style={{ fontSize: 14, color: 'var(--text-sec)' }}>Score : <span style={{ color: 'var(--blue)', fontSize: 20, fontWeight: 800 }}>{sc}</span></span><span style={{ fontSize: 28, fontWeight: 800, fontFamily: 'monospace', color: tl <= 10 ? 'var(--red)' : 'var(--text)' }}>{tl}s</span></div><GameTimer tl={tl} /><div style={{ textAlign: 'center', padding: '48px 0' }}><div style={{ fontSize: 48, fontWeight: 800, fontFamily: 'monospace', marginBottom: 24 }}>{q?.display} = ?</div><div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}><input ref={ir} type="number" value={inp} onChange={e => setInp(e.target.value)} onKeyDown={e => e.key === 'Enter' && chk()} autoFocus style={{ width: 130, padding: 14, fontSize: 24, fontWeight: 800, textAlign: 'center', borderRadius: 14, border: `3px solid ${fb === 'ok' ? 'var(--green)' : fb === 'no' ? 'var(--red)' : 'var(--border)'}`, background: fb === 'ok' ? 'var(--green-bg)' : fb === 'no' ? 'var(--red-bg)' : 'white', outline: 'none', fontFamily: 'monospace' }} /><button className="btn btn-primary" onClick={chk} style={{ padding: '14px 24px', fontSize: 16 }}>OK</button></div></div></div>
}
function GamesPage({ userId, earnXP }) {
  const [active, setActive] = useState(null); const [records, setRecords] = useState({})
  useEffect(() => { (async () => { try { const { data } = await supabase.from('game_records').select('game_type, best_score').eq('user_id', userId); const m = {}; (data || []).forEach(r => m[r.game_type] = r.best_score); setRecords(m) } catch {} })() }, [userId, active])
  const multiGen = useCallback(() => { const a = 2 + Math.floor(Math.random() * 10), b = 2 + Math.floor(Math.random() * 10); return { display: `${a} × ${b}`, answer: a * b } }, [])
  const calcGen = useCallback(() => { const ops = ['+', '-', '×']; const op = ops[Math.floor(Math.random() * 3)]; let a = 10 + Math.floor(Math.random() * 40), b = 10 + Math.floor(Math.random() * 40); if (op === '×') { a = 2 + Math.floor(Math.random() * 12); b = 2 + Math.floor(Math.random() * 12) }; if (op === '-' && a < b) [a, b] = [b, a]; return { display: `${a} ${op} ${b}`, answer: op === '+' ? a + b : op === '-' ? a - b : a * b } }, [])
  if (active === 'multi') return <MathGame userId={userId} type="multiplication" title="Tables de multiplication" emoji="✖️" gen={multiGen} onBack={() => setActive(null)} earnXP={earnXP} />
  if (active === 'calc') return <MathGame userId={userId} type="calcul_mental" title="Calcul mental" emoji="🧮" gen={calcGen} onBack={() => setActive(null)} earnXP={earnXP} />
  return <div style={{ maxWidth: 500, margin: '0 auto' }}><h1 className="page-title">Entraînement</h1><p className="page-subtitle">Bats tes records !</p>
    {[{ id: 'multi', emoji: '✖️', title: 'Tables de multiplication', desc: '60 secondes non-stop', bg: '#EDE9FE', rec: records.multiplication }, { id: 'calc', emoji: '🧮', title: 'Calcul mental', desc: 'Additions, soustractions, multiplications', bg: 'var(--blue-bg)', rec: records.calcul_mental }].map(g => <div key={g.id} onClick={() => setActive(g.id)} className="card" style={{ padding: 24, cursor: 'pointer', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 18 }}><div style={{ width: 60, height: 60, borderRadius: 16, background: g.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>{g.emoji}</div><div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 16 }}>{g.title}</div><div style={{ fontSize: 13, color: 'var(--text-sec)' }}>{g.desc}</div></div>{g.rec > 0 && <div style={{ padding: '6px 14px', borderRadius: 20, background: 'var(--gold-bg)', color: '#92400E', fontSize: 13, fontWeight: 700 }}>🏆 {g.rec}</div>}</div>)}
  </div>
}

// ═══ ADMIN ═══
function AdminDash({ students, sections, videos }) { return <div><h1 className="page-title">Dashboard</h1><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}><div className="stat-card"><div className="stat-label">Élèves</div><div className="stat-value" style={{ color: 'var(--blue)' }}>{students.filter(s => s.active).length}</div></div><div className="stat-card"><div className="stat-label">Chapitres</div><div className="stat-value" style={{ color: 'var(--green)' }}>{sections.reduce((a, s) => a + (s.chapters?.length || 0), 0)}</div></div><div className="stat-card"><div className="stat-label">Vidéos</div><div className="stat-value" style={{ color: 'var(--gold)' }}>{videos.length}</div></div></div></div> }

function AdminStudents({ students, reload, showToast }) {
  const [modal, setModal] = useState(false); const [f, setF] = useState({ first_name: '', last_name: '', username: '', password: '' })
  const add = async () => { if (!f.first_name || !f.username || !f.password) return; await supabase.from('users').insert({ ...f, role: 'student', active: true }); setModal(false); setF({ first_name: '', last_name: '', username: '', password: '' }); showToast('Ajouté !'); reload() }
  const del = async id => { await supabase.from('users').delete().eq('id', id); showToast('Supprimé'); reload() }
  const toggle = async (id, a) => { await supabase.from('users').update({ active: !a }).eq('id', id); reload() }
  return <div><h1 className="page-title">Élèves</h1><button className="btn btn-primary" onClick={() => setModal(true)} style={{ marginBottom: 16 }}>{IC.plus} Ajouter</button>
    <div className="card">{students.map(s => <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: 8 }}><div><span style={{ fontWeight: 600 }}>{s.first_name} {s.last_name}</span><span style={{ marginLeft: 10, fontFamily: 'monospace', fontSize: 12, color: 'var(--text-sec)' }}>{s.username}/{s.password}</span></div><div className="row gap-sm"><span className={`badge ${s.active ? 'badge-success' : 'badge-danger'}`} style={{ cursor: 'pointer' }} onClick={() => toggle(s.id, s.active)}>{s.active ? 'Actif' : 'Inactif'}</span><button onClick={() => del(s.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-sec)' }}>{IC.trash}</button></div></div>)}</div>
    {modal && <Modal title="Nouvel élève" onClose={() => setModal(false)}>{[['Prénom','first_name','Yasmine'],['Nom','last_name','B.'],['Identifiant','username','yasmine'],['Mot de passe','password','brevet2026']].map(([l,k,ph]) => <div className="form-group" key={k}><label className="form-label">{l}</label><input className="form-input" value={f[k]} onChange={e => setF({...f,[k]:e.target.value})} placeholder={ph} /></div>)}<div className="modal-actions"><button className="btn btn-secondary btn-sm" onClick={() => setModal(false)}>Annuler</button><button className="btn btn-primary btn-sm" onClick={add}>Créer</button></div></Modal>}
  </div>
}

function AdminContent({ sections, reload, showToast }) {
  const filtered = sections.filter(s => s.type === 'formation')
  const [secModal, setSecModal] = useState(false); const [chModal, setChModal] = useState(null); const [vidModal, setVidModal] = useState(null); const [editSecModal, setEditSecModal] = useState(null); const [editChModal, setEditChModal] = useState(null); const [editVidModal, setEditVidModal] = useState(null)
  const [secTitle, setSecTitle] = useState(''); const [secEmoji, setSecEmoji] = useState('📘'); const [chTitle, setChTitle] = useState(''); const [chPdf, setChPdf] = useState(''); const [chExo, setChExo] = useState(''); const [chEval, setChEval] = useState(''); const [vidTitle, setVidTitle] = useState(''); const [vidUrl, setVidUrl] = useState(''); const [vidDur, setVidDur] = useState('')
  const addSec = async () => { if (!secTitle) return; await supabase.from('sections').insert({ title: secTitle, emoji: secEmoji, sort_order: filtered.length + 1, type: 'formation' }); setSecTitle(''); setSecEmoji('📘'); setSecModal(false); showToast('Créée !'); reload() }
  const updateSec = async () => { if (!editSecModal) return; await supabase.from('sections').update({ title: secTitle, emoji: secEmoji }).eq('id', editSecModal.id); setEditSecModal(null); showToast('Modifié !'); reload() }
  const delSec = async id => { await supabase.from('sections').delete().eq('id', id); showToast('Supprimée'); reload() }
  const addCh = async secId => { if (!chTitle) return; const chs = filtered.find(s => s.id === secId)?.chapters || []; await supabase.from('chapters').insert({ section_id: secId, title: chTitle, sort_order: chs.length + 1, pdf_url: chPdf, exercises_pdf_url: chExo, eval_pdf_url: chEval }); setChTitle(''); setChPdf(''); setChExo(''); setChEval(''); setChModal(null); showToast('Créé !'); reload() }
  const updateCh = async () => { if (!editChModal) return; await supabase.from('chapters').update({ title: chTitle, pdf_url: chPdf, exercises_pdf_url: chExo, eval_pdf_url: chEval }).eq('id', editChModal.id); setEditChModal(null); showToast('Modifié !'); reload() }
  const delCh = async id => { await supabase.from('chapters').delete().eq('id', id); showToast('Supprimé'); reload() }
  const addVid = async chId => { if (!vidTitle) return; const ch = filtered.flatMap(s => s.chapters || []).find(c => c.id === chId); const vids = ch?.videos || []; await supabase.from('videos').insert({ chapter_id: chId, title: vidTitle, video_url: vidUrl, duration_minutes: parseInt(vidDur) || 0, sort_order: vids.length + 1 }); setVidTitle(''); setVidUrl(''); setVidDur(''); setVidModal(null); showToast('Ajoutée !'); reload() }
  const updateVid = async () => { if (!editVidModal) return; await supabase.from('videos').update({ title: vidTitle, video_url: vidUrl, duration_minutes: parseInt(vidDur) || 0 }).eq('id', editVidModal.id); setEditVidModal(null); showToast('Modifié !'); reload() }
  const delVid = async id => { await supabase.from('videos').delete().eq('id', id); showToast('Supprimée'); reload() }
  const moveItem = async (table, items, idx, dir) => { const ni = idx + dir; if (ni < 0 || ni >= items.length) return; await supabase.from(table).update({ sort_order: ni + 1 }).eq('id', items[idx].id); await supabase.from(table).update({ sort_order: idx + 1 }).eq('id', items[ni].id); reload() }
  return (
    <div><h1 className="page-title">Contenu</h1><p className="page-subtitle">Sections, chapitres et vidéos</p>
      <button className="btn btn-primary" onClick={() => { setSecTitle(''); setSecEmoji('📘'); setSecModal(true) }} style={{ marginBottom: 20 }}>{IC.plus} Section</button>
      {filtered.map((sec, si) => <div key={sec.id} style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, padding: '8px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div className="row gap-sm" style={{ color: 'var(--text-sec)' }}><div onClick={() => moveItem('sections', filtered, si, -1)} style={{ cursor: si > 0 ? 'pointer' : 'default', opacity: si > 0 ? 1 : 0.2 }}>{IC.up}</div><div onClick={() => moveItem('sections', filtered, si, 1)} style={{ cursor: si < filtered.length - 1 ? 'pointer' : 'default', opacity: si < filtered.length - 1 ? 1 : 0.2 }}>{IC.down}</div></div><span style={{ fontSize: 18, fontWeight: 800 }}>{sec.emoji} {sec.title}</span></div>
          <div className="row gap-sm"><button className="btn btn-sm btn-secondary" onClick={() => { setSecTitle(sec.title); setSecEmoji(sec.emoji); setEditSecModal(sec) }}>{IC.edit}</button><button className="btn btn-primary btn-sm" onClick={() => { setChTitle(''); setChPdf(''); setChExo(''); setChEval(''); setChModal(sec.id) }}>{IC.plus} Chapitre</button><button onClick={() => delSec(sec.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-sec)' }}>{IC.trash}</button></div>
        </div>
        {(sec.chapters || []).map((ch, ci) => <div key={ch.id} className="card" style={{ marginBottom: 8 }}>
          <div className="card-header" style={{ background: 'var(--bg)' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div className="row gap-sm" style={{ color: 'var(--text-sec)' }}><div onClick={() => moveItem('chapters', sec.chapters, ci, -1)} style={{ cursor: ci > 0 ? 'pointer' : 'default', opacity: ci > 0 ? 1 : 0.2 }}>{IC.up}</div><div onClick={() => moveItem('chapters', sec.chapters, ci, 1)} style={{ cursor: ci < (sec.chapters||[]).length - 1 ? 'pointer' : 'default', opacity: ci < (sec.chapters||[]).length - 1 ? 1 : 0.2 }}>{IC.down}</div></div><span style={{ fontWeight: 700, fontSize: 14 }}>{ch.title}</span></div><div className="row gap-sm"><button className="btn btn-sm btn-secondary" onClick={() => { setChTitle(ch.title); setChPdf(ch.pdf_url||''); setChExo(ch.exercises_pdf_url||''); setChEval(ch.eval_pdf_url||''); setEditChModal(ch) }}>{IC.edit}</button><button className="btn btn-primary btn-sm" onClick={() => { setVidTitle(''); setVidUrl(''); setVidDur(''); setVidModal(ch.id) }}>{IC.plus} Vidéo</button><button onClick={() => delCh(ch.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-sec)' }}>{IC.trash}</button></div></div>
          {(ch.videos || []).map((v, vi) => <div key={v.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px', borderBottom: '1px solid var(--border)' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div className="row gap-sm" style={{ color: 'var(--text-sec)' }}><div onClick={() => moveItem('videos', ch.videos, vi, -1)} style={{ cursor: vi > 0 ? 'pointer' : 'default', opacity: vi > 0 ? 1 : 0.2 }}>{IC.up}</div><div onClick={() => moveItem('videos', ch.videos, vi, 1)} style={{ cursor: vi < (ch.videos||[]).length - 1 ? 'pointer' : 'default', opacity: vi < (ch.videos||[]).length - 1 ? 1 : 0.2 }}>{IC.down}</div></div><span style={{ fontSize: 13 }}>{v.title}</span>{v.video_url && <span style={{ fontSize: 11, color: 'var(--green)' }}>🎥</span>}</div><div className="row gap-sm"><button onClick={() => { setVidTitle(v.title); setVidUrl(v.video_url||''); setVidDur(String(v.duration_minutes||'')); setEditVidModal(v) }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-sec)' }}>{IC.edit}</button><button onClick={() => delVid(v.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-sec)' }}>{IC.trash}</button></div></div>)}
          {(!ch.videos||!ch.videos.length) && <div style={{ padding: '12px 20px', fontSize: 13, color: 'var(--text-sec)', textAlign: 'center' }}>Aucune vidéo</div>}
        </div>)}
      </div>)}
      {secModal && <Modal title="Nouvelle section" onClose={() => setSecModal(false)}><div className="form-group"><label className="form-label">Nom</label><input className="form-input" value={secTitle} onChange={e => setSecTitle(e.target.value)} autoFocus /></div><div className="form-group"><label className="form-label">Emoji</label><input className="form-input" value={secEmoji} onChange={e => setSecEmoji(e.target.value)} /></div><div className="modal-actions"><button className="btn btn-secondary btn-sm" onClick={() => setSecModal(false)}>Annuler</button><button className="btn btn-primary btn-sm" onClick={addSec}>Créer</button></div></Modal>}
      {editSecModal && <Modal title="Modifier" onClose={() => setEditSecModal(null)}><div className="form-group"><label className="form-label">Nom</label><input className="form-input" value={secTitle} onChange={e => setSecTitle(e.target.value)} autoFocus /></div><div className="form-group"><label className="form-label">Emoji</label><input className="form-input" value={secEmoji} onChange={e => setSecEmoji(e.target.value)} /></div><div className="modal-actions"><button className="btn btn-secondary btn-sm" onClick={() => setEditSecModal(null)}>Annuler</button><button className="btn btn-primary btn-sm" onClick={updateSec}>Enregistrer</button></div></Modal>}
      {chModal && <Modal title="Nouveau chapitre" onClose={() => setChModal(null)}><div className="form-group"><label className="form-label">Titre</label><input className="form-input" value={chTitle} onChange={e => setChTitle(e.target.value)} autoFocus /></div><div className="form-group"><label className="form-label">PDF Cours</label><input className="form-input" value={chPdf} onChange={e => setChPdf(e.target.value)} /></div><div className="form-group"><label className="form-label">PDF Exercices</label><input className="form-input" value={chExo} onChange={e => setChExo(e.target.value)} /></div><div className="form-group"><label className="form-label">PDF Auto-éval</label><input className="form-input" value={chEval} onChange={e => setChEval(e.target.value)} /></div><div className="modal-actions"><button className="btn btn-secondary btn-sm" onClick={() => setChModal(null)}>Annuler</button><button className="btn btn-primary btn-sm" onClick={() => addCh(chModal)}>Créer</button></div></Modal>}
      {editChModal && <Modal title="Modifier chapitre" onClose={() => setEditChModal(null)}><div className="form-group"><label className="form-label">Titre</label><input className="form-input" value={chTitle} onChange={e => setChTitle(e.target.value)} autoFocus /></div><div className="form-group"><label className="form-label">PDF Cours</label><input className="form-input" value={chPdf} onChange={e => setChPdf(e.target.value)} /></div><div className="form-group"><label className="form-label">PDF Exercices</label><input className="form-input" value={chExo} onChange={e => setChExo(e.target.value)} /></div><div className="form-group"><label className="form-label">PDF Auto-éval</label><input className="form-input" value={chEval} onChange={e => setChEval(e.target.value)} /></div><div className="modal-actions"><button className="btn btn-secondary btn-sm" onClick={() => setEditChModal(null)}>Annuler</button><button className="btn btn-primary btn-sm" onClick={updateCh}>Enregistrer</button></div></Modal>}
      {vidModal && <Modal title="Nouvelle vidéo" onClose={() => setVidModal(null)}><div className="form-group"><label className="form-label">Titre</label><input className="form-input" value={vidTitle} onChange={e => setVidTitle(e.target.value)} autoFocus /></div><div className="form-group"><label className="form-label">URL vidéo</label><input className="form-input" value={vidUrl} onChange={e => setVidUrl(e.target.value)} placeholder="YouTube, Bunny ou MP4" /></div><div className="form-group"><label className="form-label">Durée (min)</label><input className="form-input" type="number" value={vidDur} onChange={e => setVidDur(e.target.value)} /></div><div className="modal-actions"><button className="btn btn-secondary btn-sm" onClick={() => setVidModal(null)}>Annuler</button><button className="btn btn-primary btn-sm" onClick={() => addVid(vidModal)}>Ajouter</button></div></Modal>}
      {editVidModal && <Modal title="Modifier vidéo" onClose={() => setEditVidModal(null)}><div className="form-group"><label className="form-label">Titre</label><input className="form-input" value={vidTitle} onChange={e => setVidTitle(e.target.value)} autoFocus /></div><div className="form-group"><label className="form-label">URL vidéo</label><input className="form-input" value={vidUrl} onChange={e => setVidUrl(e.target.value)} /></div><div className="form-group"><label className="form-label">Durée (min)</label><input className="form-input" type="number" value={vidDur} onChange={e => setVidDur(e.target.value)} /></div><div className="modal-actions"><button className="btn btn-secondary btn-sm" onClick={() => setEditVidModal(null)}>Annuler</button><button className="btn btn-primary btn-sm" onClick={updateVid}>Enregistrer</button></div></Modal>}
    </div>
  )
}

function AdminProfs({ profs, students, reload, showToast }) {
  const [modal, setModal] = useState(false); const [f, setF] = useState({ first_name: '', last_name: '', phone: '', whatsapp_url: '' }); const [assignModal, setAssignModal] = useState(null); const [selProf, setSelProf] = useState('')
  const addProf = async () => { if (!f.first_name) return; await supabase.from('profs').insert({ ...f, active: true }); setModal(false); setF({ first_name: '', last_name: '', phone: '', whatsapp_url: '' }); showToast('Ajouté !'); reload() }
  const delProf = async id => { await supabase.from('profs').delete().eq('id', id); showToast('Supprimé'); reload() }
  const assignProf = async sid => { await supabase.from('users').update({ prof_id: selProf || null }).eq('id', sid); setAssignModal(null); showToast('Assigné !'); reload() }
  return <div><h1 className="page-title">Professeurs</h1><button className="btn btn-primary" onClick={() => setModal(true)} style={{ marginBottom: 16 }}>{IC.plus} Ajouter</button>
    <div className="card" style={{ marginBottom: 24 }}>{profs.map(p => <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid var(--border)' }}><span style={{ fontWeight: 600 }}>{p.first_name} {p.last_name}{p.phone && <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-sec)' }}>{p.phone}</span>}</span><button onClick={() => delProf(p.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-sec)' }}>{IC.trash}</button></div>)}{!profs.length && <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-sec)' }}>Aucun prof</div>}</div>
    <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Assignation</h2>
    <div className="card">{students.map(s => { const ap = profs.find(p => p.id === s.prof_id); return <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: 8 }}><span style={{ fontWeight: 600 }}>{s.first_name} {s.last_name}</span><div className="row gap-sm">{ap ? <span className="badge badge-success">{ap.first_name}</span> : <span className="badge" style={{ background: 'var(--bg)', color: 'var(--text-sec)' }}>Non assigné</span>}<button className="btn btn-secondary btn-sm" onClick={() => { setAssignModal(s); setSelProf(s.prof_id || '') }}>Changer</button></div></div> })}</div>
    {modal && <Modal title="Nouveau prof" onClose={() => setModal(false)}>{[['Prénom','first_name','Mohamed'],['Nom','last_name','B.'],['Téléphone','phone','06...'],['WhatsApp','whatsapp_url','https://wa.me/33...']].map(([l,k,ph]) => <div className="form-group" key={k}><label className="form-label">{l}</label><input className="form-input" value={f[k]} onChange={e => setF({...f,[k]:e.target.value})} placeholder={ph} /></div>)}<div className="modal-actions"><button className="btn btn-secondary btn-sm" onClick={() => setModal(false)}>Annuler</button><button className="btn btn-primary btn-sm" onClick={addProf}>Créer</button></div></Modal>}
    {assignModal && <Modal title={'Prof de ' + assignModal.first_name} onClose={() => setAssignModal(null)}><div className="form-group"><label className="form-label">Professeur</label><select className="form-input" value={selProf} onChange={e => setSelProf(e.target.value)}><option value="">— Aucun —</option>{profs.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}</select></div><div className="modal-actions"><button className="btn btn-secondary btn-sm" onClick={() => setAssignModal(null)}>Annuler</button><button className="btn btn-primary btn-sm" onClick={() => assignProf(assignModal.id)}>Enregistrer</button></div></Modal>}
  </div>
}

function AdminProgress({ students, sections }) {
  const [data, setData] = useState({}); const [streaks, setStreaks] = useState({}); const [pdfs, setPdfs] = useState({}); const [xps, setXps] = useState({}); const [times, setTimes] = useState({})
  const totalCh = sections.reduce((a, s) => a + (s.chapters?.length || 0), 0)
  useEffect(() => { (async () => { const [cpR, stR, pcR, xpR, ttR] = await Promise.all([supabase.from('chapter_progress').select('user_id, chapter_id'), supabase.from('student_streaks').select('*'), supabase.from('pdf_clicks').select('user_id'), supabase.from('student_xp').select('user_id, total_xp'), supabase.from('time_tracking').select('user_id, total_seconds, video_seconds')]); const g = {}; (cpR.data||[]).forEach(p => { if (!g[p.user_id]) g[p.user_id] = []; g[p.user_id].push(p.chapter_id) }); setData(g); const sm = {}; (stR.data||[]).forEach(s => sm[s.user_id] = s); setStreaks(sm); const pm = {}; (pcR.data||[]).forEach(c => pm[c.user_id] = (pm[c.user_id]||0) + 1); setPdfs(pm); const xm = {}; (xpR.data||[]).forEach(x => xm[x.user_id] = x.total_xp); setXps(xm); const tm = {}; (ttR.data||[]).forEach(t => { if (!tm[t.user_id]) tm[t.user_id] = { total: 0 }; tm[t.user_id].total += t.total_seconds }); setTimes(tm) })() }, [])
  const fmtTime = s => { if (!s) return '0m'; const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); return h > 0 ? `${h}h${m}m` : `${m}m` }
  const fmtDate = d => { if (!d) return '—'; const df = Math.floor((new Date() - new Date(d)) / 86400000); return df === 0 ? "Auj." : df === 1 ? 'Hier' : df < 7 ? `${df}j` : new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) }
  return <div><h1 className="page-title">Progression</h1><div className="card" style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}><thead><tr style={{ background: 'var(--bg)', borderBottom: '2px solid var(--border)' }}>{['Élève','%','Temps','Dernière co.','Connexions','PDF','XP'].map(h => <th key={h} style={{ padding: '10px', textAlign: 'center', fontWeight: 700, color: 'var(--text-sec)', fontSize: 11, textTransform: 'uppercase' }}>{h}</th>)}</tr></thead><tbody>{students.map(s => { const done = (data[s.id]||[]).length; const pct = totalCh > 0 ? Math.round((done/totalCh)*100) : 0; const stk = streaks[s.id]; const inactive = stk?.last_login && Math.floor((new Date() - new Date(stk.last_login))/86400000) >= 3; return <tr key={s.id} style={{ borderBottom: '1px solid var(--border)', background: inactive ? 'var(--red-bg)' : 'white' }}><td style={{ padding: '10px', textAlign: 'left' }}><div style={{ fontWeight: 600 }}>{s.first_name} {s.last_name}</div>{inactive && <div style={{ fontSize: 10, color: 'var(--red)', fontWeight: 700 }}>⚠️ Inactif</div>}</td><td style={{ padding: '10px', textAlign: 'center', fontWeight: 800, fontFamily: 'monospace', color: pct >= 75 ? 'var(--green)' : 'var(--blue)' }}>{pct}%</td><td style={{ padding: '10px', textAlign: 'center', fontFamily: 'monospace' }}>{fmtTime(times[s.id]?.total)}</td><td style={{ padding: '10px', textAlign: 'center' }}>{fmtDate(stk?.last_login)}</td><td style={{ padding: '10px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 700, color: 'var(--blue)' }}>{stk?.total_logins||0}</td><td style={{ padding: '10px', textAlign: 'center', fontFamily: 'monospace' }}>{pdfs[s.id]||0}</td><td style={{ padding: '10px', textAlign: 'center', fontFamily: 'monospace', color: '#7C3AED' }}>{xps[s.id]||0}</td></tr> })}</tbody></table></div></div>
}

// ═══ MAIN APP ═══
export default function Home() {
  const [user, setUser] = useState(null); const [page, setPage] = useState('welcome'); const [toast, setToast] = useState(null); const [loading, setLoading] = useState(true); const [mobileOpen, setMobileOpen] = useState(false)
  const [students, setStudents] = useState([]); const [profs, setProfs] = useState([]); const [allSections, setAllSections] = useState([]); const [videos, setVideos] = useState([]); const [settings, setSettings] = useState({})
  const [completedVideos, setCompletedVideos] = useState([]); const [completedChapters, setCompletedChapters] = useState([]); const [streak, setStreak] = useState({}); const [xp, setXp] = useState(0); const [xpPopup, setXpPopup] = useState(null)
  const [selectedVideo, setSelectedVideo] = useState(null); const [selectedChapter, setSelectedChapter] = useState(null); const [viewingPdf, setViewingPdf] = useState(null)
  const [totalTime, setTotalTime] = useState(0)
  const showToast = useCallback(m => { setToast(m); setTimeout(() => setToast(null), 2500) }, [])
  const formSections = useMemo(() => allSections.filter(s => s.type === 'formation'), [allSections])
  const totalChapters = useMemo(() => formSections.reduce((a, s) => a + (s.chapters?.length || 0), 0), [formSections])
  const totalVideos = useMemo(() => videos.filter(v => { const fChIds = formSections.flatMap(s => (s.chapters||[]).map(c => c.id)); return fChIds.includes(v.chapter_id) }).length, [videos, formSections])
  const allVidsFlat = useMemo(() => formSections.flatMap(s => (s.chapters||[]).flatMap(c => c.videos||[])), [formSections])
  const myProf = useMemo(() => { if (!user || !profs.length) return null; return profs.find(p => p.id === user.prof_id) || null }, [user, profs])

  const earnXP = useCallback(async (userId, actionKey) => { const action = XP_ACTIONS[actionKey]; if (!action || !userId) return; try { await supabase.from('xp_history').insert({ user_id: userId, action: actionKey, xp_earned: action.xp }); const { data } = await supabase.from('student_xp').select('*').eq('user_id', userId).single(); const nt = (data?.total_xp||0) + action.xp; const nl = getLevel(nt).level; if (data) await supabase.from('student_xp').update({ total_xp: nt, level: nl }).eq('user_id', userId); else await supabase.from('student_xp').insert({ user_id: userId, total_xp: nt, level: nl }); setXp(nt); setXpPopup({ xp: action.xp, label: action.label }); setTimeout(() => setXpPopup(null), 2000) } catch {} }, [])

  const loadData = useCallback(async () => {
    const [stuR, secR, chR, vidR, setR, profR] = await Promise.all([supabase.from('users').select('*').eq('role', 'student').order('created_at'), supabase.from('sections').select('*').order('sort_order'), supabase.from('chapters').select('*').order('sort_order'), supabase.from('videos').select('*').order('sort_order'), supabase.from('settings').select('*'), supabase.from('profs').select('*').order('created_at')])
    setStudents(stuR.data||[]); setVideos(vidR.data||[]); setProfs(profR.data||[])
    const allCh = chR.data||[]; const allVid = vidR.data||[]
    const chWithVid = allCh.map(c => ({ ...c, videos: allVid.filter(v => v.chapter_id === c.id) }))
    setAllSections((secR.data||[]).map(s => ({ ...s, chapters: chWithVid.filter(c => c.section_id === s.id) })))
    const sm = {}; (setR.data||[]).forEach(s => sm[s.key] = s.value); setSettings(sm); setLoading(false)
  }, [])

  const loadStudentData = useCallback(async userId => {
    const [vpR, cpR] = await Promise.all([supabase.from('video_progress').select('video_id, completed_at').eq('user_id', userId).eq('completed', true), supabase.from('chapter_progress').select('chapter_id').eq('user_id', userId).eq('completed', true)])
    setCompletedVideos((vpR.data||[]).map(r => r.video_id)); setCompletedChapters((cpR.data||[]).map(r => r.chapter_id))
    try { const { data } = await supabase.from('student_xp').select('total_xp').eq('user_id', userId).single(); if (data) setXp(data.total_xp) } catch {}
    try { const { data } = await supabase.from('time_tracking').select('total_seconds').eq('user_id', userId); setTotalTime((data||[]).reduce((a, t) => a + t.total_seconds, 0)) } catch {}
  }, [])

  const updateStreak = useCallback(async userId => {
    const today = new Date().toISOString().split('T')[0]; const now = new Date().toISOString()
    try { const { data: ex } = await supabase.from('student_streaks').select('*').eq('user_id', userId).single()
      if (ex) { if (ex.last_login === today) { await supabase.from('student_streaks').update({ last_login_time: now }).eq('user_id', userId); setStreak(ex); return }; const yest = new Date(Date.now() - 86400000).toISOString().split('T')[0]; let ns = ex.last_login === yest ? ex.current_streak + 1 : 1; const bs = Math.max(ns, ex.best_streak||0); const tl = (ex.total_logins||0) + 1; await supabase.from('student_streaks').update({ current_streak: ns, last_login: today, best_streak: bs, total_logins: tl, last_login_time: now }).eq('user_id', userId); setStreak({ current_streak: ns, last_login: today, best_streak: bs, total_logins: tl }); if (ns > 1) await earnXP(userId, 'streak_day') }
      else { await supabase.from('student_streaks').insert({ user_id: userId, current_streak: 1, last_login: today, best_streak: 1, total_logins: 1, last_login_time: now }); setStreak({ current_streak: 1, best_streak: 1, total_logins: 1 }) }
    } catch { setStreak({ current_streak: 0 }) }
  }, [earnXP])

  useEffect(() => { if (!user || user.role === 'admin') return; const ping = async () => { const today = new Date().toISOString().split('T')[0]; try { const { data } = await supabase.from('time_tracking').select('*').eq('user_id', user.id).eq('session_date', today).single(); if (data) await supabase.from('time_tracking').update({ total_seconds: data.total_seconds + 30, last_ping: new Date().toISOString() }).eq('id', data.id); else await supabase.from('time_tracking').insert({ user_id: user.id, session_date: today, total_seconds: 30 }) } catch {} }; const i = setInterval(ping, 30000); ping(); return () => clearInterval(i) }, [user])
  useEffect(() => { loadData() }, [loadData])

  const login = async (username, password, setErr) => { const { data, error } = await supabase.from('users').select('*').eq('username', username).eq('password', password).single(); if (error || !data) { setErr('Identifiant ou mot de passe incorrect'); return }; if (!data.active && data.role !== 'admin') { setErr('Compte désactivé'); return }; setUser(data); if (data.role === 'admin') setPage('admin-dash'); else { setPage('welcome'); await loadStudentData(data.id); await updateStreak(data.id) } }

  const toggleVideoComplete = async videoId => { if (!user) return; if (completedVideos.includes(videoId)) { await supabase.from('video_progress').delete().eq('user_id', user.id).eq('video_id', videoId); setCompletedVideos(p => p.filter(id => id !== videoId)) } else { await supabase.from('video_progress').upsert({ user_id: user.id, video_id: videoId, completed: true }); setCompletedVideos(p => [...p, videoId]); await earnXP(user.id, 'watch_video') } }
  const toggleChapterComplete = async chapterId => { if (!user) return; if (completedChapters.includes(chapterId)) { await supabase.from('chapter_progress').delete().eq('user_id', user.id).eq('chapter_id', chapterId); setCompletedChapters(p => p.filter(id => id !== chapterId)) } else { await supabase.from('chapter_progress').upsert({ user_id: user.id, chapter_id: chapterId, completed: true }); setCompletedChapters(p => [...p, chapterId]); await earnXP(user.id, 'complete_chapter') } }
  const trackPdf = async (type, title) => { if (!user) return; try { await supabase.from('pdf_clicks').insert({ user_id: user.id, pdf_type: type, chapter_title: title }) } catch {}; await earnXP(user.id, 'open_pdf') }
  const logout = () => { setUser(null); setPage('welcome'); setCompletedVideos([]); setCompletedChapters([]); setStreak({}); setXp(0); setSelectedVideo(null); setSelectedChapter(null); setViewingPdf(null) }

  const onSelectVideo = (video, chapter) => { setSelectedVideo(video); setSelectedChapter(chapter); setPage('video'); setViewingPdf(null) }
  const onOpenPdf = (url, title, type) => { trackPdf(type, title); setViewingPdf({ url, title }); setPage('pdf') }

  const vidIdx = selectedVideo ? allVidsFlat.findIndex(v => v.id === selectedVideo.id) : -1
  const goNext = () => { if (vidIdx < allVidsFlat.length - 1) { const nv = allVidsFlat[vidIdx + 1]; const nc = formSections.flatMap(s => s.chapters||[]).find(c => (c.videos||[]).some(v => v.id === nv.id)); onSelectVideo(nv, nc) } }
  const goPrev = () => { if (vidIdx > 0) { const pv = allVidsFlat[vidIdx - 1]; const pc = formSections.flatMap(s => s.chapters||[]).find(c => (c.videos||[]).some(v => v.id === pv.id)); onSelectVideo(pv, pc) } }
  const handleContinue = () => { setPage('welcome'); if (allVidsFlat.length > 0) { const firstUnwatched = allVidsFlat.find(v => !completedVideos.includes(v.id)); if (firstUnwatched) { const ch = formSections.flatMap(s => s.chapters||[]).find(c => (c.videos||[]).some(v => v.id === firstUnwatched.id)); onSelectVideo(firstUnwatched, ch) } else { setPage('welcome') } } }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-sec)' }}>Chargement...</div>
  if (!user) return <LoginPage onLogin={login} />
  const isAdmin = user.role === 'admin'

  if (isAdmin) {
    const adminNav = [{ id: 'admin-dash', label: 'Dashboard', icon: IC.dash }, { id: 'admin-students', label: 'Élèves', icon: IC.users }, { id: 'admin-formation', label: 'Contenu', icon: IC.book }, { id: 'admin-profs', label: 'Professeurs', icon: IC.users }, { id: 'admin-progress', label: 'Progression', icon: IC.chart }]
    return <div className="app-layout">
      <div className="sidebar"><div className="sidebar-brand"><div className="sidebar-logo">B</div><span className="sidebar-title">Brevet <span>Booster</span></span></div><div className="sidebar-section-label">Admin</div><nav style={{ flex: 1, padding: '0 10px' }}>{adminNav.map(it => <div key={it.id} className={`sidebar-nav-item ${page === it.id ? 'active' : ''}`} onClick={() => setPage(it.id)}>{it.icon} <span>{it.label}</span></div>)}</nav><div className="sidebar-bottom"><button className="sidebar-logout" onClick={logout}>{IC.logout} Déconnexion</button></div></div>
      <div className="main-content">
        {page === 'admin-dash' && <AdminDash students={students} sections={allSections} videos={videos} />}
        {page === 'admin-students' && <AdminStudents students={students} reload={loadData} showToast={showToast} />}
        {page === 'admin-formation' && <AdminContent sections={allSections} reload={loadData} showToast={showToast} />}
        {page === 'admin-profs' && <AdminProfs profs={profs} students={students} reload={loadData} showToast={showToast} />}
        {page === 'admin-progress' && <AdminProgress students={students} sections={allSections} />}
      </div>
      {toast && <Toast message={toast} />}
    </div>
  }

  return (
    <div className="app-layout">
      <CourseSidebar sections={formSections} completedVideos={completedVideos} completedChapters={completedChapters} currentPage={page} setPage={p => { setPage(p); setSelectedVideo(null); setViewingPdf(null) }} selectedVideo={selectedVideo} onSelectVideo={onSelectVideo} onLogout={logout} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} myProf={myProf} />
      <div className="main-content">
        {page === 'welcome' && <WelcomePage completedChapters={completedChapters} totalChapters={totalChapters} completedVideos={completedVideos.length} totalVideos={totalVideos} streak={streak} xp={xp} sections={formSections} onContinue={handleContinue} userName={user.first_name} totalTime={totalTime} />}
        {page === 'video' && selectedVideo && <VideoPlayer video={selectedVideo} chapter={selectedChapter} isDone={completedVideos.includes(selectedVideo.id)} onToggle={() => toggleVideoComplete(selectedVideo.id)} onNext={goNext} onPrev={goPrev} hasNext={vidIdx < allVidsFlat.length - 1} hasPrev={vidIdx > 0} allVids={selectedChapter?.videos || []} completedVideos={completedVideos} onSelectVideo={onSelectVideo} onOpenPdf={onOpenPdf} />}
        {page === 'pdf' && viewingPdf && <PdfViewer url={viewingPdf.url} title={viewingPdf.title} onBack={() => { setPage('video'); setViewingPdf(null) }} />}
        {page === 'progress' && <ProgressPage sections={formSections} completedChapters={completedChapters} completedVideos={completedVideos} xp={xp} />}
        {page === 'games' && <GamesPage userId={user.id} earnXP={earnXP} />}
      </div>
      {toast && <Toast message={toast} />}
      {xpPopup && <div style={{ position: 'fixed', top: 80, right: 24, background: 'linear-gradient(135deg, #312E81, #1E1B4B)', color: '#A5B4FC', padding: '12px 20px', borderRadius: 14, fontSize: 14, fontWeight: 700, zIndex: 300, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 30px rgba(0,0,0,0.3)', animation: 'toastIn 0.3s ease' }}>⚡ +{xpPopup.xp} XP — {xpPopup.label}</div>}
    </div>
  )
}
