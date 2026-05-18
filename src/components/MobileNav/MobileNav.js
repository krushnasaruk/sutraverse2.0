'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from './MobileNav.module.css';

/* ── SVG Icons for Mobile Nav ── */
const HomeIcon = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const PlayIcon = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);

const AIIcon = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a4 4 0 0 1 4 4v1h1a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3h-1v3a4 4 0 0 1-8 0v-3H7a3 3 0 0 1-3-3v-2a3 3 0 0 1 3-3h1V6a4 4 0 0 1 4-4z"/>
    <circle cx="9" cy="10" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r="1" fill="currentColor" stroke="none"/>
  </svg>
);

const CommunityIcon = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
  </svg>
);

const UploadIcon = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const navItems = [
  { href: '/', label: 'Home', Icon: HomeIcon },
  { href: '/subjects', label: 'Subjects', Icon: PlayIcon },
  { href: '/upload', label: 'Upload', Icon: UploadIcon, special: true },
  { href: '/assistant', label: 'AI Tutor', Icon: AIIcon },
  { href: '/community', label: 'Community', Icon: CommunityIcon },
];

export default function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Don't show on login/signup pages
  if (pathname === '/login' || pathname === '/signup') return null;

  const isAdmin = user && (user.isAdmin || ['sutraverse11@gmail.com'].includes(user.email));

  const isActive = (href) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav className={styles.mobileNav}>
      <div className={styles.mobileNavInner}>
        {navItems.map((item) => {
          const active = isActive(item.href);
          const { Icon } = item;
          return (
            <Link
              key={item.href}
              href={item.special && !user ? '/login' : item.href}
              className={`${styles.navItem} ${active ? styles.navItemActive : ''} ${item.special ? styles.navItemSpecial : ''}`}
            >
              {item.special ? (
                <div className={styles.uploadBubble}>
                  <span className={styles.navIcon}><Icon active={active} /></span>
                </div>
              ) : (
                <span className={styles.navIcon}><Icon active={active} /></span>
              )}
              <span className={styles.navLabel}>{item.label}</span>
              {active && !item.special && <span className={styles.activeDot} />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
