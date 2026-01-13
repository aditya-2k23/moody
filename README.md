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

- **User Authentication**: SignUp, LogIn, and LogOut securely using Firebase Authentication.
- **Mood Tracking**: Log your daily mood with a single click and view your mood history on a calendar.
- **Visual Memories**: Upload and keep track of photos for each day using Cloudinary integration.
- **Smart Photo Gallery**: A beautiful grid layout to view your memories with a full-screen viewer supporting zoom and navigation.
- **Dashboard**: Personalized dashboard showing mood stats, average mood, current streak, and time remaining in the day.
- **AI-Powered Journal Insights**: Get instant, personalized insights, mood analysis, emotional triggers, and actionable pro tips using **Google Gemini 2.5 Flash**.
- **Curated Reflective Placeholders**: Instant-loading, thoughtful prompts in the journal to inspire your daily writing.
- **Secure Deletion**: Full control over your data with the ability to delete specific memories (syncs with Firestore and Cloudinary).
- **Quote of the Day**: Motivational quotes to set a positive tone every time you visit.
- **Modern UI**: Clean, responsive design with glassmorphism, animated gradients, and dark mode support.

### 🆕 Recent Features & Improvements

- **🎤 Voice Input (Beta)**: Dictate your journal entries using the Web Speech API. Features smart punctuation, auto-capitalization, and a 5-minute listening limit to conserve resources.
- **💾 Smart Autosave**: Journal entries are automatically saved to the cloud with intelligent debouncing for both typing and voice input. Includes safety measures to prevent data loss on page exit.
- **✨ Enhanced Memories Animations**: Smooth fade-in/fade-out transitions with skeleton loaders for a polished loading experience.
- **Visual Memories**: Added support for uploading up to 5 photos per day with Cloudinary.
- **Parallel Uploading**: Images are uploaded in parallel for significantly faster log times.
- **Photo Viewer**: Interactive Modal with zoom, mouse dragging, and keyboard shortcuts (Arrows, Esc, +/-).
- **Performance Optimization**: Replaced dynamic AI placeholders with a curated static pool to eliminate loading flickers and reduce API costs.
- **Cloudinary Optimization**: Images are automatically resized and optimized for performance and lower data usage.

## 🛠️ Tech Stack

- **Next.js** (App Router)
- **React** 19+
- **Firebase** (Auth, Firestore, and AI SDK)
- **Cloudinary** (Image storage & transformation)
- **Google Gemini 2.5 Flash**
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

### When to use Docker

- **Consistent Environment**: Avoid "it works on my machine" issues by using the same environment as production.
- **Quick Testing**: Spin up the entire application with a single command without installing dependencies locally.
- **CI/CD Integration**: Easily integrate with automated testing and deployment pipelines.

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
   ```

4. **Run the development server:**

   ```sh
   npm run dev
   ```

## 📝 How to Use

1. **Log Your Day**: Enter how you're feeling and write a short journal entry.
2. **Add Photos**: Select up to 4 photos to capture the visual essence of your day.
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
