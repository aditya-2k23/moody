# Moody: Your Personal AI Powered Mood Tracker

Moody is a **minimalistic** and modern mood-tracking web application built with Next.js, React, and Firebase. Designed for simplicity and ease of use, it allows users to log their daily moods, visualize their mood history, and manage their account securely with authentication. The app features a beautiful UI, accessibility enhancements, and real-time feedback—all while maintaining a clutter-free, focused experience.

## 🚀 Features

- **User Authentication**: SignUp, LogIn, and LogOut securely using Firebase Authentication.
- **Mood Tracking**: Log your daily mood with a single click and view your mood history on a calendar.
- **Visual Memories**: Upload and keep track of photos for each day using Cloudinary integration.
- **Smart Photo Gallery**: A beautiful grid layout to view your memories with a full-screen viewer supporting zoom and navigation.
- **Dashboard**: Personalized dashboard showing mood stats, average mood, current streak, and time remaining in the day.
- **AI-Powered Journal Insights**: Get instant, personalized insights, mood analysis, emotional triggers, and actionable pro tips using **Google Gemini 3 Flash**.
- **Curated Reflective Placeholders**: Instant-loading, thoughtful prompts in the journal to inspire your daily writing.
- **Secure Deletion**: Full control over your data with the ability to delete specific memories (syncs with Firestore and Cloudinary).
- **Quote of the Day**: Motivational quotes to set a positive tone every time you visit.
- **Modern UI**: Clean, responsive design with glassmorphism, animated gradients, and dark mode support.

### 🆕 Recent Features & Improvements

- **Visual Memories v2.0**: Added support for uploading up to 4 photos per day with Cloudinary.
- **Parallel Uploading**: Images are uploaded in parallel for significantly faster log times.
- **Photo Viewer**: Interactive Modal with zoom, mouse dragging, and keyboard shortcuts (Arrows, Esc, +/-).
- **Gemini 3 Upgrade**: Significant improvements in journal analysis quality and speed.
- **Performance Optimization**: Replaced dynamic AI placeholders with a curated static pool to eliminate loading flickers and reduce API costs.
- **Cloudinary Optimization**: Images are automatically resized and optimized for performance and lower data usage.

## 🛠️ Tech Stack

- **Next.js** (App Router)
- **React** 19+
- **Firebase** (Auth, Firestore, and AI SDK)
- **Cloudinary** (Image storage & transformation)
- **Google Gemini 3 Flash**
- **Tailwind CSS**
- **react-hot-toast**

## 📦 Getting Started

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
   Copy `.env.example` to `.env` and fill in your credentials.

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

## 🙏 Credits

- Built with 💜 by [Aditya](https://github.com/aditya-2k23)
- Inspired by [Smoljames](https://www.youtube.com/@Smoljames) mood-tracking app [Broodl](https://github.com/jamezmca/broodl/)
