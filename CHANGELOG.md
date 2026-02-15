# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Released]

## [2.5.0] - 2026-02-13

### 🚀 New Features

- **🤖 AI-Powered Journal Insights (Server Action + Redis Cache)**:
  - Introduced a new server-side action (`app/actions/insights.js`) for generating structured AI insights using **Google Gemini Flash 3 Preview**.
  - Implements a **Redis cache-first strategy** (Upstash Redis) with content-hash-based keys and a 7-day TTL, drastically reducing redundant AI API calls.
  - Support for `forceRegenerate` to bypass cache when needed.
  - Structured JSON output: mood detection, emotional triggers, empathetic insight, pro tip, and headline.
  - Robust error handling with user-friendly messages for rate limits, parsing failures, and service errors.

- **📝 Journal Modal with Edit & Delete**:
  - New `JournalModal` component replaces the inline journal popup in the calendar.
  - Full editing workflow: edit journal text and mood, save, or delete entries for any past day.
  - Unsaved changes detection with a confirmation dialog before discarding edits.
  - Delete confirmation dialog with optimistic UI updates and rollback on failure.
  - Keyboard support (Escape to close/dismiss dialogs).

- **🎯 Radial Mood Menu**:
  - New GTA-5-style radial mood selector (`RadialMoodMenu`) for intuitive mood selection in the journal modal.
  - CSS-driven radial layout with smooth staggered open/close animations.
  - Hover-to-open with delayed activation, click toggle, and outside-click dismiss.
  - Full dark mode support and responsive sizing for mobile.

- **🔥 Streak Indicator Component**:
  - New `StreakIndicator` component with visual states: grayscale (inactive) when today's mood is not logged, colorful (active) when logged.
  - Celebratory animations on streak activation: number pop, fire bounce, sparkle particles, and glow effects.
  - Tooltip hint when mood hasn't been logged today.
  - Smarter streak calculation: streak persists if yesterday was logged even if today isn't yet.

- **🎨 Theme Toggle Reveal Animation**:
  - Beautiful flower-shaped mask reveal animation on theme switch using CSS `@property` and radial gradients.
  - Respects `prefers-reduced-motion` for accessibility.
  - Smooth 650ms transition with proper cleanup.

### ⚡ Performance

- **Debounced Mood Saves**: Mood selection now uses a 2-second debounce with `pendingMoodRef` to batch rapid mood changes into a single Firestore write, reducing database costs.
  - Flush-on-exit: pending saves are flushed on `beforeunload` and `visibilitychange` to prevent data loss.
- **Optimistic UI Updates**: Calendar entry edits and deletes update the UI immediately with automatic rollback on failure.
- **Redis Caching for AI Insights**: Cache-first architecture eliminates redundant Gemini API calls for identical journal entries (7-day TTL with SHA-256 content hashing).
- **Migrated from Font Awesome CDN to lucide-react**: Removed the external Font Awesome stylesheet dependency, eliminating the preload warning and reducing page load time. All icons now use tree-shakeable `lucide-react` components.

### 🔧 Improvements

- **Calendar Component Overhaul**:
  - Added `onUpdateEntry` and `onDeleteEntry` props for inline entry management.
  - State synchronization with Firestore data via `useEffect` (respects edit mode).
  - Blocks interaction on future dates and during save/delete operations.
  - Clears popup/edit state when navigating between months.
- **Dashboard State Management**:
  - Fresh date computation on every `countValues()` call to avoid stale values if a tab stays open overnight.
  - New helper functions: `upsertEntryInState`, `deleteEntryFromState`, `removeJournalFieldFromState`, and `calculateStreakFromData` for clean state transformations.
  - Mood deselection (toggle) support with toast feedback.
- **Journal Insights**: Migrated from client-side Firestore caching to server-side Redis caching via Next.js Server Actions.

### 🎨 UI/UX

- **New Animations**: Added streak celebration, tooltip fade-in, sparkle float, modal overlay/content entrance, and glow effect animations in `globals.css`.
- **Refined Styling**: Cleaned up journal textarea resizer gradient syntax for consistency in both light and dark modes.
- **Icons Migration**: Replaced all Font Awesome `<i>` tags with lucide-react components across all components (layout, calendar, journal, photo modal, memories, image upload, AI insights, logout).

### 📚 Documentation

- **Added `AGENT.md`**: Mandatory guide for AI coding agents with project philosophy, tech stack constraints, code quality expectations, and strict rules.

### 🧹 Chores

- **Dependencies**:
  - Added `@google/generative-ai` (^0.24.1) for Gemini integration.
  - Added `@upstash/redis` (^1.36.2) for server-side caching.
  - Removed Font Awesome CDN dependency.
- **New Utilities**: Added `utils/dailyEntry.js` with `updateDailyEntry` and `deleteDailyEntry` helpers for Firestore field-level operations.
- **New Lib**: Added `lib/redis.js` for Upstash Redis client initialization.
- Bumped project version to `2.5.0`.

---

## [2.4.28] - 2026-02-02

### 🚀 New Visuals

- **Animated "Blob" UI**: Introduced a new `Button` component with organic, "gooey" hover effects and size variants (`blob-btn`), enhancing interactivity.
- **Enhanced Splash Screen**:
  - Fullscreen loading experience with floating orb animations.
  - Rotating wellness tips and smooth progress indicators.
  - Replaced legacy loaders across the dashboard for a unified startup feel.
- **Themes**: Migrated to `next-themes` for robust light/dark mode persistence and hydration-safe toggling.

### 🔧 Improvements

- **Voice Input Resilience**:
  - Implemented robust error handling for benign speech errors (`no-speech`, `aborted`)—no longer blocks restart.
  - Clearer, user-friendly toast messages for microphone permission issues.
  - Safer state management to prevent UI sync issues during restarts.
- **Journal UX**:
  - More forgiving autosave debounce timings.
  - Removed "new feature" indicators for a cleaner look.
  - Updated standard buttons to use the new "blob" styles.
- **Visual Polish**:
  - Improved text resizer visibility in the journal.
  - Refined `Memories` component to handle empty state visibility gracefully on first load.

### 🧹 Chores

- **Dependencies**: Bumped project version to `2.4.28`.
- **Cleanup**: Removed unused imports and legacy theme context code.

## [2.4.14] - 2026-01-14

### 🔒 Security

- **Patched React Server Components vulnerabilities**:
  - Fixed CVE-2025-55182, CVE-2025-55183, CVE-2025-55184 (RSC security flaws).
  - Upgraded `next` from 15.4.10 → **15.5.9**.
  - Upgraded `react` and `react-dom` from ^19.0.0 → **19.2.3**.
  - Upgraded `eslint-config-next` from 15.4.7 → **15.5.9**.

---

## [2.4.13] - 2026-01-13

### 🚀 New Features

- **🎤 Voice Input (Beta)**:
  - Dictate journal entries using the **Web Speech API**.
  - Smart punctuation: auto-capitalization and intelligent sentence endings.
  - Supports continuous dictation with real-time interim transcripts.
  - **5-minute listening limit** to conserve microphone resources.
  - Seamlessly integrates with the journal textarea for hybrid typing + voice workflows.

- **💾 Smart Autosave**:
  - Journal entries are now **automatically saved** to the cloud.
  - Intelligent debouncing with distinct timing for typing (2s) and voice input (triggered on stop).
  - **Safety measures**: Autosave on visibility change and `beforeunload` to prevent data loss.
  - Cloud sync status indicator shows real-time save state.

- **✨ Enhanced Memories Animations**:
  - Smooth **fade-in/fade-out transitions** when switching between months.
  - Added **skeleton loaders** for a polished loading experience.
  - Improved empty state handling with graceful animations.

### 🔧 Improvements

- **Visual Memories**: Now supports up to **5 photos** per journal entry (previously 4).
- **Journal UX**: Immediate text updates in the display after saving (both manual and autosave).
- **Performance**: Reduced flickering in cloud status indicator.

### 🐛 Bug Fixes

- Fixed duplicate Firebase writes by tracking the last saved entry hash.
- Prevented autosave from triggering while voice input is actively listening.
- Fixed edge case where autosave could fire with stale data on rapid input.

---

## [2.2.3] - 2025-12-31

### 🚀 New Features

- **Visual Memories**:
  - Added support for uploading up to **4 photos** per journal entry.
  - Implemented parallel uploading for faster performance.
  - Integrated Cloudinary for optimized image storage and transformation.
- **Interactive Photo Gallery**:
  - New modal viewer with **zoom**, **pan**, and **keyboard navigation** (Arrow keys, Esc).
- **Docker Support**:
  - Added `Dockerfile` for containerized deployment.
  - Added GitHub Actions workflow for automated Docker builds and tagging.
- **AI Upgrade**:
  - Migrated to **Google Gemini 2.5 Flash** for faster and more accurate mood analysis.
  - Stabilized journal placeholders to prevent flickering.

### 📚 Documentation

- Added **SECURITY.md** with vulnerability reporting policy.
- Added **ROADMAP.md** outlining future plans (Voice Input, Mobile App).
- Overhauled **README.md** with Docker instructions, Tech Stack, and better navigation.
- Updated **CONTRIBUTING.md** with automated review details and Docker versioning rules.
- Refined GitHub Issue Templates for Bug Reports, Feature Requests, and Pull Requests.

### 🐛 Bug Fixes

- **Time Travel Prevention**: Restricted calendar navigation and mood logging to prevent selecting future dates.
- **Cloudinary Uploads**: Fixed environment variable configuration for deployed environments.
- **Performance**: Optimized dashboard animations and hover effects.

### ⚙️ Infrastructure

- Added `.env.example` for easier local development setup.
- Configured automated code quality checks (Copilot, CodeQL, GitGuardian).
