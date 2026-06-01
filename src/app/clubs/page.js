'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { ScrollReveal } from '@/components/Animations';
import styles from './page.module.css';


const CATEGORIES = ['All', 'Tech', 'Engineering', 'Arts & Media', 'Academic', 'Business', 'Sports', 'Social'];

const CATEGORY_META = {
    Tech: { emoji: '💻', color: '#dc2626' },
    Engineering: { emoji: '⚙️', color: '#f59e0b' },
    'Arts & Media': { emoji: '🎨', color: '#22c55e' },
    Academic: { emoji: '📚', color: '#10b981' },
    Business: { emoji: '💼', color: '#b91c1c' },
    Sports: { emoji: '⚽', color: '#22c55e' },
    Social: { emoji: '🤝', color: '#f97316' },
};

const QUIZ_QUESTIONS = [
    {
        question: "What's your ultimate weekend activity?",
        options: [
            { text: "💻 Diving into a hackathon or coding custom scripts", weights: { Tech: 3, Engineering: 2 } },
            { text: "🎨 Visiting art galleries, photography, or practicing an instrument", weights: { 'Arts & Media': 3 } },
            { text: "⚽ Hiking, cycling, or playing outdoor sports with a crew", weights: { Sports: 3, Social: 2 } },
            { text: "📚 Curling up with an insightful book or research paper", weights: { Academic: 3, 'Arts & Media': 1 } }
        ]
    },
    {
        question: "If you could master any superpower, what would it be?",
        options: [
            { text: "⚡ Manipulating technology and networks directly", weights: { Tech: 3, Engineering: 3 } },
            { text: "👁️ Mind-reading and absolute persuasion", weights: { Business: 3, Social: 2 } },
            { text: "⏳ Time-travel to explore deep history and future sciences", weights: { Academic: 3 } },
            { text: "✨ Creating anything out of pure imagination", weights: { 'Arts & Media': 3 } }
        ]
    },
    {
        question: "What is your primary goal this academic semester?",
        options: [
            { text: "🚀 Building cool applications and a solid tech portfolio", weights: { Tech: 3, Engineering: 3 } },
            { text: "🤝 Networking and forming unforgettable lifelong bonds", weights: { Social: 3, Business: 2 } },
            { text: "📖 Excelling in coursework and theoretical projects", weights: { Academic: 3 } },
            { text: "🏃 Maintaining peak physical health and energy levels", weights: { Sports: 3 } }
        ]
    },
    {
        question: "Which workspace aesthetic inspires you most?",
        options: [
            { text: "🖥️ Quad-monitor desk setup in complete dark mode with RGB", weights: { Tech: 3, Engineering: 2 } },
            { text: "🌿 Sunlit studio overflowing with canvases and instruments", weights: { 'Arts & Media': 3 } },
            { text: "🏛️ Quiet library alcove lined with vintage leather encyclopedias", weights: { Academic: 3 } },
            { text: "☕ A busy glass-walled board room or active coffee house", weights: { Business: 3, Social: 2 } }
        ]
    },
    {
        question: "How do you naturally contribute in team projects?",
        options: [
            { text: "📣 Managing timelines, pitching slides, and leading the team", weights: { Business: 3, Social: 3 } },
            { text: "🛠️ Coding the core system, database, or mechanical blueprint", weights: { Tech: 3, Engineering: 3 } },
            { text: "🎨 Creating eye-catching visuals, editing media, and layouts", weights: { 'Arts & Media': 3 } },
            { text: "🔍 Fact-checking, structural reviews, and editing references", weights: { Academic: 3 } }
        ]
    }
];

export default function ClubsPage() {
    const { user } = useAuth();
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [spotlightEvents, setSpotlightEvents] = useState([]);

    // Matchmaker states
    const [showQuiz, setShowQuiz] = useState(false);
    const [quizStep, setQuizStep] = useState(0);
    const [quizScores, setQuizScores] = useState({
        Tech: 0, Engineering: 0, 'Arts & Media': 0, Academic: 0, Business: 0, Sports: 0, Social: 0
    });
    const [quizRecommendations, setQuizRecommendations] = useState([]);

    const handleQuizAnswer = (weights) => {
        const updatedScores = { ...quizScores };
        Object.entries(weights).forEach(([cat, val]) => {
            updatedScores[cat] = (updatedScores[cat] || 0) + val;
        });
        setQuizScores(updatedScores);

        if (quizStep < QUIZ_QUESTIONS.length - 1) {
            setQuizStep(prev => prev + 1);
        } else {
            const recommendations = clubs.map(club => {
                const clubCat = club.category || 'General';
                const rawScore = updatedScores[clubCat] || 0;
                const matchPct = Math.min(98, Math.max(45, Math.round((rawScore / 12) * 100)));
                return {
                    ...club,
                    matchPercentage: matchPct
                };
            });
            recommendations.sort((a, b) => b.matchPercentage - a.matchPercentage);
            setQuizRecommendations(recommendations.slice(0, 3));
            setQuizStep(QUIZ_QUESTIONS.length);
        }
    };

    const resetQuiz = () => {
        setQuizStep(0);
        setQuizScores({
            Tech: 0, Engineering: 0, 'Arts & Media': 0, Academic: 0, Business: 0, Sports: 0, Social: 0
        });
        setQuizRecommendations([]);
        setShowQuiz(false);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Clubs
                const snapshot = await getDocs(collection(db, 'clubs'));
                let clubsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                clubsData = clubsData.filter(c => c.status === 'approved' || !c.status || c.adminId === user?.uid);
                setClubs(clubsData);

                // Fetch Events
                const now = new Date();
                const eventsSnap = await getDocs(collection(db, 'clubEvents'));
                const evts = eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                const upcoming = evts.filter(e => {
                    const dateObj = e.date?.toDate ? e.date.toDate() : new Date(e.date);
                    return dateObj >= now;
                });
                upcoming.sort((a, b) => {
                    const dateA = a.date?.toDate ? a.date.toDate().getTime() : new Date(a.date).getTime();
                    const dateB = b.date?.toDate ? b.date.toDate().getTime() : new Date(b.date).getTime();
                    return dateA - dateB;
                });
                setSpotlightEvents(upcoming.slice(0, 5));
            } catch (error) {
                console.error('Error fetching clubs/events', error);
                setClubs([]);
                setSpotlightEvents([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    const filteredClubs = useMemo(() => {
        let result = clubs;
        if (activeCategory !== 'All') {
            result = result.filter(c => c.category === activeCategory);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(c =>
                c.name.toLowerCase().includes(q) ||
                c.description.toLowerCase().includes(q) ||
                c.category?.toLowerCase().includes(q) ||
                c.tags?.some(t => t.toLowerCase().includes(q))
            );
        }
        return result;
    }, [clubs, activeCategory, searchQuery]);

    const featuredClubs = useMemo(() => clubs.filter(c => c.featured), [clubs]);

    const stats = useMemo(() => ({
        total: clubs.length,
        members: clubs.reduce((sum, c) => sum + (c.membersCount || c.members?.length || 0), 0),
        categories: new Set(clubs.map(c => c.category)).size,
    }), [clubs]);

    if (loading) return (
        <div className={styles.loadingWrapper}>
            <div className={styles.loadingOrb}></div>
            <p className={styles.loadingText}>Loading clubs...</p>
        </div>
    );

    return (
        <div className={styles.pageWrapper}>
            {/* Ambient background orbs */}
            <div className={styles.bgOrb1}></div>
            <div className={styles.bgOrb2}></div>
            <div className={styles.bgOrb3}></div>

            <div className={styles.container}>

                {/* ── HERO HEADER ── */}
                <ScrollReveal>
                    <div className={styles.heroSection}>
                        <div className={styles.heroBadge}>
                            <span className={styles.heroBadgeDot}></span>
                            {clubs.length} Active Clubs on Campus
                        </div>
                        <h1 className={styles.heroTitle}>
                            Find Your <span className={styles.heroAccent}>Tribe.</span>
                        </h1>
                        <p className={styles.heroSubtitle}>
                            Discover student clubs, join communities, attend events, and build friendships that last beyond graduation.
                        </p>

                        {/* Stats strip */}
                        <div className={styles.statsStrip}>
                            <div className={styles.statPill}>
                                <span className={styles.statNum}>{stats.total}</span>
                                <span className={styles.statLbl}>Clubs</span>
                            </div>
                            <div className={styles.statDivider}></div>
                            <div className={styles.statPill}>
                                <span className={styles.statNum}>{stats.members.toLocaleString()}+</span>
                                <span className={styles.statLbl}>Members</span>
                            </div>
                            <div className={styles.statDivider}></div>
                            <div className={styles.statPill}>
                                <span className={styles.statNum}>{stats.categories}</span>
                                <span className={styles.statLbl}>Categories</span>
                            </div>
                        </div>
                    </div>
                </ScrollReveal>

                {/* ── CAMPUS SPOTLIGHT: UPCOMING EVENTS ── */}
                {spotlightEvents.length > 0 && (
                    <ScrollReveal delay={120}>
                        <div className={styles.spotlightSection}>
                            <div className={styles.sectionLabel}>⚡ Campus Spotlight: Upcoming Events</div>
                            <div className={styles.spotlightTrack}>
                                {spotlightEvents.map((evt, i) => {
                                    const eventDateStr = evt.date?.toDate
                                        ? evt.date.toDate().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                                        : new Date(evt.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                                    
                                    const eventTimeStr = evt.date?.toDate
                                        ? evt.date.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                                        : new Date(evt.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                                    return (
                                        <Link
                                            key={evt.id}
                                            href={`/clubs/${evt.clubId}?tab=events`}
                                            className={styles.spotlightCard}
                                            style={{ '--accent-gradient': evt.coverGradient || 'var(--gradient-brand)' }}
                                        >
                                            <div className={styles.spotlightCardHeader} style={{ background: evt.coverGradient }}>
                                                <span className={styles.spotlightClubEmoji}>{evt.clubEmoji || '🎓'}</span>
                                                <span className={styles.spotlightDatePill}>{eventDateStr}</span>
                                            </div>
                                            <div className={styles.spotlightCardBody}>
                                                <div className={styles.spotlightClubName}>{evt.clubName}</div>
                                                <h3 className={styles.spotlightEventTitle}>{evt.title}</h3>
                                                <div className={styles.spotlightMetaRow}>
                                                    <span>🕒 {eventTimeStr}</span>
                                                    <span>📍 {evt.venue}</span>
                                                </div>
                                                <div className={styles.spotlightRSVPBadge}>
                                                    🔥 {evt.attendeeCount || 0} attending
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </ScrollReveal>
                )}

                {/* ── FEATURED CLUBS SPOTLIGHT ── */}
                {featuredClubs.length > 0 && (
                    <ScrollReveal delay={100}>
                        <div className={styles.featuredSection}>
                            <div className={styles.sectionLabel}>⚡ Featured Clubs</div>
                            <div className={styles.featuredGrid}>
                                {featuredClubs.map((club, i) => (
                                    <Link
                                        key={club.id}
                                        href={`/clubs/${club.id}`}
                                        className={styles.featuredCard}
                                        style={{ animationDelay: `${i * 100}ms` }}
                                    >
                                        <div className={styles.featuredCardBg} style={{ background: club.gradient }}></div>
                                        <div className={styles.featuredCardInner}>
                                            <div className={styles.featuredEmoji}>{club.emoji}</div>
                                            <div className={styles.featuredBadge}>Featured</div>
                                            <div className={styles.featuredCategory}>{club.category}</div>
                                            <h2 className={styles.featuredName}>{club.name}</h2>
                                            <p className={styles.featuredDesc}>{club.description.slice(0, 100)}...</p>
                                            <div className={styles.featuredMeta}>
                                                <span className={styles.featuredMembers}>👥 {club.membersCount} members</span>
                                                {club.upcomingEvent && (
                                                    <span className={styles.featuredEvent}>📅 {club.upcomingEvent}</span>
                                                )}
                                            </div>
                                            <div className={styles.featuredTags}>
                                                {club.tags?.slice(0, 3).map(tag => (
                                                    <span key={tag} className={styles.featuredTag}>{tag}</span>
                                                ))}
                                            </div>
                                            <div className={styles.featuredCTA}>
                                                Explore Club <span className={styles.featuredArrow}>→</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </ScrollReveal>
                )}

                {/* ── SEARCH + FILTER BAR ── */}
                <ScrollReveal delay={150}>
                    <div className={styles.controlBar}>
                        <div className={styles.searchBox}>
                            <span className={styles.searchIcon}>🔍</span>
                            <input
                                type="text"
                                className={styles.searchInput}
                                placeholder="Search clubs, tags, categories..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button className={styles.searchClear} onClick={() => setSearchQuery('')}>✕</button>
                            )}
                        </div>

                        {user && (
                            <Link href="/clubs/create" className={styles.createBtn}>
                                <span>+</span> Start a Club
                            </Link>
                        )}
                    </div>
                </ScrollReveal>

                {/* ── CATEGORY FILTERS ── */}
                <ScrollReveal delay={200}>
                    <div className={styles.categoryBar}>
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                className={`${styles.catChip} ${activeCategory === cat ? styles.catChipActive : ''}`}
                                onClick={() => setActiveCategory(cat)}
                            >
                                {cat !== 'All' && CATEGORY_META[cat]?.emoji} {cat}
                            </button>
                        ))}
                    </div>
                </ScrollReveal>

                {/* ── RESULTS COUNT ── */}
                <div className={styles.resultsRow}>
                    <span className={styles.resultsCount}>
                        {filteredClubs.length} {filteredClubs.length === 1 ? 'club' : 'clubs'} found
                        {activeCategory !== 'All' && ` in ${activeCategory}`}
                        {searchQuery && ` for "${searchQuery}"`}
                    </span>
                </div>

                {/* ── CLUBS GRID ── */}
                {filteredClubs.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyEmoji}>🔍</div>
                        <h3 className={styles.emptyTitle}>No clubs found</h3>
                        <p className={styles.emptyDesc}>Try a different search or category filter.</p>
                        <button className={styles.emptyReset} onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}>
                            Reset Filters
                        </button>
                    </div>
                ) : (
                    <div className={styles.clubsGrid}>
                        {filteredClubs.map((club, i) => (
                            <Link
                                key={club.id}
                                href={`/clubs/${club.id}`}
                                className={styles.clubCard}
                                style={{ animationDelay: `${(i % 6) * 60}ms`, '--card-color': club.color || '#dc2626' }}
                            >
                                {/* Card glow top strip */}
                                <div className={styles.cardTopStrip} style={{ background: club.gradient || 'var(--gradient-brand)' }}></div>

                                <div className={styles.cardBody}>
                                    {/* Header row */}
                                    <div className={styles.cardHeader}>
                                        <div className={styles.clubEmojiWrap} style={{ background: club.gradient }}>
                                            <span className={styles.clubEmoji}>{club.emoji || club.name.charAt(0)}</span>
                                        </div>
                                        <div className={styles.cardHeaderRight}>
                                            <span className={styles.catTag}>
                                                {club.category || 'General'}
                                            </span>
                                            <span className={styles.activeLabel}>
                                                <span className={styles.activeDot}></span>
                                                {club.lastActive || 'Active'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Club name & desc */}
                                    <h3 className={styles.clubName}>{club.name}</h3>
                                    <p className={styles.clubDesc}>{club.description}</p>

                                    {/* Tags */}
                                    {club.tags && (
                                        <div className={styles.tagRow}>
                                            {club.tags.slice(0, 3).map(tag => (
                                                <span key={tag} className={styles.tag}>{tag}</span>
                                            ))}
                                            {club.tags.length > 3 && <span className={styles.tagMore}>+{club.tags.length - 3}</span>}
                                        </div>
                                    )}

                                    {/* Upcoming event */}
                                    {club.upcomingEvent && (
                                        <div className={styles.upcomingEvent}>
                                            <span className={styles.upcomingIcon}>📅</span>
                                            <span className={styles.upcomingText}>{club.upcomingEvent}</span>
                                        </div>
                                    )}

                                    {/* Footer */}
                                    <div className={styles.cardFooter}>
                                        <div className={styles.memberStack}>
                                            {[...Array(Math.min(3, club.members?.length || 0))].map((_, j) => (
                                                <div key={j} className={styles.memberBubble} style={{ background: club.gradient, left: `${j * 18}px` }}></div>
                                            ))}
                                            <span className={styles.memberCountText} style={{ marginLeft: `${Math.min(3, club.members?.length || 0) * 18 + 8}px` }}>
                                                👥 {club.membersCount || club.members?.length || 0} members
                                            </span>
                                        </div>
                                        <span className={styles.viewBtn}>View →</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* ── MATCHMAKER FLOATING ORB ── */}
            <button
                className={styles.matchmakerOrb}
                onClick={() => setShowQuiz(true)}
                title="Find Your Tribe: Matchmaker Quiz"
            >
                🎯 Find Your Tribe
            </button>

            {/* ── MATCHMAKER FULLSCREEN MODAL OVERLAY ── */}
            {showQuiz && (
                <div className={styles.quizOverlay}>
                    <div className={styles.quizCard}>
                        {/* Quiz Header */}
                        <div className={styles.quizHeader}>
                            <h2>🎯 Club Matchmaker Quiz</h2>
                            <button className={styles.quizCloseBtn} onClick={resetQuiz}>✕</button>
                        </div>

                        {/* Steps / Progress */}
                        {quizStep < QUIZ_QUESTIONS.length ? (
                            <>
                                <div className={styles.quizProgressBar}>
                                    <div
                                        className={styles.quizProgressFill}
                                        style={{ width: `${((quizStep + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
                                    />
                                </div>
                                <div className={styles.quizStepIndicator}>
                                    Question {quizStep + 1} of {QUIZ_QUESTIONS.length}
                                </div>

                                {/* Active Question Card */}
                                <div className={styles.quizQuestionContainer}>
                                    <h3 className={styles.quizQuestionText}>
                                        {QUIZ_QUESTIONS[quizStep].question}
                                    </h3>
                                    <div className={styles.quizOptionsGrid}>
                                        {QUIZ_QUESTIONS[quizStep].options.map((opt, i) => (
                                            <button
                                                key={opt.text}
                                                className={styles.quizOptionCard}
                                                onClick={() => handleQuizAnswer(opt.weights)}
                                                style={{ animationDelay: `${i * 80}ms` }}
                                            >
                                                {opt.text}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* Recommendations Results page */
                            <div className={styles.quizResults}>
                                <div className={styles.celebrationIcon}>🎉</div>
                                <h3 className={styles.resultsTitle}>We found your Tribe!</h3>
                                <p className={styles.resultsSubtitle}>
                                    Based on your answers, these top 3 campus clubs align perfectly with your interests and personality.
                                </p>

                                <div className={styles.quizResultsGrid}>
                                    {quizRecommendations.map((rec, i) => (
                                        <Link
                                            key={rec.id}
                                            href={`/clubs/${rec.id}`}
                                            className={styles.recClubCard}
                                            style={{ animationDelay: `${i * 120}ms` }}
                                            onClick={resetQuiz}
                                        >
                                            <div className={styles.recBadgeRow}>
                                                <span className={styles.recMatchPct}>
                                                    🔥 {rec.matchPercentage}% Match
                                                </span>
                                                <span className={styles.recClubCategory}>
                                                    {rec.category}
                                                </span>
                                            </div>
                                            <div className={styles.recClubInfo}>
                                                <span className={styles.recClubEmoji}>
                                                    {rec.emoji || '🎓'}
                                                </span>
                                                <div style={{ flex: 1 }}>
                                                    <h4 className={styles.recClubName}>{rec.name}</h4>
                                                    <p className={styles.recClubDesc}>{rec.description}</p>
                                                </div>
                                            </div>
                                            <div className={styles.recClubCTA}>
                                                Explore Club Community →
                                            </div>
                                        </Link>
                                    ))}
                                </div>

                                <button className={styles.quizRetryBtn} onClick={resetQuiz}>
                                    🔄 Retake Quiz
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
