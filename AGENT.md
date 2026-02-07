# AGENT.md — Coding Agent Instructions for Moody

This file defines **mandatory context, rules, and expectations** for any AI coding agent working on the Moody codebase.

Follow this document strictly before writing or modifying code.

---

## 🧠 Project Overview

**Moody** is a personal AI-powered mood tracking web application.

Core goals:

- Emotional reflection, not social media
- Minimal UI, calm UX
- Data correctness > flashy features
- Privacy-first design

Users log:

- Daily mood
- Journal entry
- Optional photos
- Receive AI insights

---

## 🏗️ Tech Stack (Do NOT deviate)

- **Framework**: Next.js (App Router)
- **React**: v19+
- **Styling**: Tailwind CSS
- **Auth**: Firebase Authentication
- **Database**: Firestore
- **Media**: Cloudinary
- **AI**: Google Gemini (via Firebase / server routes)
- **Language**: JavaScript

Do NOT:

- Introduce Redux, Zustand, or new state libraries
- Introduce new backend frameworks
- Add experimental dependencies without strong reason

---

## 📁 Project Structure (Mental Model)

- `app/` → Routes, layouts, pages (App Router)
- `components/` → Reusable UI components
- `lib/` → Firebase, helpers, utilities
- `hooks/` → Custom React hooks
- `context/` → Global app contexts (auth, etc.)
- `actions/` or `server/` → Server actions / API logic

Prefer:

- Server Components by default
- `"use client"` only when needed

---

## 🔐 Authentication & User Data Rules

- Every user is identified by `uid`
- Never trust client-side user input blindly
- Firestore reads/writes MUST be scoped to `uid`
- Never expose secrets or service keys to the client

If touching auth, streaks, or user stats:

- Be **extremely cautious**
- Preserve backward compatibility

---

## 🔥 Firestore Rules & Data Integrity

- Avoid unnecessary reads (cost matters)
- Batch writes when possible
- Prefer server-side logic for derived values:
  - streaks
  - averages
  - analytics

If a change affects:

- streak logic
- daily boundaries
- timezone handling

👉 Explain assumptions clearly in comments.

---

## 🎨 UI / UX Philosophy

Moody is:

- Calm
- Minimal
- Non-distracting

Avoid:

- Loud colors
- Aggressive animations
- Overengineering UI logic

Always consider:

- Mobile usability
- Accessibility
- Performance

---

## 🧪 Code Quality Expectations

- Prefer readability over cleverness
- Add comments only where logic is non-obvious

When fixing bugs:

1. Explain root cause
2. Fix minimal surface area
3. Avoid cascading refactors

---

## 🚫 Hard NOs

Agents must NOT:

- Rewrite large files without request
- Change formatting or lint rules arbitrarily
- Rename variables for “style”
- Add features unless explicitly asked
- Remove existing behavior silently

---

## ✅ How to Respond When Unsure

If requirements are unclear:

- Ask **one precise clarification**
- Or propose **2–3 options with tradeoffs**

Never guess silently.

---

## 🧭 Agent Mindset

Act like:

- A senior engineer joining an existing startup
- You respect existing decisions
- You optimize for stability and clarity

Not like:

- A tutorial generator
- A refactor-happy bot

---

## 📌 Final Rule

If a change could:

- Break user data
- Reset streaks
- Affect daily mood logic
- Increase Firestore costs

👉 STOP and explain before implementing.

End of instructions.
