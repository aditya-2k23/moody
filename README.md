# Moody

Moody is a **minimalistic** and modern mood-tracking web application built with Next.js, React, and Firebase. Designed for simplicity and ease of use, it allows users to log their daily moods, visualize their mood history, and manage their account securely with authentication. The app features a beautiful UI, accessibility enhancements, and real-time feedback—all while maintaining a clutter-free, focused experience.

## 🚀 Features

- **User Authentication**: SignUp, LogIn, and LogOut securely using Firebase Authentication.
- **Mood Tracking**: Log your daily mood with a single click and view your mood history on a calendar.
- **Dashboard**: Personalized dashboard showing mood stats, average mood, and time remaining in the day.
- **Accessibility**: Show/hide password toggle for better accessibility.
- **Error & Success Feedback**: Toast notifications for login errors, registration errors, and successful logins.
- **Responsive Design**: Fully responsive and mobile-friendly UI using Tailwind CSS.
- **Modern UI**: Clean, attractive, and easy-to-use interface with a minimalistic approach.

## 🛠️ Tech Stack

- **Next.js** (App Router)
- **React** 19+
- **Firebase** (Authentication & Firestore)
- **Tailwind CSS** (for easy styling)
- **react-hot-toast** (for notifications)

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
   Copy `.env.example` to `.env` and fill in your Firebase credentials.

     ```env
     NEXT_PUBLIC_API_KEY=your_api_key
     NEXT_PUBLIC_AUTH_DOMAIN=your_auth_domain
     NEXT_PUBLIC_PROJECT_ID=your_project_id
     NEXT_PUBLIC_STORAGE_BUCKET=your_storage_bucket
     NEXT_PUBLIC_MESSAGING_SENDER_ID=your_messaging_sender_id
     NEXT_PUBLIC_APP_ID=your_app_id
     ```

4. **Run the development server:**

   ```sh
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the app.

## 📝 How to Use

1. **Sign Up**: Click the "Sign Up" button on the homepage CTA to create a new account.
2. **Log In**: Use your credentials to log in. If you enter a wrong password or non-existent user, a toast will notify you.
3. **Dashboard**: After logging in, you'll be redirected to your dashboard where you can:
   - Log your mood for the day
   - View your mood history on a calendar
   - See stats like average mood and number of days tracked
4. **Show/Hide Password**: Use the eye icon in the password field to toggle visibility.
5. **Log Out**: Use the logout button in the dashboard to end your session.

## 📁 Project Structure

- `app/` - Next.js app directory (routing, pages)
- `components/` - Reusable React components (Button, Input, Dashboard, etc.)
- `context/` - React context for authentication
- `public/` - Static assets
- `utils/` - Utility functions
- `firebase.js` - Firebase configuration

## 🙏 Credits

- Built with 💜 by [Aditya](https://github.com/aditya-2k23)
- Inspired by [Smoljames](https://www.youtube.com/@Smoljames) mood-tracking app [Broodl](https://github.com/jamezmca/broodl/)
