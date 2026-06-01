# 📐 Sutras Mobile — Design System v2.0

> **Redesigned UI** inspired by **Blinkit**, **Unstop**, and **Physics Wallah** — unified with the Sutraverse web platform.

---

## 🎨 Design Philosophy

| Principle | Implementation |
|:---|:---|
| **Search-First** (Blinkit) | Prominent pill search bars with glow-on-focus across Library & Home |
| **Bento Dashboards** (Unstop) | 2x2 stat grids, progress trackers, milestone countdown cards |
| **Course-Centric** (PW) | Rich gradient course/deck cards, AI doubt-solving, structured planners |
| **Web Consistency** | Shared color tokens, border radius scale, typography weights |

---

## 🧬 Color System

### Brand Colors
| Token | Value | Usage |
|:---|:---|:---|
| `primary` | `#6366f1` | Buttons, active tabs, progress bars |
| `primaryLight` | `#818cf8` | Gradient endpoints, hover states |
| `primaryDark` | `#4f46e5` | Pressed states, gradient starts |

### Accent Colors (Multi-App Inspired)
| Token | Value | Inspired By | Usage |
|:---|:---|:---|:---|
| `accentYellow` | `#fbbf24` | PW | Streaks, rewards, gold badges |
| `accentGreen` | `#10b981` | Unstop | Success, live indicators |
| `accentOrange` | `#f97316` | Blinkit | Urgency, deadlines, countdown |
| `accentRed` | `#ef4444` | — | Errors, alerts |
| `accentPurple` | `#a855f7` | — | Premium features, elite badges |

### Surface Colors (Dark / Light)
| Token | Dark | Light |
|:---|:---|:---|
| `bgMain` | `#0a0a0f` | `#f5f5f7` |
| `bgCard` | `#13131a` | `#ffffff` |
| `bgCardElevated` | `#1a1a24` | `#f8f8fc` |
| `bgInput` | `#1e1e2a` | `#f0f0f5` |

---

## 📏 Spacing & Radius Scale

### Spacing
`xs: 4` → `sm: 8` → `md: 16` → `lg: 24` → `xl: 32` → `xxl: 48`

### Border Radius
`sm: 8` → `md: 14` → `lg: 20` → `xl: 28` → `full: 9999`

### Typography
| Token | Size | Weight | Usage |
|:---|:---|:---|:---|
| `hero` | 28 | 900 | Page heroes, splash |
| `h1` | 22 | 800 | Screen titles |
| `h2` | 18 | 800 | Section headings |
| `h3` | 15 | 800 | Card titles |
| `body` | 14 | 500 | Body text |
| `caption` | 12 | 600 | Metadata, timestamps |
| `micro` | 10 | 700 | Section labels, badges |
| `badge` | 9 | 800 | Uppercase badges |

---

## 🖼️ Component Patterns

### Top App Bar (All Screens)
- Consistent `paddingTop: 56` for status bar
- Back button: `36x36` rounded square with `bgCard` background
- Title: `fontWeight: 900`, `fontSize: 18-20`
- Border bottom: `1px` with `colors.border`

### Cards
- `borderRadius: 16-20`
- `borderWidth: 1` with `colors.border`
- `backgroundColor: colors.bgCard`
- Type indicator bar: `4px` left accent strip

### Filter Chips (Unstop Pattern)
- Active: `backgroundColor: primary`, white text
- Inactive: `backgroundColor: bgCard`, muted text, border
- Horizontal scroll container

### Bento Grid (Unstop Pattern)
- `2x2` stat cards with icon + value + label
- Rounded icon backgrounds with `12%` opacity of accent color
- Used in: Home, Profile, Exam Mode

### Category Grid (Blinkit Pattern)
- `2x3` or `3x2` grid of icon cards
- Rounded square icon with colored background
- Label below
- Used in: Home quick access, Library resources

---

## 📱 Screen Architecture

| Screen | Key Pattern | Source App |
|:---|:---|:---|
| **Home** | Banner carousel + Bento progress + Category grid + File list | Blinkit + PW + Unstop |
| **Library** | Search-first + Resource grid + Filter chips + File cards | Blinkit + Unstop |
| **AI Partner** | Welcome card + Action chips + Gradient bubbles | PW |
| **Profile** | Avatar card + Bento stats + Badge scroll + Settings | Unstop |
| **Exam Prep** | Milestone countdown + Daily tasks + Mock exams + AI config | Unstop + PW |
| **Leaderboard** | Gradient podium + Self-highlight + Global ranking | Unstop |
| **Clubs** | Banner cards + Gradient overlays + Tags | Blinkit |
| **Community** | Social feed + Compose FAB + Glass header | Custom |

---

## 🌓 Theme System

The app supports **Dark** and **Light** modes via `ThemeContext.js`.

- Default: **Dark mode**
- Toggle: Via Profile screen or top bar icon
- Storage: `AsyncStorage` with key `sutras-theme`
- Context provides: `{ theme, toggleTheme, colors, gradients, spacing, radius, typography }`

### Gradient Presets
Available via `gradients` from context:
- `hero`: Primary → Purple → Cyan
- `card`: Primary → Light
- `cardWarm`: Orange → Yellow
- `streak`: Orange → Red
- `gold`: Yellow → Amber
- `podium1/2/3`: Gold / Silver / Bronze

---

## 🔗 Web ↔ Mobile Consistency

| Feature | Web (globals.css) | Mobile (ThemeContext) |
|:---|:---|:---|
| Primary | `#3b82f6` (Blue) | `#6366f1` (Indigo) |
| Card Style | Glass panel + border | bgCard + border |
| Radius | `8-32px` | `8-28px` |
| Shadows | `box-shadow` | `elevation` / `shadow*` |
| Typography | Inter / Outfit | System (weight-matched) |
| Section Headers | Uppercase badge + "View all" | Uppercase label + "View all →" |
| Gradients | CSS `linear-gradient` | `expo-linear-gradient` |

---

## 📦 Dependencies
- `expo-blur` — iOS glassmorphism tab bar
- `expo-linear-gradient` — Gradient cards, buttons, banners
- `@expo/vector-icons` (Ionicons) — Icon system
- `react-native-reanimated` — Animations (available but not yet utilized)
