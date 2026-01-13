# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Released]

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
