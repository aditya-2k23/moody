import LandingFooter from "@/components/landing/LandingFooter";

export const metadata = {
  title: "Terms of Service ⋅ Moody",
  description: "Terms of Service for Moody - AI-powered mood tracking application.",
};

export default function TermsOfService() {
  return (
    <main className="flex-1 flex flex-col w-full relative">
      <div className="w-full max-w-4xl mx-auto px-6 py-8 sm:py-12 !pt-0 flex-1 mb-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-sm">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 fugaz text-indigo-500">Terms of Service</h1>
          <p className="text-slate-500 mb-4 italic">Last Updated: February 2026</p>

          <div className="space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed">
            <section>
              <p>
                Welcome to Moody. These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the Moody web application and related services (the &ldquo;Service&rdquo;).
              </p>
              <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">
                By creating an account or using Moody, you agree to be bound by these Terms. If you do not agree, you must not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">1. Description of Service</h2>
              <p>Moody is an AI-powered mood tracking and journaling application that allows users to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Log daily moods</li>
                <li>Write journal entries</li>
                <li>Upload photos</li>
                <li>Receive AI-generated insights</li>
                <li>Track emotional patterns over time</li>
              </ul>
              <p className="mt-2 text-sm text-slate-500">Moody is intended for personal reflection and self-improvement purposes only.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">2. Eligibility</h2>
              <p>You must be at least 13 years old (or the minimum legal age in your jurisdiction) to use Moody.</p>
              <p className="mt-2">By using the Service, you represent that:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>You meet the age requirement</li>
                <li>The information you provide is accurate</li>
                <li>You are legally capable of entering into this agreement</li>
              </ul>
              <p className="mt-2 text-sm text-slate-500">If we discover that a user does not meet these requirements, we may suspend or terminate the account.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">3. Account Registration</h2>
              <p>To use Moody, you must create an account via Firebase Authentication.</p>
              <p className="mt-2">You agree to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Provide accurate and current information</li>
                <li>Maintain the confidentiality of your login credentials</li>
                <li>Accept responsibility for activity under your account</li>
              </ul>
              <p className="mt-2 text-sm text-slate-500">You are solely responsible for safeguarding your account.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">4. User Content</h2>

              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">4.1 Ownership</h3>
              <p>You retain full ownership of:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Journal entries</li>
                <li>Mood logs</li>
                <li>Uploaded photos</li>
                <li>Profile information</li>
              </ul>
              <p className="mt-2 text-sm text-slate-500">Moody does not claim ownership over your content.</p>

              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">4.2 License to Operate the Service</h3>
              <p>By using Moody, you grant us a limited, non-exclusive license to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Store your content</li>
                <li>Process it for AI insights</li>
                <li>Display it within your account</li>
                <li>Generate analytics and statistics</li>
              </ul>
              <p className="mt-2 text-sm text-slate-500">This license exists solely for the purpose of providing the Service.</p>

              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">4.3 Prohibited Content</h3>
              <p>You agree not to upload or submit:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Illegal content</li>
                <li>Harassing or abusive content</li>
                <li>Content infringing intellectual property rights</li>
                <li>Malicious code or harmful data</li>
              </ul>
              <p className="mt-2">We reserve the right to remove content or suspend accounts that violate these rules.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">5. AI-Generated Insights Disclaimer</h2>
              <p>Moody uses artificial intelligence (Google Gemini API) to generate mood insights.</p>
              <p className="mt-2">You acknowledge and agree that:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>AI-generated insights are automated outputs</li>
                <li>They may be inaccurate or incomplete</li>
                <li>They are not medical, psychological, or professional advice</li>
              </ul>
              <p className="mt-2 font-semibold text-slate-900 dark:text-slate-100">Moody does not provide therapy, counseling, or mental health treatment. If you are experiencing serious emotional distress, seek help from a licensed professional.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">6. Privacy</h2>
              <p>Your use of Moody is also governed by our Privacy Policy.</p>
              <p className="mt-2">By using the Service, you consent to the collection and processing of your information as described in the Privacy Policy.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">7. Service Availability</h2>
              <p>We strive to maintain reliable service but do not guarantee uninterrupted availability.</p>
              <p className="mt-2">Moody may:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Modify features</li>
                <li>Update functionality</li>
                <li>Suspend service temporarily for maintenance</li>
                <li>Discontinue certain features</li>
              </ul>
              <p className="mt-2 text-sm text-slate-500">Without prior notice.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">8. Data Deletion &amp; Account Termination</h2>
              <p>You may delete:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Individual journal entries</li>
                <li>Uploaded photos</li>
                <li>Your entire account</li>
              </ul>
              <p className="mt-2">Upon account deletion, associated data will be permanently removed from active systems (subject to technical backup retention policies).</p>
              <p className="mt-2">We reserve the right to suspend or terminate accounts that violate these Terms.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">9. Third-Party Services</h2>
              <p>Moody relies on third-party providers including:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Firebase</li>
                <li>Cloudinary</li>
                <li>Google Gemini API</li>
                <li>Upstash Redis</li>
              </ul>
              <p className="mt-2 text-sm text-slate-500">We are not responsible for outages, data loss, or security incidents caused by these third-party services.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">10. Intellectual Property</h2>
              <p>All rights, title, and interest in the Moody application — including branding, UI, and design — are owned by Moody.</p>
              <p className="mt-2">You may not:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Reverse engineer</li>
                <li>Copy</li>
                <li>Redistribute</li>
                <li>Exploit the platform</li>
              </ul>
              <p className="mt-2 text-sm text-slate-500">Without written permission.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">11. Limitation of Liability</h2>
              <p>To the maximum extent permitted by law:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Moody is provided &ldquo;as is&rdquo; and &ldquo;as available.&rdquo;</li>
              </ul>
              <p className="mt-2">We are not liable for:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Decisions made based on AI insights</li>
                <li>Emotional or psychological outcomes</li>
                <li>Data loss due to third-party provider failures</li>
                <li>Indirect, incidental, or consequential damages</li>
              </ul>
              <p className="mt-2 font-semibold text-slate-900 dark:text-slate-100">Your use of Moody is at your own risk.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">12. Indemnification</h2>
              <p>You agree to indemnify and hold Moody harmless from any claims, damages, or liabilities arising from:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Your misuse of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your uploaded content</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">13. Changes to These Terms</h2>
              <p>We may update these Terms periodically. Continued use of Moody after updates constitutes acceptance of the revised Terms.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">14. Governing Law</h2>
              <p>These Terms shall be governed by and interpreted in accordance with the laws of the Republic of India, without regard to conflict of law principles.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">15. Contact</h2>
              <p>If you have questions regarding these Terms:</p>
              <ul className="list-none mt-2 space-y-1">
                <li>Email: <a href="mailto:holaaditya123@gmail.com" className="text-indigo-500 hover:text-indigo-400 font-medium transition duration-200">holaaditya123@gmail.com</a></li>
                <li>X: <a href="https://x.com/Tema_roon" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-400 font-medium transition duration-200">@Tema_roon</a></li>
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
