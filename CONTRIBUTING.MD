# Contributing to Moody

Thank you for your interest in contributing to **Moody**.
This project aims to promote mental well-being through thoughtful, privacy-conscious technology, and contributions of all kinds are welcome.

## About the Project

Moody is an open-source, AI-powered mood tracking application built with:

* Next.js
* Firebase (Authentication + Firestore)
* Tailwind CSS
* Cloudinary
* AI-based mood analysis

The focus is on creating a calm, reliable, and user-friendly journaling experience.

## Ways to Contribute

You can contribute in many ways, including:

* Bug fixes
* New features
* UI / UX improvements
* AI insight enhancements
* Performance optimizations
* Accessibility improvements
* Documentation updates
* Testing

If you are new to the project, look for issues labeled **good first issue**.

## Getting Started

### 1. Fork the Repository

Use the GitHub **Fork** button to create your own copy.

### 2. Clone Your Fork

```bash
git clone https://github.com/aditya-2k23/moody.git
cd moody
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Environment Setup

Create a `.env.local` file and add the required Firebase and Cloudinary credentials.
Refer to [`.env.example`](./.env.example) for the required variables.

### 5. Run the Development Server

```bash
npm run dev
```

## Branching Strategy

* `main` → production-ready code
* Create feature or fix branches using clear names:

  * `feature/visual-memories`
  * `fix/journal-save-issue`
  * `ui/calendar-improvements`

## Submitting a Pull Request

1. Create a new branch from `main`
2. Make small, focused commits
3. Ensure the app runs correctly and builds without errors
4. Open a Pull Request with:

   * A clear description of the changes
   * Screenshots for UI-related updates
   * A linked issue, if applicable

## Code Guidelines

* Keep code readable and well-structured
* Follow the existing folder and component structure
* Prefer clarity over clever or complex solutions
* Avoid breaking changes without prior discussion
* Be mindful of performance, accessibility, and user privacy

## Communication and Conduct

* Be respectful and constructive in discussions
* Mental health is a sensitive domain; empathy matters
* Feedback should be clear, kind, and actionable

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for helping make Moody better 🌱
