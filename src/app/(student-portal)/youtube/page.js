'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/database/config/firebase';
import { useAuth } from '@/frontend/context/AuthContext';
import { BRANCHES, YEARS, getSubjectsByYear } from '@/shared/constants/subjectMap';
import { ScrollReveal } from '@/frontend/components/ui/Animations';
import { Skeleton } from '@/frontend/components/ui/Skeleton/Skeleton';
import { IconLock, IconYoutube } from '@/frontend/components/ui/Icons';
import styles from './page.module.css';

/* ── Subject accent colours ──────────────────────────────────────────────── */
const SUBJECT_COLORS = [
  '#ef4444', '#f59e0b', '#10b981', '#dc2626', '#b91c1c',
  '#22c55e', '#15803d', '#f97316', '#16a34a', '#166534',
  '#14b8a6', '#e11d48', '#991b1b', '#84cc16', '#0ea5e9',
];

/* ── Unit metadata ───────────────────────────────────────────────────────── */
const UNIT_META = {
  'Unit 1': { emoji: '📘', color: '#dc2626' },
  'Unit 2': { emoji: '📗', color: '#10b981' },
  'Unit 3': { emoji: '📙', color: '#f59e0b' },
  'Unit 4': { emoji: '📕', color: '#ef4444' },
  'Unit 5': { emoji: '📓', color: '#b91c1c' },
  'Unit 6': { emoji: '📔', color: '#22c55e' },
};

export default function YouTubePage() {
  const { user, loading: authLoading } = useAuth();

  const [branch, setBranch] = useState('Computer');
  const [year, setYear] = useState('1st Year');
  const [allLectures, setAllLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedPrefs, setHasLoadedPrefs] = useState(false);

  /* Drill-down state */
  const [activeSubject, setActiveSubject] = useState(null);

  /* ── User prefs ──────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!authLoading && !hasLoadedPrefs) {
      if (user) {
        setBranch(user.branch || 'Computer');
        setYear(user.year || '1st Year');
      }
      setHasLoadedPrefs(true);
    }
  }, [user, authLoading, hasLoadedPrefs]);

  /* ── Fetch all lectures ─────────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (!db) throw new Error('Firestore not initialized');
        const snap = await Promise.race([
          getDocs(collection(db, 'youtube_lectures')),
          new Promise((_, r) => setTimeout(() => r(new Error('Timeout')), 15000)),
        ]);
        if (cancelled) return;
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        data.sort((a, b) => {
          const unitA = parseInt((a.unit || 'Unit 1').replace(/[^0-9]/g, '')) || 1;
          const unitB = parseInt((b.unit || 'Unit 1').replace(/[^0-9]/g, '')) || 1;
          if (unitA !== unitB) return unitA - unitB;
          return (a.createdAt || '').localeCompare(b.createdAt || '');
        });
        if (!cancelled) {
          console.log('[YouTube] Fetched', data.length, 'total lectures from Firestore');
          if (data.length > 0) {
            const subjectSet = [...new Set(data.map(d => d.subject))];
            console.log('[YouTube] Subjects found:', subjectSet);
          }
          setAllLectures(data);
        }
      } catch (e) {
        console.warn('Fetch error:', e.message);
        if (!cancelled) setAllLectures([]);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  /* ── Derived data ──────────────────────────────────────────────────── */
  const subjects = useMemo(() => {
    const allPossible = getSubjectsByYear(branch, year);
    if (loading) return allPossible;

    const grouped = {};
    allPossible.forEach(s => (grouped[s] = []));
    allLectures.forEach(lecture => {
      if (allPossible.includes(lecture.subject)) {
        if (!grouped[lecture.subject]) grouped[lecture.subject] = [];
        grouped[lecture.subject].push(lecture);
      }
    });

    // ONLY show subjects that have at least one verified lecture
    return allPossible.filter(s => grouped[s] && grouped[s].length > 0);
  }, [branch, year, allLectures, loading]);

  const subjectContent = useMemo(() => {
    const grouped = {};
    subjects.forEach(s => (grouped[s] = []));
    allLectures.forEach(lecture => {
      if (subjects.includes(lecture.subject)) {
        if (!grouped[lecture.subject]) grouped[lecture.subject] = [];
        grouped[lecture.subject].push(lecture);
      }
    });
    return grouped;
  }, [allLectures, subjects]);

  const totalVideos = useMemo(() =>
    Object.values(subjectContent).reduce((s, arr) => s + arr.length, 0),
  [subjectContent]);

  const subjectsWithVideos = useMemo(() =>
    Object.values(subjectContent).filter(arr => arr.length > 0).length,
  [subjectContent]);

  const activeSubjectLectures = useMemo(() => {
    if (!activeSubject) return [];
    return subjectContent[activeSubject] || [];
  }, [activeSubject, subjectContent]);

  /* Group lectures by Unit */
  const groupedByUnit = useMemo(() => {
    const units = {};
    activeSubjectLectures.forEach(l => {
      const unitName = l.unit || 'Other';
      if (!units[unitName]) units[unitName] = [];
      units[unitName].push(l);
    });
    return units;
  }, [activeSubjectLectures]);

  const activeColor = activeSubject
    ? SUBJECT_COLORS[subjects.indexOf(activeSubject) % SUBJECT_COLORS.length]
    : '#ff0000';

  /* ── Auth gate ──────────────────────────────────────────────────────── */
  if (authLoading) return (
    <div style={{ paddingTop: '200px', textAlign: 'center', color: 'var(--text-muted)' }}>Authenticating...</div>
  );

  if (!user) return (
    <div className={styles.pageWrapper}>
      <div className={styles.lockState}>
        <div className={styles.lockIcon}><IconLock size={56} /></div>
        <h2 className={styles.lockTitle}>Lecture Hall</h2>
        <p className={styles.lockDesc}>Sign in to browse curated video lectures organized by subject and unit.</p>
        <Link href="/login" className={styles.lockBtn}>Sign In to Access</Link>
      </div>
    </div>
  );

  return (
    <div className={styles.pageWrapper}>
      {/* ── Floating Orbs ─────────────────────────────────────────────────── */}
      <div className={styles.orb1}></div>
      <div className={styles.orb2}></div>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div className={styles.hero}>
        <div className="container">
          <ScrollReveal>
            {activeSubject ? (
              <div className={styles.breadcrumb}>
                <button className={styles.backBtn} onClick={() => setActiveSubject(null)}>
                  ← Back to Subjects
                </button>
                <span className={styles.breadSep}>›</span>
                <span className={styles.breadCurrent}>{activeSubject}</span>
              </div>
            ) : null}
            <h1 className={styles.heroTitle}>
              {activeSubject
                ? <><span className={styles.heroEmoji}>📖</span> {activeSubject}</>
                : 'Lecture Hall'}
            </h1>

          </ScrollReveal>

          {/* Stats Banner on landing only */}
          {!activeSubject && !loading && (
            <ScrollReveal delay={200}>
              <div className={styles.statsBanner}>
                <div className={styles.statBubble}>
                  <span className={styles.statValue}>{totalVideos}</span>
                  <span className={styles.statLabel}>Videos</span>
                </div>
                <div className={styles.statDivider}></div>
                <div className={styles.statBubble}>
                  <span className={styles.statValue}>{subjectsWithVideos}</span>
                  <span className={styles.statLabel}>Subjects</span>
                </div>
                <div className={styles.statDivider}></div>
                <div className={styles.statBubble}>
                  <span className={styles.statValue}>{subjects.length}</span>
                  <span className={styles.statLabel}>Total</span>
                </div>
                <div className={styles.statDivider}></div>
                <div className={styles.statBubble}>
                  <span className={styles.statValue}>SPPU</span>
                  <span className={styles.statLabel}>Pattern</span>
                </div>
              </div>
            </ScrollReveal>
          )}
        </div>
      </div>

      <div className="container" style={{ position: 'relative', zIndex: 10 }}>
        {/* ════════════════════════════════════════════════════════════════ */}
        {/* ═══ LANDING — Subject Cards ═════════════════════════════════ */}
        {/* ════════════════════════════════════════════════════════════════ */}
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
                <span className={styles.filterCount}>{subjects.length} subjects found</span>
              </div>
            </ScrollReveal>

            {loading ? (
              <div className={styles.subjectGrid}>
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} width="100%" height="220px" borderRadius="var(--radius-xl)" />
                ))}
              </div>
            ) : subjects.length > 0 ? (
              <div className={styles.subjectGrid}>
                {subjects.map((subj, i) => {
                  const content = subjectContent[subj] || [];
                  const accent = SUBJECT_COLORS[i % SUBJECT_COLORS.length];
                  const topContent = content.slice(0, 3);
                  const unitSet = [...new Set(content.map(c => c.unit))];

                  return (
                    <ScrollReveal key={subj} delay={i * 60} style={{ minWidth: 0, width: '100%' }}>
                      <button
                        className={styles.subjectCard}
                        style={{ '--accent-color': accent }}
                        onClick={() => setActiveSubject(subj)}
                      >
                        {/* Glow stripe */}
                        <div className={styles.cardGlow} style={{ background: `${accent}18` }}></div>

                        {/* Header */}
                        <div className={styles.subjectCardHeader}>
                          <div className={styles.subjectIcon} style={{ background: `${accent}15`, borderColor: `${accent}30`, color: '#ff0000' }}>
                            <IconYoutube size={20} />
                          </div>
                          <div className={styles.cardBadge} style={{ color: accent, background: `${accent}15` }}>
                            {content.length} {content.length === 1 ? 'video' : 'videos'}
                          </div>
                        </div>

                        <h3 className={styles.subjectName}>{subj}</h3>

                        {/* Preview list */}
                        {topContent.length > 0 ? (
                          <div className={styles.previewList}>
                            {topContent.map((item, j) => (
                              <div key={item.id} className={styles.previewItem} style={{ '--i': j }}>
                                <span className={styles.previewDot} style={{ background: accent }}></span>
                                <span className={styles.previewText}>{item.title}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className={styles.noContent}>
                            <p>No lectures yet</p>
                            <span className={styles.emptyDesc}>Check back soon!</span>
                          </div>
                        )}

                        {/* Bottom bar */}
                        <div className={styles.cardBottom}>
                          <span className={styles.cardPattern}>
                            {unitSet.length > 0 ? `${unitSet.length} units` : 'Coming soon'}
                          </span>
                          <span className={styles.subjectArrow} style={{ color: accent }}>
                            Watch →
                          </span>
                        </div>
                      </button>
                    </ScrollReveal>
                  );
                })}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📂</div>
                <h3>Select a branch & year</h3>
                <p>Pick your branch and year to see available subjects.</p>
              </div>
            )}
          </>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* ═══ DRILL-DOWN — Lectures by Unit ═══════════════════════════ */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {activeSubject && (
          <div style={{ marginTop: '8px' }}>
            {loading ? (
              <div className={styles.lectureGrid} style={{ marginTop: '40px' }}>
                {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} width="100%" height="280px" borderRadius="var(--radius-xl)" />)}
              </div>
            ) : activeSubjectLectures.length === 0 ? (
              <div className={styles.emptyState}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎥</div>
                <h3>No lectures found</h3>
                <p>There are no video lectures available for {activeSubject} yet.</p>
              </div>
            ) : (
              Object.keys(groupedByUnit).sort().map((unit, ui) => {
                const unitMeta = UNIT_META[unit] || { emoji: '📄', color: '#991b1b' };
                const unitLectures = groupedByUnit[unit];
                return (
                  <div key={unit} className={styles.unitSection}>
                    <ScrollReveal delay={ui * 80}>
                      <div className={styles.unitHeader}>
                        <div className={styles.unitBadge} style={{ borderColor: `${unitMeta.color}40` }}>
                          <span className={styles.unitEmoji}>{unitMeta.emoji}</span>
                          {unit}
                        </div>
                        <div className={styles.unitLine}></div>
                        <span className={styles.unitCount}>{unitLectures.length} lectures</span>
                      </div>
                    </ScrollReveal>

                    <div className={styles.lectureGrid}>
                      {unitLectures.map((lecture, idx) => (
                        <ScrollReveal key={lecture.id} delay={idx * 50} style={{ minWidth: 0, width: '100%' }}>
                          <a
                            href={lecture.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.lectureCard}
                          >
                            {/* Thumbnail */}
                            <div className={styles.lectureThumbnail}>
                              <img
                                className={styles.lectureThumbnailImg}
                                src={`https://img.youtube.com/vi/${lecture.videoId}/hqdefault.jpg`}
                                alt={lecture.title}
                                loading="lazy"
                              />
                              <div className={styles.playOverlay}>
                                <div className={styles.playButton}>
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <polygon points="5 3 19 12 5 21 5 3" />
                                  </svg>
                                </div>
                              </div>
                              <div className={styles.ytBadge}>
                                <IconYoutube size={14} style={{ marginRight: 4 }} /> YouTube
                              </div>
                            </div>

                            {/* Info */}
                            <div className={styles.lectureInfo}>
                              <h3 className={styles.lectureTitle}>{lecture.title}</h3>
                              <div className={styles.lectureSubject}>
                                📚 {lecture.subject} • {lecture.unit}
                              </div>
                              <div className={styles.lectureFooter}>
                                <div className={styles.channelInfo}>
                                  <IconYoutube size={14} style={{ marginRight: 4 }} />
                                  YouTube
                                </div>
                                <span className={styles.watchText}>
                                  Watch Now →
                                </span>
                              </div>
                            </div>
                          </a>
                        </ScrollReveal>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
