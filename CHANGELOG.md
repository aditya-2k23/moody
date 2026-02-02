# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Released]

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
