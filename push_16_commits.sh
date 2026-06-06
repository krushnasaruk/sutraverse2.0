#!/bin/bash
set -e

# Commit 1
git add public/logo.png mobile/assets/images/logo.png
git commit --allow-empty -m "feat: add application logos"

# Commit 2
git add src/app/icon.png src/app/apple-icon.png
git commit --allow-empty -m "chore: update app icons"

# Commit 3
git rm --ignore-unmatch src/app/favicon.ico
git commit --allow-empty -m "chore: remove old favicon"

# Commit 4
git add src/app/layout.js
git commit --allow-empty -m "refactor: update main layout"

# Commit 5
git add src/components/Navbar/Navbar.js src/components/Navbar/Navbar.module.css
git commit --allow-empty -m "feat: update Navbar component and styles"

# Commit 6
git add src/app/page.js
git commit --allow-empty -m "feat: update landing page"

# Commit 7
git add src/app/community/page.js src/app/community/page.module.css
git commit --allow-empty -m "feat: update community page"

# Commit 8
git add src/app/clubs/page.js src/app/clubs/manage/page.js
git commit --allow-empty -m "feat: update clubs and manage clubs pages"

# Commit 9
git add src/app/youtube/page.js src/app/youtube/page.module.css
git commit --allow-empty -m "feat: update youtube section"

# Commit 10
git add src/app/news/page.js
git commit --allow-empty -m "feat: update news page"

# Commit 11
git add src/app/assignments/page.js
git commit --allow-empty -m "feat: update assignments page"

# Commit 12
git add src/app/pyqs/page.js
git commit --allow-empty -m "feat: update previous year questions page"

# Commit 13
git add src/app/paper-analysis/page.js
git commit --allow-empty -m "feat: update paper analysis page"

# Commit 14
git add src/app/subjects/page.js
git commit --allow-empty -m "feat: update subjects page"

# Commit 15
git add src/app/upload/page.js src/app/dashboard/page.module.css
git commit --allow-empty -m "feat: update upload and dashboard styles"

# Commit 16
git add mobile/src/app/\(tabs\)/index.tsx
git add -A
git commit --allow-empty -m "feat: update mobile index tab and other files"

# Push all commits
git push origin main
