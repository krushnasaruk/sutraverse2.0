'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { collection, getDocs, doc, updateDoc, increment, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { awardDownloadPoints } from '@/lib/points';
import { ScrollReveal } from '@/components/Animations';
import { Skeleton } from '@/components/Skeleton/Skeleton';
import { IconAssignment, IconUser, IconHat, IconDownload, IconStar, IconSearch, IconLock, IconFlag } from '@/components/Icons';
import { BRANCHES, YEARS, getSubjectsByYear } from '@/lib/subjectMap';
import styles from './page.module.css';

// Subjects with warm/playful colors
const SUBJECT_TABS = [
  { key: 'All',  label: 'All Files',   emoji: '📚', color: '#b91c1c' },
  { key: 'BEE',  label: 'BEE',         emoji: '⚡', color: '#f59e0b' },
  { key: 'IKS',  label: 'IKS',         emoji: '🕉️', color: '#ef4444' },
  { key: 'PPS',  label: 'PPS',         emoji: '💻', color: '#15803d' },
  { key: 'FPL',  label: 'FPL',         emoji: '🔧', color: '#10b981' },
  { key: 'Chemistry',               label: 'Chemistry',  emoji: '🧪', color: '#16a34a' },
  { key: 'Physics',                 label: 'Physics',    emoji: '🔭', color: '#f97316' },
  { key: 'Engineering Mathematics', label: 'Maths',      emoji: '📐', color: '#22c55e' },
  { key: 'Engineering Mechanics',   label: 'Mechanics',  emoji: '⚙️', color: '#dc2626' },
  { key: 'Engineering Graphics',    label: 'EG',         emoji: '🎨', color: '#4f46e5' },
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

function getSubjectTabMeta(subjectName, index = 0) {
  const existing = SUBJECT_TABS.find(t => t.key.toLowerCase() === String(subjectName || '').toLowerCase());
  if (existing) return existing;

  const color = SUBJECT_COLORS[index % SUBJECT_COLORS.length];
  let emoji = '✏️';
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
    emoji,
    color
  };
}

export default function AssignmentsPage() {
  const { user, loading: authLoading } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
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
    return getSubjectsByYear(branch, year);
  }, [branch, year]);

  const activeTabsList = useMemo(() => {
    const list = [{ key: 'All', label: 'All Files', emoji: '📚', color: '#b91c1c' }];
    activeBranchSubjects.forEach((subj, idx) => {
      list.push(getSubjectTabMeta(subj, idx + 1));
    });
    return list;
  }, [activeBranchSubjects]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (!db) throw new Error('Firestore not init');
        // Use indexed query — only fetch approved Assignments
        const assignQ = query(
          collection(db, 'files'),
          where('type', '==', 'Assignment'),
          where('status', '==', 'approved'),
          orderBy('createdAt', 'desc')
        );
        const snap = await Promise.race([
          getDocs(assignQ),
          new Promise((_, r) => setTimeout(() => r(new Error('Timeout')), 15000)),
        ]);
        if (cancelled) return;
        const data = snap.docs
          .map(d => { const f = d.data(); if (f.subject === 'BE') f.subject = 'BEE'; return { id: d.id, ...f }; });
        if (!cancelled) setAssignments(data);
      } catch (error) {
        console.warn('Error fetching assignments:', error);
        if (!cancelled) setAssignments([]);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const countBySubject = useMemo(() => {
    const map = { All: assignments.length };
    assignments.forEach(a => { const k = String(a.subject || '').trim() || 'Other'; map[k] = (map[k] || 0) + 1; });
    return map;
  }, [assignments]);

  const filtered = useMemo(() => {
    let r = assignments;
    if (activeTab !== 'All') {
      r = r.filter(a => {
        const s = String(a.subject || '').trim() || '';
        return s === activeTab || s.toLowerCase().includes(activeTab.toLowerCase());
      });
    }
    if (search) r = r.filter(a => String(a.title || '').toLowerCase().includes(search.toLowerCase()));
    return r;
  }, [assignments, activeTab, search]);

  const totalDownloads = useMemo(() => assignments.reduce((s, a) => s + (a.downloads || 0), 0), [assignments]);

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

    try { await awardDownloadPoints(item.id, item.uploaderUID, user?.uid); setAssignments(prev => prev.map(a => a.id === item.id ? { ...a, downloads: (a.downloads || 0) + 1 } : a)); } catch (e) {}
    window.open(url, '_blank');
  };

  const handleReport = async (item) => {
    if (!confirm('Flag this assignment as incorrect?')) return;
    try { await updateDoc(doc(db, 'files', item.id), { isReported: true, reportCount: increment(1) }); alert('Flagged for review.'); } catch (e) { alert('Failed.'); }
  };

  const activeMeta = useMemo(() => {
    return activeTabsList.find(t => t.key === activeTab) || activeTabsList[0];
  }, [activeTab, activeTabsList]);

  if (authLoading) return <div style={{ paddingTop: '200px', textAlign: 'center', color: 'var(--text-muted)' }}>Authenticating...</div>;

  if (!user) return (
    <div className={styles.pageWrapper}>
      <div className={styles.lockState}>
        <div className={styles.lockEmoji}>📝</div>
        <h2 className={styles.lockTitle}>Assignment Archive</h2>
        <p className={styles.lockDesc}>Sign in to access solutions & lab manuals.</p>
        <Link href="/login" className={styles.lockBtn}>Sign In to Access</Link>
      </div>
    </div>
  );



  return (
    <div className={styles.pageWrapper}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className="container">
          <ScrollReveal>
            <span className={styles.heroBadge}>📝 Assignments</span>
            <h1 className={styles.heroTitle}>Assignment Archive</h1>

          </ScrollReveal>
        </div>
      </div>

      {/* Branch / Year Filters */}
      <div className="container" style={{ marginTop: '30px', position: 'relative', zIndex: 10 }}>
        <ScrollReveal delay={100}>
          <div className={styles.filterBar} style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-light)', padding: '12px 24px', borderRadius: 'var(--radius-lg)' }}>
            <div className={styles.filterGroup}>
              <select className={styles.filterSelect} value={branch} onChange={e => { setBranch(e.target.value); setActiveTab('All'); }}>
                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <select className={styles.filterSelect} value={year} onChange={e => { setYear(e.target.value); setActiveTab('All'); }}>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <span className={styles.filterCount} style={{ color: 'var(--text-muted)' }}>{activeBranchSubjects.length} subjects loaded</span>
          </div>
        </ScrollReveal>
      </div>

      <div className={`container ${styles.layout}`} style={{ marginTop: '30px' }}>
        {/* ═══ Left Sidebar ═══ */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h3 className={styles.sidebarTitle}>Subjects</h3>
            <span className={styles.sidebarCount}>{assignments.length} files</span>
          </div>

          <div className={styles.sidebarList}>
            {activeTabsList.map(t => {
              const count = countBySubject[t.key] || 0;
              const isActive = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  className={`${styles.sidebarItem} ${isActive ? styles.sidebarItemActive : ''}`}
                  style={isActive ? { '--active-color': t.color } : {}}
                  onClick={() => setActiveTab(t.key)}
                >
                  <span className={styles.sidebarEmoji}>{t.emoji}</span>
                  <span className={styles.sidebarLabel}>{t.label}</span>
                  {count > 0 && <span className={styles.sidebarBadge} style={isActive ? { background: t.color, color: '#fff' } : {}}>{count}</span>}
                </button>
              );
            })}
          </div>

          {/* Quick stats */}
          <div className={styles.sidebarStats}>
            <div className={styles.miniStat}>
              <span className={styles.miniNum}>{assignments.length}</span>
              <span className={styles.miniLabel}>Files</span>
            </div>
            <div className={styles.miniStat}>
              <span className={styles.miniNum}>{totalDownloads}</span>
              <span className={styles.miniLabel}>Downloads</span>
            </div>
          </div>
        </aside>

        {/* ═══ Main Content ═══ */}
        <main className={styles.main}>
          {/* Search bar */}
          <div className={styles.toolbar}>
            <div className={styles.toolbarLeft}>
              <h2 className={styles.sectionTitle}>
                <span style={{ color: activeMeta?.color }}>{activeMeta?.emoji}</span>{' '}
                {activeMeta?.label}
              </h2>
              <span className={styles.countLabel}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
            </div>
            <div className={styles.searchBox}>
              <IconSearch size={15} />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>

          {/* Cards */}
          {loading ? (
            <div className={styles.cardGrid}>
              {[1,2,3,4,5,6].map(i => <Skeleton key={i} variant="card" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyEmoji}>📂</div>
              <h3>No assignments found</h3>
              <p>Try another subject or search term.</p>
              <span className={styles.emptyDesc}>Check back later!</span>
            </div>
          ) : (
            <div className={styles.cardGrid}>
              {filtered.map((item, i) => {
                const subMeta = activeTabsList.find(t => t.key !== 'All' && (item.subject === t.key || item.subject?.toLowerCase().includes(t.key.toLowerCase())));
                const accent = subMeta?.color || '#b91c1c';
                return (
                  <ScrollReveal key={item.id} delay={i * 30}>
                    <div className={styles.card} style={{ '--card-accent': accent }}>
                      {/* Top stripe */}
                      <div className={styles.cardStripe} style={{ background: accent }}></div>
                      
                      <div className={styles.cardBody}>
                        <div className={styles.cardRow1}>
                          <div className={styles.cardIconWrap} style={{ background: `${accent}12`, color: accent }}>
                            <IconAssignment size={20} />
                          </div>
                          <span className={styles.subjectPill} style={{ color: accent, background: `${accent}12` }}>
                            {item.subject}
                          </span>
                        </div>

                        <h3 className={styles.cardTitle}>{item.title}</h3>

                        <div className={styles.cardMeta}>
                          <span><IconHat size={12} /> {item.branch || 'All'}</span>
                          <span><IconUser size={12} /> {item.uploader || 'Admin'}</span>
                        </div>

                        <div className={styles.cardFooter}>
                          <div className={styles.cardStats}>
                            <span><IconDownload size={13} /> {item.downloads || 0}</span>
                            <span><IconStar size={13} /> {item.rating || 'New'}</span>
                          </div>
                          <div className={styles.cardActions}>
                            <button className={styles.reportBtn} onClick={() => handleReport(item)} title="Report"><IconFlag size={14} /></button>
                            <button className={styles.getBtn} style={{ background: accent }} onClick={() => handleDownload(item)}>
                              <IconDownload size={14} /> Get
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
