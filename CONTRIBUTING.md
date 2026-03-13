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
git clone https://github.com/YOUR_USERNAME/moody.git
cd moody
```

### 3. Preferred: Run with Docker Compose

The easiest contributor workflow is Docker Compose:

```bash
docker compose up --build
```

This automatically maps `3000:3000` and uses defaults so the app starts without manually passing env vars.

If you want all integrations enabled (Firebase Admin, Cloudinary deletion, AI insights, Redis cache), create `.env` from [`.env.example`](./.env.example) and fill real values.

Note: container logs can show a URL like `http://<container-id>:3000`. That is Docker-internal. Open `http://localhost:3000` on your host machine.

### 4. Alternative: Run with local Node.js

If you prefer not to use Docker:

* install Node.js 20+
* run the setup steps below (`npm install`, env setup, `npm run dev`)

### 5. Install Dependencies

```bash
npm install
```

### 6. Environment Setup

Create a `.env.local` file and add the required Firebase and Cloudinary credentials.
Refer to [`.env.example`](./.env.example) for the required variables.

### 7. Run the Development Server

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

## 🤖 Automated Reviews & Checks

To ensure high code quality and security, every Pull Request is automatically analyzed by:

* **GitHub Copilot & CodeRabbit**: AI-powered code reviews and suggestions.
* **GitGuardian**: Scans for exposed secrets and credentials.
* **CodeQL**: Performs semantic code analysis to detect security vulnerabilities.
* **Netlify**: Verifies that the deployment build succeeds.

Please review and address any issues raised by these bots.

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

## 💬 Community

Have ideas or questions?
Join the discussion here:
👉 **[GitHub Discussions](https://github.com/aditya-2k23/moody/discussions)**

## 🤖 Docker Automation & Versioning

This project uses GitHub Actions to automatically build and push Docker images to Docker Hub whenever changes are merged into the `main` branch.

* **Version Management**: The Docker image version is tied directly to the `version` field in `package.json`.
* **Contributor Requirement**: When submitting a Pull Request that introduces new features or fixes, please **increment the version** in `package.json` (following [SemVer](https://semver.org/)). This ensures that the new Docker image is correctly tagged and available for users.

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for helping make Moody better 🌱
