import './globals.css';
import './mobile.css';
import './performance.css';
import Script from 'next/script';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { CollegeProvider } from '@/context/CollegeContext';
import Navbar from '@/components/Navbar/Navbar';
import MobileNav from '@/components/MobileNav/MobileNav';
import CookieConsent from '@/components/CookieConsent';
import GlobalBot from '@/components/GlobalBot/GlobalBot';

export const metadata = {
  title: 'SutraVerse — Digital Notes Hub',
  description: 'Find notes, PYQs, assignments, and ace your exams with a sleek platform built for modern students.',
  keywords: 'notes, pyqs, assignments, college, exam prep, study material, sutraverse, futuristic',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
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
              <Navbar />
              <main>{children}</main>
              <MobileNav />
              <CookieConsent />
              <GlobalBot />
            </AuthProvider>
          </CollegeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

