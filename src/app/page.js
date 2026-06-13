'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, orderBy, limit, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '@/database/config/firebase';
import { useAuth } from '@/frontend/context/AuthContext';
import { useCollege } from '@/frontend/context/CollegeContext';
import { useTheme } from '@/frontend/context/ThemeContext';
import { awardDownloadPoints } from '@/database/queries/points';
import { ScrollReveal, CountUp } from '@/frontend/components/ui/Animations';
import styles from './page.module.css';
import { IconNotes, IconPyq, IconAssignment, IconSparkles, IconUser, IconFolder, IconHat, IconStar, IconDownload } from '@/frontend/components/ui/Icons';
import { Skeleton, SkeletonGrid } from '@/frontend/components/ui/Skeleton/Skeleton';
import { filterAvailableFiles } from '@/shared/utils/verifyFiles';

function getTypeClass(type) {
  switch (type) {
    case 'Notes': return styles.typeNotes;
    case 'PYQ': return styles.typePyq;
    case 'Assignment': return styles.typeAssignment;
    default: return styles.typeNotes;
  }
}

export default function HomePage() {
  const [heroQuery, setHeroQuery] = useState('');
  const [recentFiles, setRecentFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [topContributors, setTopContributors] = useState([]);
  const [platformStats, setPlatformStats] = useState({ notes: 0, students: 0, pyqs: 0, subjects: 0 });
  const [latestNews, setLatestNews] = useState([]);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [clubsCount, setClubsCount] = useState(0);
  const router = useRouter();
  const { user } = useAuth();
  const { branding } = useCollege();
  const { theme } = useTheme();
  const heroRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
      const fetchRecent = async () => {
      setLoadingFiles(true);
      try {
        if (!db) throw new Error('Firestore not initialized');
        let timeoutId;
        const timeout = new Promise((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error('Timeout')), 6000);
        });
        
        // Only fetch the 6 most recent approved files — not the entire collection
        const recentQ = query(
          collection(db, 'files'),
          where('status', '==', 'approved'),
          orderBy('createdAt', 'desc'),
          limit(6)
        );
        const snapshot = await Promise.race([getDocs(recentQ), timeout]);
        clearTimeout(timeoutId);
        
        const data = snapshot.docs.map(d => {
          const f = d.data();
          if (f.subject === 'BE') f.subject = 'BEE';
          if (f.subject === 'Engineering Mathematics 1') f.subject = 'Engineering Mathematics I';
          if (f.subject === 'EG') f.subject = 'Engineering Graphics';
          if (f.subject === 'EM') f.subject = 'Engineering Mechanics';
          if (f.subject === 'Basic Electronics Engineering' || f.subject === 'BXE') f.subject = 'BEE';
          return { id: d.id, ...f };
        });
        
        // Filter out files that don't exist on disk
        const verified = await filterAvailableFiles(data);
        if (!cancelled) setRecentFiles(verified);
      } catch (error) {
        console.warn('Error fetching recent files:', error);
        if (!cancelled) setRecentFiles([]);
      }
      if (!cancelled) setLoadingFiles(false);
    };

    // Separate lightweight stats fetch — runs in background, doesn't block UI
    const fetchStats = async () => {
      try {
        const statsSnapshot = await getDocs(collection(db, 'files'));
        if (cancelled) return;
        
        let notesCount = 0, pyqsCount = 0;
        const subjectsSet = new Set();
        const uploadersSet = new Set();

        statsSnapshot.docs.forEach(d => {
            const f = d.data();
            if (f.status !== 'approved') return;
            if (f.type === 'Notes') notesCount++;
            if (f.type === 'PYQ') pyqsCount++;
            if (f.subject) subjectsSet.add(f.subject);
            if (f.uploaderUID || f.uploader) uploadersSet.add(f.uploaderUID || f.uploader);
        });

        setPlatformStats({
            notes: notesCount > 0 ? notesCount : 1, 
            pyqs: pyqsCount > 0 ? pyqsCount : 1,
            subjects: subjectsSet.size > 0 ? subjectsSet.size : 5,
            students: uploadersSet.size > 0 ? uploadersSet.size * 2 : 10 
        });
      } catch (e) {
        console.warn('Stats fetch error:', e);
      }
    };

    const fetchLeaderboard = async () => {
        try {
            const q = query(collection(db, 'users'), orderBy('points', 'desc'), limit(4));
            const snapshot = await getDocs(q);
            if (cancelled) return;
            const users = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setTopContributors(users);
        } catch (e) {
            console.warn('Leaderboard error:', e);
        }
    };

    const fetchClubsCount = async () => {
        try {
            const snapshot = await getDocs(collection(db, 'clubs'));
            if (cancelled) return;
            setClubsCount(snapshot.size > 0 ? snapshot.size : 12);
        } catch (e) {
            setClubsCount(12);
        }
    };

    // Live news subscription
    let unsubNews;
    try {
        const newsQ = query(collection(db, 'news'), orderBy('timestamp', 'desc'), limit(5));
        unsubNews = onSnapshot(newsQ, (snapshot) => {
            if (cancelled) return;
            const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            if (data.length === 0) {
                setLatestNews([
                    { id: 'n1', title: 'Midterm Schedules Released', type: 'Urgent', timestamp: { toDate: () => new Date() } },
                    { id: 'n2', title: 'Annual Tech Symposium 2026', type: 'Event', timestamp: { toDate: () => new Date(Date.now() - 86400000) } },
                    { id: 'n3', title: 'Spring Career Fair — May 15th', type: 'Event', timestamp: { toDate: () => new Date(Date.now() - 86400000 * 3) } },
                ]);
            } else {
                setLatestNews(data);
            }
        });
    } catch (e) {
        setLatestNews([
            { id: 'n1', title: 'Midterm Schedules Released', type: 'Urgent' },
            { id: 'n2', title: 'Annual Tech Symposium 2026', type: 'Event' },
        ]);
    }

    // Community posts
    let unsubPosts;
    try {
        const postsQ = query(collection(db, 'posts'), orderBy('timestamp', 'desc'), limit(3));
        unsubPosts = onSnapshot(postsQ, (snapshot) => {
            if (cancelled) return;
            const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            if (data.length === 0) {
                setCommunityPosts([
                    { id: 'p1', authorName: 'Rahul Dev', content: '🚀 Just submitted my final year project — an AI-powered campus chatbot!', likes: ['u1','u2','u3','u4'], commentsCount: 7 },
                    { id: 'p2', authorName: 'Alice Johnson', content: 'Does anyone have the notes from yesterday\'s DSA lecture?', likes: ['u1','u2'], commentsCount: 3 },
                ]);
            } else {
                setCommunityPosts(data);
            }
        });
    } catch (e) {
        setCommunityPosts([]);
    }

    fetchRecent();
    fetchStats();
    fetchLeaderboard();
    fetchClubsCount();
    return () => {
        cancelled = true;
        if (unsubNews) unsubNews();
        if (unsubPosts) unsubPosts();
    };
  }, []);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (heroQuery.trim()) {
      router.push(`/subjects?q=${encodeURIComponent(heroQuery.trim())}`);
    }
  };

  const handleDownload = async (file) => {
    let url = file.fileURL || file.fileUrl;
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
      await awardDownloadPoints(file.id, file.uploaderUID, user?.uid);
      setRecentFiles(prev => prev.map(f => f.id === file.id ? { ...f, downloads: (f.downloads || 0) + 1 } : f));
    } catch (e) { console.warn('Could not update download count:', e.message); }

    let finalUrl = url;
    if (!url.includes('firebasestorage') && auth?.currentUser) {
      try {
        const idToken = await auth.currentUser.getIdToken();
        if (idToken) {
          finalUrl = `${url}?token=${encodeURIComponent(idToken)}`;
        }
      } catch (tokenErr) {
        console.warn('Failed to retrieve authentication token:', tokenErr);
      }
    }
    window.open(finalUrl, '_blank');
  };

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const formatNewsDate = (timestamp) => {
    if (!timestamp?.toDate) return 'Recently';
    const d = timestamp.toDate();
    const diff = Date.now() - d;
    if (diff < 3600000) return `${Math.max(1, Math.floor(diff / 60000))}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getNewsTypeColor = (type) => {
    switch (type) {
      case 'Urgent': return '#ef4444';
      case 'Event': return '#15803d';
      default: return '#dc2626';
    }
  };

  const getNewsTypeEmoji = (type) => {
    switch (type) {
      case 'Urgent': return '🚨';
      case 'Event': return '📅';
      default: return 'ℹ️';
    }
  };

  const userSubjects = user?.subjects || [];
  const userBranch = user?.branch || '';
  const userYear = user?.year || '';

  const recommended = userSubjects.length > 0
    ? recentFiles.filter(n =>
      userSubjects.some(s => n.subject?.toLowerCase().includes(s.toLowerCase())) ||
      n.branch === userBranch || n.year === userYear
    )
    : recentFiles;

  const displayFiles = recommended.length > 0 ? recommended : recentFiles;
  const sectionLabel = userSubjects.length > 0 && recommended.length > 0 ? '🎯 Recommended for You' : '📌 Recent Uploads';

  const rankEmojis = ['🥇', '🥈', '🥉', '🏅'];

  return (
    <>
      {/* ══════════════════════════════════════════════════ */}
      {/* ═══ HERO — IMMERSIVE LANDING ═══════════════════ */}
      {/* ══════════════════════════════════════════════════ */}
      <section className={styles.hero} ref={heroRef}>
        {/* Floating orbs */}
        {(branding.showHeroOrbs ?? true) && (
          <>
            <div className={styles.heroOrb1}></div>
            <div className={styles.heroOrb2}></div>
            <div className={styles.heroOrb3}></div>
          </>
        )}

        <div className={styles.heroInner}>
          <div className={styles.heroBadge}>
            <span className={styles.heroBadgeDot}></span>
            {branding.tagline}
          </div>

          <h1 className={styles.heroTitle}>
            <span className={styles.heroLine1}>{branding.collegeName}</span>
            <span className={styles.heroLine2}>
              <span className={styles.heroGradientText}>
                {branding.collegeShortName.split('').map((letter, i) => {
                  const activeLetterColors = theme === 'light' ? branding.letterColorsLight : branding.letterColors;
                  const color = activeLetterColors[i];
                  return (
                    <span
                      key={i}
                      style={color ? { color } : {}}
                    >
                      {letter}
                    </span>
                  );
                })}
              </span>
            </span>
          </h1>



          <form className={styles.heroSearchBar} onSubmit={handleHeroSearch}>
            <span className={styles.heroSearchIcon}>🔍</span>
            <input
              type="text"
              className={styles.heroSearchInput}
              placeholder={branding.heroPlaceholder || "Search for DBMS notes, DSA questions, Physics..."}
              value={heroQuery}
              onChange={(e) => setHeroQuery(e.target.value)}
              suppressHydrationWarning
            />
            <button type="submit" className={styles.heroSearchBtn} suppressHydrationWarning>
              Search
            </button>
          </form>


          {/* Floating stat pills */}
          <div className={styles.heroStatPills}>
            <div className={styles.heroPill}>
              <span className={styles.heroPillIcon}>📄</span>
              <span><CountUp end={platformStats.notes} suffix="+" /> Notes</span>
            </div>
            <div className={styles.heroPill}>
              <span className={styles.heroPillIcon}>👥</span>
              <span><CountUp end={platformStats.students} suffix="+" /> Students</span>
            </div>
            <div className={styles.heroPill}>
              <span className={styles.heroPillIcon}>🏢</span>
              <span><CountUp end={clubsCount} suffix="+" /> Clubs</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════ */}
      {/* ═══ QUICK ACCESS — FLOATING DOCK ════════════════ */}
      {/* ══════════════════════════════════════════════════ */}
      <section className={styles.dockSection}>
        <div className={styles.dockContainer}>
          {[
            { href: '/subjects', icon: <IconNotes size={26} />, label: 'Subjects', color: '#dc2626', desc: 'Faculty material' },
            { href: '/pyqs', icon: <IconPyq size={26} />, label: 'Exam Prep', color: '#16a34a', desc: 'PYQs & solutions' },
            { href: '/assignments', icon: <IconAssignment size={26} />, label: 'Assignments', color: '#22c55e', desc: 'Submissions' },
            { href: '/assistant', icon: null, emoji: '🤖', label: 'AI Tutor', color: '#b91c1c', desc: 'Doubt solving' },
            { href: '/community', icon: null, emoji: '💬', label: 'Discussions', color: '#15803d', desc: 'Peer support' },
            { href: '/news', icon: null, emoji: '📰', label: 'Notice Board', color: '#10b981', desc: 'Official updates' },
            { href: '/paper-analysis', icon: null, emoji: '🔍', label: 'Paper Analysis', color: '#f59e0b', desc: 'AI Insights' },
          ].map((item, i) => (
            <ScrollReveal key={item.href} delay={i * 60}>
              <Link href={item.href} className={styles.dockItem}>
                <div className={styles.dockIcon} style={{ background: `${item.color}18`, color: item.color }}>
                  {item.icon || <span style={{ fontSize: '1.4rem' }}>{item.emoji}</span>}
                </div>
                <span className={styles.dockLabel}>{item.label}</span>
                <span className={styles.dockDesc}>{item.desc}</span>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════ */}
      {/* ═══ LIVE NEWS TICKER ════════════════════════════ */}
      {/* ══════════════════════════════════════════════════ */}
      {latestNews.length > 0 && (
        <section className={styles.tickerSection}>
          <div className={styles.tickerBar}>
            <div className={styles.tickerLabel}>
              <span className={styles.tickerDot}></span>
              LIVE
            </div>
            <div className={styles.tickerTrack}>
              <div className={styles.tickerSlide}>
                {[...latestNews, ...latestNews].map((item, i) => (
                  <Link href="/news" key={`${item.id}-${i}`} className={styles.tickerItem}>
                    <span style={{ color: getNewsTypeColor(item.type) }}>{getNewsTypeEmoji(item.type)}</span>
                    <span>{item.title}</span>
                    <span className={styles.tickerTime}>{formatNewsDate(item.timestamp)}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}



      {/* ══════════════════════════════════════════════════ */}
      {/* ═══ RECENT UPLOADS / RECOMMENDED ════════════════ */}
      {/* ══════════════════════════════════════════════════ */}
      <section className={styles.uploadsSection}>
        <ScrollReveal>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{sectionLabel}</h2>
            <Link href="/subjects" className={styles.sectionLink}>View all →</Link>
          </div>
        </ScrollReveal>
        <div className={styles.uploadsGrid}>
          {loadingFiles ? (
            <>
              {[1,2,3].map(i => (
                <Skeleton key={i} variant="card" />
              ))}
            </>
          ) : displayFiles.length === 0 ? (
            <div className={styles.emptyGrid}>
              No approved uploads yet.
            </div>
          ) : (
            displayFiles.map((note, i) => (
              <ScrollReveal key={note.id} delay={i * 80}>
                <div className={styles.uploadCard}>
                  <div className={styles.uploadCardAccent} style={{
                    background: note.type === 'Notes' ? 'var(--primary)' : note.type === 'PYQ' ? 'var(--secondary)' : 'var(--accent)'
                  }}></div>
                  <div className={styles.uploadCardBody}>
                    <span className={`${styles.uploadType} ${getTypeClass(note.type)}`}>
                      {note.type}
                    </span>
                    <h3 className={styles.uploadTitle}>{note.title}</h3>
                    <div className={styles.uploadMeta}>
                      <span><IconUser /> {note.uploader}</span>
                      <span><IconFolder /> {note.subject}</span>
                      <span><IconHat /> {note.year}</span>
                    </div>
                    <div className={styles.uploadFooter}>
                      <div className={styles.uploadRating}>
                        <IconStar /> {note.rating > 0 ? note.rating : 'New'}
                      </div>
                      <button className={styles.downloadBtn} onClick={() => handleDownload(note)}>
                        <IconDownload size={16} /> Download
                      </button>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════ */}
      {/* ═══ ACADEMIC IMPACT & FACULTY SUPPORT ════════════ */}
      {/* ══════════════════════════════════════════════════ */}
      <section className={styles.whySection}>
        <ScrollReveal>
          <div className={styles.sectionHeader} style={{ justifyContent: 'center', textAlign: 'center', display: 'block' }}>
            <span className={styles.campusBadge}>Institutional Value</span>
            <h2 className={styles.sectionTitle}>Academic Impact & Consistency</h2>
            <p className={styles.campusSubtitle} style={{ margin: '0 auto', maxWidth: '700px', marginTop: '10px' }}>
              Sutraverse improves exam performance by reducing dependency on scattered WhatsApp materials and encouraging standardized, faculty-approved resources across all departments.
            </p>
          </div>
        </ScrollReveal>
        
        <div className={styles.whyGrid}>
          {[
            { emoji: '📊', title: 'Improves Performance', desc: 'Aims to increase pass percentage and consistency across batches with structured resources.' },
            { emoji: '🔐', title: 'Institutional Control', desc: 'College-controlled content, secure student login, and moderated uploads ensure data integrity.' },
            { emoji: '💼', title: 'Placement Readiness', desc: 'Supports career readiness by providing curated aptitude, coding resources, and interview prep.' }
          ].map((f, i) => (
            <ScrollReveal key={f.title} delay={i * 100}>
              <div className={styles.whyCard}>
                <div className={styles.whyEmoji}>{f.emoji}</div>
                <h3 className={styles.whyCardTitle}>{f.title}</h3>
                <p className={styles.whyCardDesc}>{f.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* How it supports faculty */}
        <ScrollReveal delay={100}>
          <div className={styles.facultySupportContainer}>
            <div className={styles.facultySupportHeader}>
              <h3>🎓 How Sutraverse Supports Faculty</h3>
              <p>Built in collaboration with educators to function as a seamless teaching assistant system.</p>
            </div>
            <div className={styles.processBar}>
              {[
                { step: '1', title: 'Manage Notes', desc: 'Upload and organize syllabus materials easily' },
                { step: '2', title: 'Digital Assignments', desc: 'Share and track assignment submissions securely' },
                { step: '3', title: 'Track Engagement', desc: 'Centralized communication and usage analytics per subject' },
              ].map((s, i) => (
                <div key={s.step} className={styles.processStep}>
                  <div className={styles.processNum}>{s.step}</div>
                  <div className={styles.processInfo}>
                    <div className={styles.processTitle}>{s.title}</div>
                    <div className={styles.processDesc}>{s.desc}</div>
                  </div>
                  {i < 2 && <div className={styles.processConnector}></div>}
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ══════════════════════════════════════════════════ */}
      {/* ═══ FUTURE VISION & ANALYTICS MOCKUP ════════════ */}
      {/* ══════════════════════════════════════════════════ */}
      <section className={styles.socialProofSection}>
        <ScrollReveal>
          <div className={styles.sectionHeader} style={{ justifyContent: 'center', textAlign: 'center', display: 'block', marginBottom: '2rem' }}>
            <span className={styles.campusBadge}>Scalability</span>
            <h2 className={styles.sectionTitle}>Future Vision & Analytics</h2>
            <p className={styles.campusSubtitle} style={{ margin: '0 auto', maxWidth: '700px', marginTop: '10px' }}>
              Sutraverse is designed to scale into a full-fledged LMS with advanced analytics, AI integration, and placement support.
            </p>
          </div>
        </ScrollReveal>
        
        <div className={styles.socialProofGrid}>
          {/* Future Scope / Roadmap */}
          <ScrollReveal delay={0}>
            <div className={styles.roadmapCard}>
              <div className={styles.leaderboardHeader}>
                <h3>🚀 Development Roadmap</h3>
                <span>Phase 2</span>
              </div>
              <div className={styles.roadmapList}>
                <div className={styles.roadmapItem}>
                  <div className={styles.roadmapIcon}>🤖</div>
                  <div className={styles.roadmapInfo}>
                    <h4>AI-Powered Doubt Solving</h4>
                    <p>Instant contextual answers from syllabus.</p>
                  </div>
                </div>
                <div className={styles.roadmapItem}>
                  <div className={styles.roadmapIcon}>📈</div>
                  <div className={styles.roadmapInfo}>
                    <h4>LMS & Attendance Integration</h4>
                    <p>Sync with existing college ERP systems.</p>
                  </div>
                </div>
                <div className={styles.roadmapItem}>
                  <div className={styles.roadmapIcon}>🌐</div>
                  <div className={styles.roadmapInfo}>
                    <h4>Alumni & Internship Portal</h4>
                    <p>Direct connect for job opportunities.</p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Analytics Mockup */}
          <ScrollReveal delay={100}>
            <div className={styles.analyticsMockupCard}>
              <div className={styles.analyticsHeader}>
                <h3>📊 Faculty Dashboard Preview</h3>
                <span className={styles.mockupBadge}>Coming Soon</span>
              </div>
              
              <div className={styles.statsInnerGrid} style={{ marginBottom: '16px' }}>
                <div className={styles.statCell}>
                  <div className={styles.statCellLabel}>Active Students</div>
                  <div className={styles.statCellNum} style={{ fontSize: '1.2rem' }}>842</div>
                </div>
                <div className={styles.statCell}>
                  <div className={styles.statCellLabel}>Resource Usage</div>
                  <div className={styles.statCellNum} style={{ fontSize: '1.2rem' }}>94%</div>
                </div>
                <div className={styles.statCell}>
                  <div className={styles.statCellLabel}>Avg. Engagement</div>
                  <div className={styles.statCellNum} style={{ fontSize: '1.2rem' }}>4.2 hrs</div>
                </div>
              </div>

              <div className={styles.mockupChart}>
                <div className={styles.chartBar} style={{ height: '40%' }}></div>
                <div className={styles.chartBar} style={{ height: '70%' }}></div>
                <div className={styles.chartBar} style={{ height: '50%' }}></div>
                <div className={styles.chartBar} style={{ height: '90%', background: 'var(--primary)' }}></div>
                <div className={styles.chartBar} style={{ height: '60%' }}></div>
                <div className={styles.chartBar} style={{ height: '85%' }}></div>
              </div>
              <p className={styles.chartLabel}>Weekly Subject-wise Engagement</p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════ */}
      {/* ═══ CTA BANNER ═════════════════════════════════ */}
      {/* ══════════════════════════════════════════════════ */}
      <section className={styles.ctaSection}>
        <ScrollReveal>
          <div className={styles.ctaCard}>
            <div className={styles.ctaOrb}></div>
            <div className={styles.ctaContent}>
              <h2 className={styles.ctaTitle}>Partner With Us</h2>
              <p className={styles.ctaDesc}>
                Seeking institutional support to scale Sutraverse across all departments at {branding.collegeShortName}. <br/><br/>
                <strong style={{color: 'var(--primary)', fontWeight: '800'}}>Sutraverse can evolve into {branding.collegeShortName}’s official academic digital platform.</strong>
              </p>
              <div className={styles.ctaActions}>
                <Link href={branding.ctaPilotLink || `mailto:admin@${branding.collegeShortName?.toLowerCase() || 'sutraverse'}.edu`} className={styles.ctaBtnPrimary}>
                  {branding.ctaPilotText || 'Pilot Implementation'}
                </Link>
                <Link href={branding.ctaFacultyLink || '/about'} className={styles.ctaBtnSecondary}>
                  {branding.ctaFacultyText || 'Faculty Onboarding'}
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ══════════════════════════════════════════════════ */}
      {/* ═══ FOOTER ═════════════════════════════════════ */}
      {/* ══════════════════════════════════════════════════ */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerTop}>
            <div className={styles.footerBrand}>
              <span className={styles.footerLogo}>📚 Sutraverse</span>
              <p className={styles.footerTagline}>Digital Academic Ecosystem for {branding.collegeShortName}</p>
            </div>
            <div className={styles.footerColumns}>
              <div className={styles.footerCol}>
                <h4>Resources</h4>
                <Link href="/subjects">Subjects</Link>
                <Link href="/pyqs">PYQs</Link>
                <Link href="/assignments">Assignments</Link>
                <Link href="/subjects">Subjects</Link>
              </div>
              <div className={styles.footerCol}>
                <h4>Campus</h4>
                <Link href="/community">Community</Link>
                <Link href="/clubs">Clubs</Link>
                <Link href="/news">News</Link>
                <Link href="/exam-mode">Exam Mode</Link>
              </div>
              <div className={styles.footerCol}>
                <h4>Legal</h4>
                <Link href="/privacy-policy">Privacy Policy</Link>
                <Link href="/terms-of-service">Terms of Service</Link>
                <Link href="/cookie-policy">Cookie Policy</Link>
              </div>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <span>© 2026 Sutraverse. All rights reserved.</span>
            
            {branding.socials && Object.values(branding.socials).some(link => link) && (
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                {branding.socials.linkedin && (
                  <a href={branding.socials.linkedin} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', textDecoration: 'none', color: 'var(--text-secondary)' }} title="LinkedIn">🔗 LinkedIn</a>
                )}
                {branding.socials.instagram && (
                  <a href={branding.socials.instagram} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', textDecoration: 'none', color: 'var(--text-secondary)' }} title="Instagram">📸 Instagram</a>
                )}
                {branding.socials.github && (
                  <a href={branding.socials.github} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', textDecoration: 'none', color: 'var(--text-secondary)' }} title="GitHub">💻 GitHub</a>
                )}
                {branding.socials.youtube && (
                  <a href={branding.socials.youtube} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', textDecoration: 'none', color: 'var(--text-secondary)' }} title="YouTube">▶️ YouTube</a>
                )}
              </div>
            )}

            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
              <a href={branding.developedByLink || "https://krushnasaruk.in"} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-primary)', fontWeight: '700', textDecoration: 'none' }}>
                Developed by {branding.developedByName || "Krushna Saruk"}
              </a>
              {branding.supportPhone && (
                <span style={{ color: 'var(--text-muted)' }}>Contact: {branding.supportPhone}</span>
              )}
              {branding.supportEmail && (
                <span style={{ color: 'var(--text-muted)' }}>Email: {branding.supportEmail}</span>
              )}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
