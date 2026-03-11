# Moody: Your Personal AI Powered Mood Tracker

[![GitHub](https://img.shields.io/badge/Repository-blue?logo=github)](https://github.com/aditya-2k23/moody)
[![License](https://img.shields.io/badge/LICENSE-MIT-yellow?logo=license.svg)](https://github.com/aditya-2k23/moody/blob/main/LICENSE)
[![Netlify Status](https://api.netlify.com/api/v1/badges/8b7234a7-03e7-40be-ab80-d7fa5f59a91a/deploy-status)](https://app.netlify.com/projects/moody-adi/deploys)
[![Discussions](https://img.shields.io/badge/Discussions-Open-blue)](https://github.com/aditya-2k23/moody/discussions)

Check it out live at: [https://moody-adi.netlify.app/](https://moody-adi.netlify.app/)

Moody is a **minimalistic** and modern mood-tracking web application built with Next.js, React, and Firebase. Designed for simplicity and ease of use, it allows users to log their daily moods, visualize their mood history, and manage their account securely with authentication. The app features a beautiful UI, accessibility enhancements, and real-time feedback—all while maintaining a clutter-free, focused experience.

## Table of Contents

- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Docker Support](#-docker-support)
- [Getting Started](#-getting-started)
- [How to Use](#-how-to-use)
- [CI/CD & Docker Automation](#-cicd--docker-automation)
- [License](#-license)
- [Community](#-community)
- [Credits](#-credits)

## 🚀 Features

- **Guest Mood Selector**: Try out mood logging instantly without signing up, using the new Guest interactive section!
- **Beautiful Landing Page**: A fully redesigned landing page featuring dynamic scroll animations, a features grid, and a modern aesthetic.
- **Mood Tracking**: Log your daily mood with a single click and view your mood history on a calendar.
- **User Authentication**: SignUp, LogIn, and LogOut securely using Firebase Authentication.
- **Visual Memories**: Upload and keep track of photos for each day using Cloudinary integration, with a beautiful grid layout to view your memories with a full-screen viewer supporting zoom and navigation.
- **Dashboard**: Personalized dashboard showing mood stats, average mood, current streak, and time remaining in the day.
- **AI-Powered Journal Insights**: Get instant, personalized insights, mood analysis, emotional triggers, and actionable pro tips using **Google Gemini Flash 3 Preview** — powered by server-side Redis caching for instant repeat lookups.
- **Secure Deletion**: Full control over your data with the ability to delete specific memories (syncs with Firestore and Cloudinary).

### 🆕 Recent Features & Improvements (v2.6.0)

- **🌟 Interactive Landing Page**: An entirely new landing page experience with `ScrollAnimations`, `ComparisonSection`, `FeaturesGrid`, and a `ScrollToTopButton`.
- **👤 Guest Experience**: Try the `GuestMoodSection` right from the landing page. It uses local storage (`hooks/useGuestDraft.js`) to save your draft so you don't lose your entry if you decide to log in.
- **✍️ Hand-Drawn UI Elements**: Introduced a new `HandDrawnButton` component with organic, sketch-like aesthetics for a more personal touch.
- **🤖 Server-Side AI Insights**: Removed the client-side `utils/analyzeJournal.js` utility, transitioning fully to server-side AI generation for enhanced security and performance.
- **⚖️ Legal Pages**: Added dedicated `Privacy Policy` and `Terms of Service` pages.
- **🎨 Styling Enhancements**: Added `styled-components` and `react-type-animation` for richer dynamic UI interactions.
- **📝 Journal Modal with Edit & Delete**: Click any calendar day to view, edit, or delete journal entries and mood in a sleek modal with unsaved changes detection.
- **🎯 Radial Mood Menu**: GTA-style radial mood selector for intuitive mood selection when editing past entries.

## 🛠️ Tech Stack

- **Next.js** (App Router)
- **React** 19+
- **Firebase** (Auth & Firestore)
- **Cloudinary** (Image storage & transformation)
- **Google Gemini Flash 3 Preview** (AI Insights)
- **Upstash Redis** (Server-side caching)
- **lucide-react** (Icons)
- **Tailwind CSS**
- **react-hot-toast**

## 🐳 Docker Support

A prebuilt Docker image is available for easier setup and consistent environments. This is ideal for contributors and quick local testing without needing to manage local Node.js versions.

### Pull the image

```sh
docker pull temaroon/moody:latest
```

### Run the container

You must provide the required environment variables. You can pass them individually or use an `.env` file.

```sh
docker run -d -p 3000:3000 --name moody --env-file .env temaroon/moody:latest
```

Once running, access the application at [http://localhost:3000](http://localhost:3000).

## 📦 Getting Started

If you prefer Docker, see the [Docker Support](#-docker-support) section above.

1. **Clone the repository:**

   ```sh
   git clone https://www.github.com/aditya-2k23/moody.git
   cd moody
   ```

2. **Install dependencies:**

   ```sh
   npm install
   ```

3. **Set up environment variables:**  
   Copy [`.env.example`](./.env.example) to `.env` and fill in your credentials.

   ```env
   # Firebase Client
   NEXT_PUBLIC_API_KEY=...
   NEXT_PUBLIC_AUTH_DOMAIN=...
   NEXT_PUBLIC_PROJECT_ID=...
   NEXT_PUBLIC_STORAGE_BUCKET=...
   NEXT_PUBLIC_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_APP_ID=...

   # Cloudinary
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=...

   # Firebase Admin (v2.0+)
   FIREBASE_SERVICE_ACCOUNT_KEY='{"project_id": "...", ...}'

   # AI Insights (v2.5.0+)
   GEMINI_API_KEY=...

   # Redis Caching (v2.5.0+)
   UPSTASH_REDIS_REST_URL=...
   UPSTASH_REDIS_REST_TOKEN=...
   ```

4. **Run the development server:**

   ```sh
   npm run dev
   ```

## 📝 How to Use

1. **Log Your Day**: Enter how you're feeling and write a short journal entry.
2. **Add Photos**: Select up to 5 photos to capture the visual essence of your day.
3. **Get Insights**: Hit save to get AI analysis of your mood and triggers instantly.
4. **Relive Memories**: Tap on any image in your memories grid to open the full-screen viewer. Use Arrow keys to navigate through your month's photos.
5. **Manage History**: Use the calendar to jump between months and view your past emotional trends.

## 🤖 CI/CD & Docker Automation

Moody uses GitHub Actions to automate the build and push process for Docker images.

- **Automatic Versioning**: The workflow triggers on every push to `main`.
- **Image Tags**: Images are tagged with the version from `package.json` and the git commit SHA.
- **Latest Tag**: The `latest` tag always points to the most recent successful build from the `main` branch.

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for more details.

## 💬 Community

Have ideas, questions, or feedback? We'd love to hear from you!
👉 **[Join the Discussion on GitHub](https://github.com/aditya-2k23/moody/discussions)**

## 🫶 Credits

- Built with 💜 by [Aditya](https://github.com/aditya-2k23)
- Inspired by [Smoljames](https://www.youtube.com/@Smoljames) mood-tracking app [Broodl](https://github.com/jamezmca/broodl/)
- Thanks to the open-source community for libraries and tools that made this possible!
