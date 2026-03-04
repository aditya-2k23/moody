import LandingFooter from "@/components/landing/LandingFooter";

export const metadata = {
  title: "Privacy Policy ⋅ Moody",
  description: "Privacy Policy for Moody - AI-powered mood tracking application.",
};

export default function PrivacyPolicy() {
  return (
    <main className="flex-1 flex flex-col w-full relative">
      <div className="w-full max-w-4xl mx-auto px-6 py-8 sm:py-12 !pt-0 flex-1 mb-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-sm">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 fugaz text-indigo-500">Privacy Policy</h1>
          <p className="text-slate-500 mb-8 italic">Last Updated: February 2026</p>

          <div className="space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed">
            <section>
              <p>
                Moody (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is an AI-powered mood tracking application designed to help users better understand their emotional patterns. We are committed to protecting your privacy and being transparent about how your information is collected, used, and stored.
              </p>
              <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">
                By using Moody, you agree to the practices described in this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">1. Information We Collect</h2>

              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">1.1 Account Information</h3>
              <p>When you create an account using Firebase Authentication, we collect:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Email address</li>
                <li>Unique user ID</li>
                <li>Authentication metadata (e.g., login timestamps)</li>
              </ul>
              <p className="mt-2 text-sm text-slate-500">Passwords are not stored by us directly. Authentication is securely handled by Firebase.</p>

              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">1.2 Profile Information</h3>
              <p>During sign-up or profile customization, you may provide:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Full name</li>
                <li>Age</li>
                <li>Gender</li>
                <li>Avatar photo (optional)</li>
              </ul>
              <p className="mt-2 text-sm text-slate-500">Avatar images are stored securely using Cloudinary (if uploaded).</p>
              <p className="mt-2">Providing profile information beyond email is optional, except where required to complete registration. We use this information only to personalize your experience (e.g., tailored AI insights, greetings, or demographic-based analysis features).</p>

              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">1.3 Mood &amp; Journal Data</h3>
              <p>When using Moody, we store:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Mood selections</li>
                <li>Journal entries</li>
                <li>Timestamps</li>
                <li>Streak and activity metrics</li>
              </ul>
              <p className="mt-2 text-sm text-slate-500">This data is stored in Firebase Firestore and linked to your account.</p>

              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">1.4 AI Processing</h3>
              <p>When you request AI insights:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Your journal content (and relevant profile context, if applicable) may be securely sent to the Google Gemini API for analysis.</li>
                <li>AI-generated responses may be cached using Upstash Redis for up to 7 days to improve performance.</li>
              </ul>
              <p className="mt-2">Cached entries are automatically deleted after expiration. <span className="font-semibold text-slate-900 dark:text-slate-100">We do not use your data to train AI models.</span></p>

              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">1.5 Uploaded Images</h3>
              <p>If you upload Avatar photos or Daily memory images, these are stored via Cloudinary. We store only secure references linked to your account.</p>
              <p className="mt-2">Images are not publicly accessible unless explicitly shared.</p>

              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">1.6 Technical &amp; Usage Data</h3>
              <p>We may collect limited technical data such as Browser type, Device type, Error logs, and Performance metrics.</p>
              <p className="mt-2">This data is used strictly for reliability, debugging, and improving the service.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">2. How We Use Your Information</h2>
              <p>We use your information to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Provide mood tracking services</li>
                <li>Personalize your dashboard experience</li>
                <li>Generate AI-powered insights</li>
                <li>Maintain statistics and streak tracking</li>
                <li>Improve platform performance and security</li>
              </ul>
              <p className="mt-4 font-semibold text-indigo-500">We do not sell, rent, or trade your personal data.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">3. Age Requirements</h2>
              <p>Moody is not intended for individuals under 13 years old.</p>
              <p className="mt-2">If you are under the required legal age in your jurisdiction, you must not use this service. If we discover that we have collected data from a child without proper consent, we will delete it promptly.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">4. Legal Basis for Processing (GDPR Notice)</h2>
              <p>If you are located in the European Economic Area (EEA), we process your data based on:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Your consent</li>
                <li>Contractual necessity (to provide services)</li>
                <li>Legitimate interests (security and improvement)</li>
              </ul>
              <p className="mt-2">You may withdraw consent at any time by deleting your account.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">5. Data Storage &amp; Security</h2>
              <p>Your data is stored using trusted third-party infrastructure providers:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Firebase (Authentication &amp; Firestore)</li>
                <li>Cloudinary (Image storage)</li>
                <li>Google Gemini API (AI processing)</li>
                <li>Upstash Redis (AI caching)</li>
              </ul>
              <p className="mt-4">Security measures include HTTPS encryption, Authentication-based access controls, Firestore security rules, and Limited AI cache duration. However, no system is completely secure.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">6. Data Retention</h2>
              <p>We retain your data:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>While your account is active</li>
                <li>Until you delete specific entries</li>
                <li>Until you delete your account</li>
              </ul>
              <p className="mt-2">AI cache data is automatically deleted after expiration (maximum 7 days).</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">7. Your Rights</h2>
              <p>Depending on your location, you may have the right to Access your personal data, Request correction, Request deletion, Request export of your data, or Withdraw consent.</p>
              <p className="mt-2">You can update or delete your profile information at any time from your account settings.</p>
              <p className="mt-4">For assistance, contact: <a href="mailto:your@email.com" className="text-indigo-500 hover:text-indigo-400 font-medium transition duration-200">your@email.com</a></p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">8. International Data Transfers</h2>
              <p>Your information may be processed and stored on servers located outside your country of residence, including the United States.</p>
              <p className="mt-2">By using Moody, you consent to these transfers.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">9. AI Disclaimer</h2>
              <p>AI-generated insights are automated and may not always be accurate.</p>
              <p className="mt-2 font-semibold text-slate-900 dark:text-slate-100">They are not medical advice and should not replace professional mental health services.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">10. Changes to This Policy</h2>
              <p>We may update this Privacy Policy periodically. Changes will be reflected with a revised &ldquo;Last Updated&rdquo; date.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">11. Contact</h2>
              <p>For privacy-related concerns:</p>
              <ul className="list-none mt-2 space-y-1">
                <li>Email: <a href="mailto:your@email.com" className="text-indigo-500 hover:text-indigo-400 font-medium transition duration-200">your@email.com</a></li>
                <li>Website: <a href="https://moody-adi.netlify.app" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-400 font-medium transition duration-200">https://moody-adi.netlify.app</a></li>
              </ul>
            </section>
          </div>
        </div>
      </div>
      <LandingFooter />
    </main>
  );
}
