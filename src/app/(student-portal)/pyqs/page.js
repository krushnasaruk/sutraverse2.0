'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db, auth } from '@/database/config/firebase';
import { useAuth } from '@/frontend/context/AuthContext';
import { awardDownloadPoints } from '@/database/queries/points';
import { ScrollReveal } from '@/frontend/components/ui/Animations';
import { Skeleton } from '@/frontend/components/ui/Skeleton/Skeleton';
import { IconPyq, IconSearch, IconLock, IconDownload, IconStar, IconHat, IconUser, IconFlag } from '@/frontend/components/ui/Icons';
import { BRANCHES, YEARS, getSubjectsByYear } from '@/shared/constants/subjectMap';
import styles from './page.module.css';

// Normalize subject names from different sources
export function normalizeSubjectName(name) {
  if (!name) return '';
  const n = String(name).trim().toLowerCase();
  
  if (n === 'bee' || n === 'basic electrical engineering' || n === 'be') return 'BEE';
  if (n === 'physics' || n === 'engineering physics') return 'Physics';
  if (n === 'chemistry' || n === 'engineering chemistry') return 'Chemistry';
  if (n === 'electronics' || n === 'basic electronics' || n === 'basic electronics engineering') return 'Basic Electronics Engineering';
  if (n === 'engineering mathematics i' || n === 'engineering mathematics 1' || n === 'maths 1' || n === 'maths i') return 'Engineering Mathematics I';
  if (n === 'engineering mathematics ii' || n === 'engineering mathematics 2' || n === 'maths 2' || n === 'maths ii') return 'Engineering Mathematics II';
  if (n === 'engineering mechanics' || n === 'mechanics' || n === 'em') return 'Engineering Mechanics';
  if (n === 'pps' || n === 'programming & problem solving' || n === 'programming and problem solving') return 'PPS';
  if (n === 'engineering graphics' || n === 'graphics' || n === 'eg') return 'Engineering Graphics';
  
  return name.trim();
}

// ── Subject config ─────────────────────────────────────────────────────────
const SUBJECTS = [
  { key: 'BEE',                             label: 'Basic Electrical Engineering', short: 'BEE',      emoji: '⚡', color: '#f59e0b', grad: 'linear-gradient(135deg,#f59e0b22,#fbbf2411)' },
  { key: 'Chemistry',                       label: 'Engineering Chemistry',        short: 'Chem',     emoji: '🧪', color: '#10b981', grad: 'linear-gradient(135deg,#10b98122,#34d39911)' },
  { key: 'Basic Electronics Engineering',   label: 'Basic Electronics',            short: 'Elec',     emoji: '📡', color: '#dc2626', grad: 'linear-gradient(135deg,#dc262622,#ef444411)' },
  { key: 'Engineering Graphics',            label: 'Engineering Graphics',         short: 'EG',       emoji: '✏️', color: '#b91c1c', grad: 'linear-gradient(135deg,#b91c1c22,#a78bfa11)' },
  { key: 'Engineering Mathematics I',       label: 'Engineering Mathematics I',    short: 'Maths I',  emoji: '📐', color: '#ef4444', grad: 'linear-gradient(135deg,#ef444422,#f8717111)' },
  { key: 'Engineering Mathematics II',      label: 'Engineering Mathematics II',   short: 'Maths II', emoji: '📏', color: '#22c55e', grad: 'linear-gradient(135deg,#22c55e22,#f4728411)' },
  { key: 'Engineering Mechanics',           label: 'Engineering Mechanics',        short: 'EM',       emoji: '⚙️', color: '#15803d', grad: 'linear-gradient(135deg,#15803d22,#16a34a11)' },
  { key: 'Physics',                         label: 'Engineering Physics',          short: 'Physics',  emoji: '🔭', color: '#f97316', grad: 'linear-gradient(135deg,#f9731622,#fb923c11)' },
  { key: 'PPS',                             label: 'Programming & Problem Solving',short: 'PPS',     emoji: '💻', color: '#16a34a', grad: 'linear-gradient(135deg,#16a34a22,#86efac11)' },
];

const SUBJECT_COLORS = [
  '#f59e0b', '#10b981', '#dc2626', '#b91c1c', '#ef4444', 
  '#22c55e', '#15803d', '#f97316', '#16a34a', '#8b5cf6',
  '#4f46e5', '#3b82f6', '#ec4899', '#f43f5e', '#06b6d4'
];

const SUBJECT_EMOJIS = {
  'bee': '⚡',
  'chemistry': '🧪',
  'physics': '🔭',
  'mechanics': '⚙️',
  'graphics': '✏️',
  'math': '📐',
  'structure': '📚',
  'data': '📊',
  'program': '💻',
  'object': '📦',
  'digital': '📡',
  'software': '🛠️',
  'operating': '🖥️',
  'visualization': '📈',
  'database': '🗄️',
  'network': '🌐'
};

function getSubjectMeta(subjectName, index = 0) {
  const normalized = normalizeSubjectName(subjectName);
  const existing = SUBJECTS.find(s => normalizeSubjectName(s.key) === normalized);
  if (existing) return existing;

  const color = SUBJECT_COLORS[index % SUBJECT_COLORS.length];
  let emoji = '📖';
  const nameL = String(subjectName || '').toLowerCase();
  for (const [kw, em] of Object.entries(SUBJECT_EMOJIS)) {
    if (nameL.includes(kw)) {
      emoji = em;
      break;
    }
  }

  return {
    key: subjectName,
    label: subjectName,
    short: subjectName.substring(0, 10),
    emoji,
    color,
    grad: `linear-gradient(135deg, ${color}22, ${color}11)`
  };
}

// Extract readable period from filename
function parsePeriod(title) {
  if (!title) return 'Unknown';
  const match = String(title).match(/(\d{4})/);
  return match ? match[1] : 'Unknown';
}

// Extract readable exam month from title
function parseExamWindow(title) {
  if (!title) return '';
  const t = String(title).toLowerCase();
  if (t.includes('nov') || t.includes('dec')) return 'Nov/Dec';
  if (t.includes('may') || t.includes('jun')) return 'May/Jun';
  if (t.includes('march') || t.includes('mar')) return 'March';
  if (t.includes('oct')) return 'October';
  if (t.includes('sep')) return 'September';
  return '';
}

export default function PyqsPage() {
  const { user, loading: authLoading } = useAuth();
  const [pyqs, setPyqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubject, setActiveSubject] = useState(null);
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('All');
  const [branch, setBranch] = useState('Computer');
  const [year, setYear] = useState('1st Year');
  const [hasLoadedPrefs, setHasLoadedPrefs] = useState(false);

  useEffect(() => {
    if (!authLoading && !hasLoadedPrefs) {
      if (user) {
        setBranch(user.branch || 'Computer');
        setYear(user.year || '1st Year');
      }
      setHasLoadedPrefs(true);
    }
  }, [user, authLoading, hasLoadedPrefs]);

  const activeBranchSubjects = useMemo(() => {
    const allPossible = getSubjectsByYear(branch, year);
    if (loading) return allPossible;

    const countMap = {};
    pyqs.forEach(p => {
      const key = normalizeSubjectName(p.subject) || 'Other';
      countMap[key] = (countMap[key] || 0) + 1;
    });

    // ONLY show subjects that have at least one paper in the result set
    return allPossible.filter(s => {
      const normS = normalizeSubjectName(s);
      return countMap[normS] > 0;
    });
  }, [branch, year, pyqs, loading]);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/list-papers');
        if (!res.ok) throw new Error('Failed to load local papers');
        const data = await res.json();
        
        if (cancelled) return;
        
        // Map the API output format to what the pyqs page expects
        const mappedPyqs = data.papers.map(p => {
            // Encode the pdfUrl as a base64 string to act as a safe Firestore document ID for tracking downloads
            let safeId = 'local-paper';
            try {
                safeId = btoa(p.pdfUrl).replace(/=/g, '');
            } catch (e) {
                safeId = encodeURIComponent(p.pdfUrl);
            }
            
            return {
                id: safeId,
                title: `${p.session}`,
                subject: p.subject,
                fileURL: p.pdfUrl,
                downloads: 0, // In a real app, you could fetch these from a dedicated tracking collection
                rating: 5.0,
                branch: 'Computer',
                uploader: 'Admin'
            };
        });
        
        setPyqs(mappedPyqs);
      } catch (e) { 
        console.warn('Fetch error:', e.message); 
        if (!cancelled) setPyqs([]); 
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Derived ────────────────────────────────────────────────────────────────
  const countBySubject = useMemo(() => {
    const map = {};
    pyqs.forEach(p => {
      const key = normalizeSubjectName(p.subject) || 'Other';
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [pyqs]);

  const latestBySubject = useMemo(() => {
    const map = {};
    pyqs.forEach(p => {
      const key = normalizeSubjectName(p.subject) || 'Other';
      if (!map[key]) map[key] = [];
      if (map[key].length < 3) map[key].push(p);
    });
    return map;
  }, [pyqs]);

  const subjectPyqs = useMemo(() => {
    if (!activeSubject) return [];
    const normalizedActive = normalizeSubjectName(activeSubject);
    return pyqs.filter(p => {
      return normalizeSubjectName(p.subject) === normalizedActive;
    });
  }, [pyqs, activeSubject]);

  const availableYears = useMemo(() => {
    const years = [...new Set(subjectPyqs.map(p => parsePeriod(p.title)))].sort((a, b) => b - a);
    return ['All', ...years];
  }, [subjectPyqs]);

  const filtered = useMemo(() => {
    return subjectPyqs.filter(p => {
      if (yearFilter !== 'All' && !(p.title || '').includes(yearFilter)) return false;
      if (search && !(p.title || '').toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [subjectPyqs, yearFilter, search]);

  const totalDownloads = useMemo(() => pyqs.reduce((s, p) => s + (p.downloads || 0), 0), [pyqs]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleDownload = async (item) => {
    let url = item.fileURL || item.fileUrl;
    if (!url) return;
    
    // Normalize localhost / absolute self-hosted URLs to relative paths
    if (url.startsWith('http://') || url.startsWith('https://')) {
      if (!url.includes('firebasestorage.googleapis.com')) {
        try {
          const parsed = new URL(url);
          url = parsed.pathname + parsed.search;
        } catch (e) {
          console.warn('URL parsing failed:', e);
        }
      }
    }

    if (!url.includes('firebasestorage')) {
      let relativePath = url;
      if (relativePath.startsWith('/')) {
        relativePath = relativePath.substring(1);
      }
      if (relativePath.includes('api/downloads/')) {
        relativePath = relativePath.split('api/downloads/')[1];
      }
      relativePath = relativePath.split('?')[0];
      url = '/api/downloads/' + relativePath;
    }

    try {
      await awardDownloadPoints(item.id, item.uploaderUID, user?.uid);
      setPyqs(prev => prev.map(p => p.id === item.id ? { ...p, downloads: (p.downloads || 0) + 1 } : p));
    } catch (e) { console.warn(e.message); }

    let finalUrl = url;
    if (!url.includes('firebasestorage')) {
      try {
        let currentUser = auth?.currentUser;
        if (!currentUser && auth) {
          const { onAuthStateChanged } = await import('firebase/auth');
          currentUser = await new Promise((resolve) => {
            const unsub = onAuthStateChanged(auth, (u) => { unsub(); resolve(u); });
            setTimeout(() => resolve(null), 3000);
          });
        }
        if (currentUser) {
          const idToken = await currentUser.getIdToken(true);
          if (idToken) {
            finalUrl = `${url}?token=${encodeURIComponent(idToken)}`;
          }
        }
      } catch (tokenErr) {
        console.warn('Failed to retrieve authentication token:', tokenErr);
      }
    }
    window.open(finalUrl, '_blank');
  };

  const activeMeta = useMemo(() => {
    if (!activeSubject) return null;
    const idx = activeBranchSubjects.indexOf(activeSubject);
    return getSubjectMeta(activeSubject, idx >= 0 ? idx : 0);
  }, [activeSubject, activeBranchSubjects]);

  // ── Auth gate ──────────────────────────────────────────────────────────────
  if (authLoading) return (
    <div style={{ paddingTop: '200px', textAlign: 'center', color: 'var(--text-muted)' }}>Authenticating...</div>
  );

  if (!user) return (
    <div className={styles.pageWrapper}>
      <div className={styles.lockState}>
        <div className={styles.lockIcon}><IconLock size={56} /></div>
        <h2 className={styles.lockTitle}>Locked Vault</h2>
        <p className={styles.lockDesc}>Sign in to access Past Year Question Papers.</p>
        <Link href="/login" className={styles.lockBtn}>Sign In</Link>
      </div>
    </div>
  );



  return (
    <div className={styles.pageWrapper}>
      {/* ── Floating Orbs ─────────────────────────────────────────────────── */}
      <div className={styles.orb1}></div>
      <div className={styles.orb2}></div>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <div className={styles.hero}>
        <div className="container">
          <ScrollReveal>
            {activeSubject ? (
              <div className={styles.breadcrumb}>
                <button className={styles.backBtn} onClick={() => { setActiveSubject(null); setSearch(''); setYearFilter('All'); }}>
                  ← Back to Subjects
                </button>
                <span className={styles.breadSep}>›</span>
                <span className={styles.breadCurrent}>{activeMeta?.label}</span>
              </div>
            ) : null}
            <h1 className={styles.heroTitle}>
              {activeSubject
                ? <><span className={styles.heroEmoji}>{activeMeta?.emoji}</span> {activeMeta?.label}</>
                : 'PYQ Vault'}
            </h1>

          </ScrollReveal>

          {/* Stats Banner on landing only */}
          {!activeSubject && !loading && (
            <ScrollReveal delay={200}>
              <div className={styles.statsBanner}>
                <div className={styles.statBubble}>
                  <span className={styles.statValue}>{pyqs.length}</span>
                  <span className={styles.statLabel}>Papers</span>
                </div>
                <div className={styles.statDivider}></div>
                <div className={styles.statBubble}>
                  <span className={styles.statValue}>{activeBranchSubjects.length}</span>
                  <span className={styles.statLabel}>Subjects</span>
                </div>
                <div className={styles.statDivider}></div>
                <div className={styles.statBubble}>
                  <span className={styles.statValue}>{totalDownloads}</span>
                  <span className={styles.statLabel}>Downloads</span>
                </div>
                <div className={styles.statDivider}></div>
                <div className={styles.statBubble}>
                  <span className={styles.statValue}>2019</span>
                  <span className={styles.statLabel}>Pattern</span>
                </div>
              </div>
            </ScrollReveal>
          )}
        </div>
      </div>

      <div className="container" style={{ position: 'relative', zIndex: 10 }}>
        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* ═══ LANDING — Subject Cards ════════════════════════════════════ */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {!activeSubject && (
          <>
            {/* Branch / Year Filters */}
            <ScrollReveal delay={100}>
              <div className={styles.filterBar}>
                <div className={styles.filterGroup}>
                  <select className={styles.filterSelect} value={branch} onChange={e => setBranch(e.target.value)}>
                    {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <select className={styles.filterSelect} value={year} onChange={e => setYear(e.target.value)}>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <span className={styles.filterCount}>{activeBranchSubjects.length} subjects found</span>
              </div>
            </ScrollReveal>

            {loading ? (
              <div className={styles.subjectGrid}>
                {[...Array(9)].map((_, i) => (
                  <Skeleton key={i} width="100%" height="200px" borderRadius="var(--radius-xl)" />
                ))}
              </div>
            ) : (
              <div className={styles.subjectGrid}>
                {activeBranchSubjects.map((subj, i) => {
                  const s = getSubjectMeta(subj, i);
                  const count = countBySubject[s.key] || 0;
                  const latest = latestBySubject[s.key] || [];
                  return (
                    <ScrollReveal key={s.key} delay={i * 60} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <button
                        className={styles.subjectCard}
                        style={{ '--accent-color': s.color }}
                        onClick={() => setActiveSubject(s.key)}
                      >
                        {/* Glow stripe */}
                        <div className={styles.cardGlow} style={{ background: `${s.color}18` }}></div>
                        
                        {/* Top row */}
                        <div className={styles.cardTop}>
                          <div className={styles.subjectEmoji} style={{ background: `${s.color}15`, borderColor: `${s.color}30` }}>
                            {s.emoji}
                          </div>
                          <div className={styles.cardBadge} style={{ color: s.color, background: `${s.color}15` }}>
                            {count} papers
                          </div>
                        </div>

                        {/* Subject name */}
                        <h3 className={styles.subjectName}>{s.label}</h3>

                        {/* Latest papers preview */}
                        {latest.length > 0 ? (
                          <div className={styles.latestStack}>
                            {latest.map((p, j) => (
                              <div key={p.id} className={styles.latestItem} style={{ '--i': j }}>
                                <span className={styles.latestDot} style={{ background: s.color }}></span>
                                <span className={styles.latestText}>
                                  {parseExamWindow(p.title)} {parsePeriod(p.title)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className={styles.noContent}>
                            <p>No papers yet</p>
                            <span className={styles.emptyDesc}>Be the first to upload!</span>
                          </div>
                        )}

                        {/* Bottom bar */}
                        <div className={styles.cardBottom}>
                          <span className={styles.subjectPattern}>2019 Pattern</span>
                          <span className={styles.subjectArrow} style={{ color: s.color }}>
                            View All →
                          </span>
                        </div>
                      </button>
                    </ScrollReveal>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* ═══ DRILL-DOWN — Paper List ════════════════════════════════════ */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeSubject && (
          <>
            {/* ── Filter Bar (Option D) ────────────────────────────────────── */}
            <ScrollReveal delay={100}>
              <div className={styles.filterBar}>
                <div className={styles.yearChips}>
                  {availableYears.map(y => (
                    <button
                      key={y}
                      className={`${styles.yearChip} ${yearFilter === y ? styles.yearChipActive : ''}`}
                      style={yearFilter === y ? { background: activeMeta?.color, borderColor: activeMeta?.color } : {}}
                      onClick={() => setYearFilter(y)}
                    >
                      {y}
                    </button>
                  ))}
                </div>
                <div className={styles.searchBox}>
                  <IconSearch size={16} className={styles.searchIcon} />
                  <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Search papers..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </ScrollReveal>

            <p className={styles.resultsCount}>
              Showing <strong>{filtered.length}</strong> of {subjectPyqs.length} papers
            </p>

            {/* ── Paper Grid ───────────────────────────────────────────────── */}
            {loading ? (
              <div className={styles.paperGrid}>
                {[1,2,3,4,5,6].map(i => <Skeleton key={i} variant="card" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className={styles.emptyState}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
                <h3>No papers found</h3>
                <p>Try adjusting the year filter or search term.</p>
              </div>
            ) : (
              <div className={styles.paperGrid}>
                {filtered.map((item, i) => {
                  const examWindow = parseExamWindow(item.title);
                  const yearStr = parsePeriod(item.title);
                  return (
                    <ScrollReveal key={item.id} delay={i * 35}>
                      <div className={styles.paperCard} style={{ '--accent-color': activeMeta?.color }}>
                        {/* Shimmer stripe */}
                        <div className={styles.paperShimmer} style={{ background: `${activeMeta?.color}10` }}></div>
                        
                        <div className={styles.paperHeader}>
                          <div className={styles.paperIcon} style={{ background: `${activeMeta?.color}15`, color: activeMeta?.color }}>
                            <IconPyq size={22} />
                          </div>
                          <div className={styles.paperBadges}>
                            {examWindow && (
                              <span className={styles.examBadge}>{examWindow}</span>
                            )}
                            <span className={styles.paperYear} style={{ color: activeMeta?.color, background: `${activeMeta?.color}15` }}>
                              {yearStr}
                            </span>
                          </div>
                        </div>

                        <h3 className={styles.paperTitle}>{item.title}</h3>

                        <div className={styles.paperMeta}>
                          <span><IconHat size={13} /> {item.branch || 'All Branches'}</span>
                          <span><IconUser size={13} /> {item.uploader || 'Admin'}</span>
                        </div>

                        <div className={styles.paperFooter}>
                          <div className={styles.paperStats}>
                            <span title="Downloads"><IconDownload size={14} /> {item.downloads || 0}</span>
                            <span title="Rating"><IconStar size={14} /> {item.rating || 'New'}</span>
                          </div>
                          <button
                            className={styles.downloadBtn}
                            style={{ background: activeMeta?.color, boxShadow: `0 4px 14px ${activeMeta?.color}44` }}
                            onClick={() => handleDownload(item)}
                          >
                            <IconDownload size={16} /> Download
                          </button>
                        </div>
                      </div>
                    </ScrollReveal>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
