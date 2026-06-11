#!/bin/bash

# Reset any currently staged changes to start fresh
git reset

# Commit 1: Security & Rules Config
git add firestore.rules storage.rules SECURITY.md 2>/dev/null || true
git commit --allow-empty -m "feat(security): update rules and security policy"

# Commit 2: Firebase Client Setup
git add src/lib/firebase.js 2>/dev/null || true
git commit --allow-empty -m "refactor(firebase): add logging levels and client configuration"

# Commit 3: Firebase Admin Setup
git add src/lib/firebaseAdmin.js 2>/dev/null || true
git commit --allow-empty -m "feat(firebase): add admin sdk initialize configuration"

# Commit 4: Core Contexts
git add src/context/CollegeContext.js src/context/ThemeContext.js 2>/dev/null || true
git commit --allow-empty -m "feat(context): update college context and theme provider"

# Commit 5: Navbar Component
git add src/components/Navbar/Navbar.js src/components/Navbar/Navbar.module.css 2>/dev/null || true
git commit --allow-empty -m "feat(navbar): update navbar layout and module styles"

# Commit 6: Layout & Navigation
git add src/app/layout.js src/components/MobileNav/MobileNav.js 2>/dev/null || true
git commit --allow-empty -m "refactor(layout): clean layout definitions and mobile navigation"

# Commit 7: Global Styles
git add src/app/globals.css src/app/mobile.css src/app/performance.css 2>/dev/null || true
git commit --allow-empty -m "style(theme): update globals, mobile overrides, and performance modes"

# Commit 8: Landing Page
git add src/app/page.js src/components/Animations.js 2>/dev/null || true
git commit --allow-empty -m "feat(landing): refresh home page layout and scroll reveal logic"

# Commit 9: Announcement Banner
git add src/components/AnnouncementBanner/ 2>/dev/null || true
git commit --allow-empty -m "feat(announcements): add campus notices banner component"

# Commit 10: Maintenance Guard
git add src/components/MaintenanceGuard/ 2>/dev/null || true
git commit --allow-empty -m "feat(maintenance): add maintenance window protective guard"

# Commit 11: Admin Portal
git add src/app/admin/page.js src/app/admin/page.module.css 2>/dev/null || true
git commit --allow-empty -m "feat(admin): design adjustments on the admin workspace panel"

# Commit 12: File Transfers API
git add src/app/api/upload/route.js "src/app/api/downloads/[...filepath]/route.js" 2>/dev/null || true
git commit --allow-empty -m "feat(api): optimize direct streaming and fallback directory traversal paths"

# Commit 13: Student Dashboard
git add src/app/dashboard/page.js src/app/dashboard/page.module.css 2>/dev/null || true
git commit --allow-empty -m "feat(dashboard): updates to face tracking, attendance geolocation and grades"

# Commit 14: Assignments & PYQs
git add src/app/assignments/page.module.css src/app/pyqs/page.module.css 2>/dev/null || true
git commit --allow-empty -m "style(archive): fix sidebar navigation lists and mobile layout scales"

# Commit 15: Academics & Media Modules
git add src/app/subjects/page.module.css src/app/youtube/page.module.css src/app/exam-mode/page.module.css src/app/upload/page.js 2>/dev/null || true
git commit --allow-empty -m "style(subjects): adjust layout for lists, tutorials, and upload pages"

# Commit 16: Profile, Deployment & Push Script
git add "src/app/profile/[id]/page.js" "src/app/profile/[id]/page.module.css" .github/workflows/deploy.yml pack-cpanel.js pack.js src/proxy.js push_16_commits.sh 2>/dev/null || true
git commit --allow-empty -m "chore(deploy): script cleans, deploy workflows, profiles, and automation"

# Push all commits to remote origin main
echo "Pushing all 16 commits to origin main..."
git push origin main
