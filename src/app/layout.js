import './globals.css';
import './mobile.css';
import './performance.css';
import Script from 'next/script';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { CollegeProvider } from '@/context/CollegeContext';
import Navbar from '@/components/Navbar/Navbar';
import AnnouncementBanner from '@/components/AnnouncementBanner/AnnouncementBanner';
import MaintenanceGuard from '@/components/MaintenanceGuard/MaintenanceGuard';
import MobileNav from '@/components/MobileNav/MobileNav';
import CookieConsent from '@/components/CookieConsent';
import GlobalBot from '@/components/GlobalBot/GlobalBot';
import GlobalEngagements from '@/components/GlobalEngagements/GlobalEngagements';
import { adminDb } from '@/lib/firebaseAdmin';

export async function generateMetadata() {
  let title = 'SutraVerse — Digital Notes Hub';
  let description = 'Find notes, PYQs, assignments, and ace your exams with a sleek platform built for modern students.';
  
  try {
    const snap = await adminDb.collection('settings').doc('college').get();
    if (snap.exists) {
      const data = snap.data();
      if (data.platformName) {
        title = `${data.platformName} — Digital Notes Hub`;
      } else if (data.collegeName) {
        title = `${data.collegeName} — Digital Notes Hub`;
      }
      if (data.seoMetaDescription) {
        description = data.seoMetaDescription;
      }
    }
  } catch (e) {
    console.warn('Metadata fetch failed:', e.message);
  }

  return {
    title,
    description,
    keywords: 'notes, pyqs, assignments, college, exam prep, study material, sutraverse, futuristic',
  };
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        {/* Anti-Flash Theme Injector */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var branding = localStorage.getItem('sutra_college_branding');
                var root = document.documentElement;
                
                if (branding) {
                  var colors = JSON.parse(branding);
                  root.style.setProperty('--primary', colors.primary);
                  root.style.setProperty('--secondary', colors.secondary);
                  root.style.setProperty('--primary-glow', colors.glow);
                  if (colors.light) root.style.setProperty('--primary-light', colors.light);
                  if (colors.dark) root.style.setProperty('--primary-dark', colors.dark);
                }
              } catch (e) {}
            })();
          `
        }} />
        {/* Google AdSense — Replace ca-pub-XXXXXXXXXXXXXXXX with your real publisher ID */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
      </head>
      <body>
        <ThemeProvider>
          <CollegeProvider>
            <AuthProvider>
              <MaintenanceGuard>
                <Navbar />
                <AnnouncementBanner />
                <main>{children}</main>
                <MobileNav />
                <CookieConsent />
                <GlobalBot />
                <GlobalEngagements />
              </MaintenanceGuard>
            </AuthProvider>
          </CollegeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

