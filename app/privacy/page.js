"use client";
import LandingFooter from "@/components/landing/LandingFooter";
import { ShieldCheck, ChevronDown, ChevronUp, AlignLeft, Link } from "lucide-react";
import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function PrivacyPolicy() {
  const [openSections, setOpenSections] = useState({
    intro: true,
    section1: true,
    section2: false,
    section3: false,
    section4: false,
    section5: false,
    section6: false,
    section7: false,
    section8: false,
    section9: false,
    section10: false,
    section11: false,
    appendix: false,
    section12: false,
    section13: false,
  });

  const [activeSection, setActiveSection] = useState("intro");
  const [isMobileTocOpen, setIsMobileTocOpen] = useState(false);
  const [isScrollingDown, setIsScrollingDown] = useState(false);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // If we are at the very top, always show navbar gap
      if (currentScrollY < 80) {
        setIsScrollingDown(false);
      }
      // Add a small threshold to avoid jittering
      else if (Math.abs(currentScrollY - lastScrollY) > 5) {
        setIsScrollingDown(currentScrollY > lastScrollY);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          const closest = visibleEntries.reduce((prev, curr) => {
            return Math.abs(curr.boundingClientRect.top) < Math.abs(prev.boundingClientRect.top) ? curr : prev;
          });
          setActiveSection(closest.target.id);
        }
      },
      { rootMargin: "0px 0px -60% 0px", threshold: 0 }
    );

    const sectionElements = document.querySelectorAll("section[id]");
    sectionElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const handleTocClick = (id) => {
    setOpenSections((prev) => ({ ...prev, [id]: true }));
    setActiveSection(id);
    setIsMobileTocOpen(false);

    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        const y = element.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    }, 50);
  };

  const toggleSection = (id) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const SectionTitle = ({ title, id, number, hideNumber }) => {
    const handleCopyLink = (e) => {
      e.stopPropagation();
      const url = `${window.location.origin}${window.location.pathname}#${id}`;
      navigator.clipboard.writeText(url).then(() => {
        toast.success("Link copied to clipboard!", {
          duration: 3000,
        });
      }).catch((err) => {
        console.error("Failed to copy link:", err);
      })
    };

    return (
      <div className="flex w-full items-center gap-2 group mb-4">
        <button
          onClick={() => toggleSection(id)}
          className="flex-1 flex items-center justify-between text-left group/button"
        >
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 group-hover/button:text-indigo-500 transition-colors">
            {!hideNumber && `${number}. `}{title}
          </h2>
          <div className="text-slate-400 group-hover/button:text-indigo-500 transition-colors ease-linear ml-4 shrink-0">
            {openSections[id] ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          </div>
        </button>

        <button
          onClick={handleCopyLink}
          className="opacity-0 group-hover:opacity-100 transition text-slate-400 hover:text-indigo-500"
          aria-label="Copy link to section"
        >
          <Link size={20} />
        </button>
      </div>
    );
  };

  const tocItems = [
    { id: "intro", title: "Introduction" },
    { id: "section1", title: "1. Information We Collect" },
    { id: "section2", title: "2. How We Use Your Info" },
    { id: "section3", title: "3. Age Requirements" },
    { id: "section4", title: "4. Legal Basis (GDPR)" },
    { id: "section5", title: "5. Third-Party Providers" },
    { id: "section6", title: "6. Data Storage & Security" },
    { id: "section7", title: "7. Retention & Deletion" },
    { id: "section8", title: "8. Rights & Portability" },
    { id: "section9", title: "9. International Transfers" },
    { id: "section10", title: "10. AI Disclaimer" },
    { id: "section11", title: "11. Cookies & Storage" },
    { id: "appendix", title: "Appendix: Data Flow" },
    { id: "section12", title: "12. Changes to Policy" },
    { id: "section13", title: "13. Contact Us" },
  ];

  return (
    <main className="flex-1 flex flex-col w-full relative">
      <Toaster position="bottom-right" />
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 !pt-4 flex-1 mb-8 flex flex-col md:flex-row gap-8 relative">

        {/* Mobile TOC Toggle */}
        <div className={`md:hidden sticky z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm pb-4 transition-all duration-300 ${isScrollingDown ? 'top-4' : 'top-[72px]'
          }`}>
          <button
            onClick={() => setIsMobileTocOpen(!isMobileTocOpen)}
            className="flex items-center justify-between w-full text-indigo-600 dark:text-indigo-400 font-bold"
          >
            <span className="flex items-center gap-2"><AlignLeft size={20} /> On this page</span>
            {isMobileTocOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          {isMobileTocOpen && (
            <div className="mt-4 flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {tocItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleTocClick(item.id)}
                  className={`group flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${activeSection === item.id
                    ? "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                >
                  <span className="truncate text-left">{item.title}</span>
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all ${activeSection === item.id ? "bg-indigo-500 scale-125" : ""}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Sidebar TOC */}
        <aside className={`hidden md:block w-[17rem] shrink-0 sticky h-fit max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar transition-all duration-300 ${isScrollingDown ? 'top-6' : 'top-24'
          }`}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <AlignLeft size={20} className="text-indigo-500" /> Contents
            </h3>
            <nav className="flex flex-col gap-0.5">
              {tocItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleTocClick(item.id)}
                  className={`group flex items-center justify-between px-2.5 py-1.5 rounded-xl text-sm transition-all duration-200 ${activeSection === item.id
                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-bold translate-x-1.5"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  title={item.title.replace(/^\d+\.\s/, "")}
                >
                  <span className="truncate text-left">{item.title}</span>
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all ${activeSection === item.id ? "bg-indigo-500 scale-125" : ""}`} />
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 lg:p-12 shadow-sm min-w-0">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 fugaz text-indigo-500 uppercase">Privacy Policy</h1>
          <div className="flex flex-col sm:flex-row sm:gap-6 mb-8 text-slate-500 italic text-sm">
            <p>Version 1.0 &mdash; March 2026</p>
          </div>

          <div className="mb-10 p-6 pt-4 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 rounded-2xl">
            <h2 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-2">
              <span className="text-2xl"><ShieldCheck /></span> Privacy at a Glance
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm sm:text-base">
              <div className="flex gap-3">
                <span className="text-indigo-500 font-bold shrink-0">1.</span>
                <p><span className="font-semibold text-slate-900 dark:text-slate-100">Your Data is Yours:</span> We don&apos;t sell your personal information or journal entries to anyone.</p>
              </div>
              <div className="flex gap-3">
                <span className="text-indigo-500 font-bold shrink-0">2.</span>
                <p><span className="font-semibold text-slate-900 dark:text-slate-100">Secure Storage:</span> All your mood data and journals are encrypted and stored in secure Firebase databases.</p>
              </div>
              <div className="flex gap-3">
                <span className="text-indigo-500 font-bold shrink-0">3.</span>
                <p><span className="font-semibold text-slate-900 dark:text-slate-100">AI Privacy:</span> Journal entries sent for AI analysis are not used to train global AI models.</p>
              </div>
              <div className="flex gap-3">
                <span className="text-indigo-500 font-bold shrink-0">4.</span>
                <p><span className="font-semibold text-slate-900 dark:text-slate-100">Full Control:</span> You can export your data or delete your account permanently at any time.</p>
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 italic">This is a summary for convenience. Please read the full policy below for complete details.</p>
          </div>

          <div className="space-y-6 text-slate-700 dark:text-slate-300 leading-relaxed max-w-none">
            <section id="intro" className="pb-2 border-b border-slate-100 dark:border-slate-800/50 scroll-mt-28 w-full">
              <p className="text-lg">
                Moody (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is an AI-powered mood tracking application designed to help users better understand their emotional patterns. We are committed to protecting your privacy and being transparent about how your information is collected, used, and stored.
              </p>
              <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">
                By using Moody, you agree to the practices described in this Privacy Policy.
              </p>
            </section>

            <section id="section1" className="space-y-4 pt-4 scroll-mt-28 w-full">
              <SectionTitle title="Information We Collect" id="section1" number="1" />
              {openSections.section1 && (
                <div className="pt-4 animate-in fade-in slide-in-from-top-2 duration-300 transition-all">
                  <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">1.1 Account Information</h3>
                  <p>When you create an account using Firebase Authentication, we collect:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Email address</li>
                    <li>Unique user ID</li>
                    <li>Authentication metadata (e.g., login timestamps)</li>
                  </ul>
                  <p className="mt-2 text-sm text-slate-500">Passwords are securely hashed and managed by Firebase Authentication. We do not have access to your plain-text password.</p>

                  <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-8 mb-3">1.2 Profile Information</h3>
                  <p>During sign-up or profile customization, you may provide:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Full name</li>
                    <li>Age</li>
                    <li>Gender</li>
                    <li>Avatar photo (optional)</li>
                  </ul>
                  <p className="mt-2 text-sm text-slate-500">Avatar images are stored securely using Cloudinary (if uploaded).</p>
                  <p className="mt-2">Providing profile information beyond email is optional, except where required to complete registration. We use this information only to personalize your experience (e.g., tailored AI insights, greetings, or demographic-based analysis features).</p>

                  <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-8 mb-3">1.3 Mood &amp; Journal Data</h3>
                  <p>When using Moody, we store:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Mood selections</li>
                    <li>Journal entries</li>
                    <li>Timestamps</li>
                    <li>Streak and activity metrics</li>
                  </ul>
                  <p className="mt-2 text-sm text-slate-500">This data is stored in Firebase Firestore and linked to your account.</p>

                  <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-8 mb-3">1.4 AI Processing</h3>
                  <p>When you request AI insights:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Your journal content (and relevant profile context, if applicable) may be securely sent to the Google Gemini API for analysis.</li>
                    <li>AI-generated responses may be cached using Upstash Redis for up to 7 days to improve performance.</li>
                  </ul>
                  <p className="mt-2">Cached entries are automatically deleted after expiration. <span className="font-semibold text-slate-900 dark:text-slate-100">Journal content sent to Gemini API is processed according to Google&apos;s
                    Gemini API Terms of Service. Google states that data sent via their
                    API is not used to train their models, but you should review their
                    terms at <a className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline" href="https://developers.google.com/terms">Gemini APIs Terms of Service</a> for the most current policies.</span></p>

                  <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-8 mb-3">1.5 Uploaded Images</h3>
                  <p>If you upload Avatar photos or Daily memory images, these are stored using secure, non-guessable URLs via Cloudinary. We store only secure references linked to your account.</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1 text-sm sm:text-base">
                    <li>URLs are not indexed or listed publicly</li>
                    <li>Access requires knowledge of the specific image URL</li>
                    <li>We do not provide a &ldquo;share&rdquo; feature that makes images publicly discoverable</li>
                    <li>You can request deletion of uploaded images at any time</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-8 mb-3">1.6 Technical &amp; Usage Data</h3>
                  <p>We may collect limited technical data such as Browser type, Device type, Error logs, and Performance metrics.</p>
                  <p className="mt-2 text-sm text-slate-500">This data is used strictly for reliability, debugging, and improving the service.</p>

                  <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-8 mb-3">1.7 Session Data</h3>
                  <p>To provide a persistent and secure experience, we manage session information:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1 text-sm sm:text-base">
                    <li>Firebase Authentication tokens manage your login sessions</li>
                    <li>Sessions expire after 30 days of inactivity (managed by Firebase)</li>
                    <li>You can manually log out from the Dashboard page at any time</li>
                    <li>Active sessions are stored client-side using secure, encrypted cookies</li>
                  </ul>
                  <p className="mt-2 text-sm text-slate-500">Upon logout, all session identifiers are cleared from your device.</p>

                  <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-8 mb-3">1.8 Analytics Data</h3>
                  <p>We use <span className="font-semibold text-slate-900 dark:text-slate-100">PostHog</span> to collect anonymized usage analytics. This helps us understand how Moody is being used so we can improve the experience. Collected data including:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1 text-sm sm:text-base">
                    <li>Page views and interactions with specific features</li>
                    <li>Anonymized demographic trends (e.g., age ranges, not individual specific ages)</li>
                    <li>Error rates and general performance metrics</li>
                    <li>Device-level technical information (Browser type, Screen resolution)</li>
                  </ul>
                  <p className="mt-4">This data is <span className="font-bold">anonymized</span> and cannot be used to identify you personally. We do not send your email address or journal contents to our analytics provider.</p>
                  <p className="mt-2 text-sm text-slate-500">You can opt out of analytics tracking at any time via <span className="font-medium">Settings &rarr; Privacy &rarr; Analytics</span>.</p>
                </div>
              )}
            </section>

            <section id="section2" className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/50 scroll-mt-28 w-full">
              <SectionTitle title="How We Use Your Information" id="section2" number="2" />
              {openSections.section2 && (
                <div className="pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <p>We use your information to:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1 mb-4">
                    <li>Provide mood tracking services</li>
                    <li>Personalize your dashboard experience</li>
                    <li>Generate AI-powered insights</li>
                    <li>Maintain statistics and streak tracking</li>
                    <li>Improve platform performance and security</li>
                  </ul>
                  <p className="inline-block px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg font-semibold uppercase tracking-wider text-sm mt-2">We do not sell, rent, or trade your personal data.</p>
                </div>
              )}
            </section>

            <section id="section3" className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/50 scroll-mt-28 w-full">
              <SectionTitle title="Age Requirements" id="section3" number="3" />
              {openSections.section3 && (
                <div className="pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <p>Moody is not intended for individuals under 13 years old.</p>
                  <p className="mt-2 text-slate-600 dark:text-slate-400">If you are under the required legal age in your jurisdiction, you must not use this service. If we discover that we have collected data from a child without proper consent, we will delete it promptly.</p>
                </div>
              )}
            </section>

            <section id="section4" className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/50 scroll-mt-28 w-full">
              <SectionTitle title="Legal Basis for Processing (GDPR Notice)" id="section4" number="4" />
              {openSections.section4 && (
                <div className="pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <p>If you are located in the European Economic Area (EEA), we process your data based on:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Your consent</li>
                    <li>Contractual necessity (to provide services)</li>
                    <li>Legitimate interests (security and improvement)</li>
                  </ul>
                  <p className="mt-4 text-slate-500">You may withdraw consent at any time by deleting your account.</p>
                </div>
              )}
            </section>

            <section id="section5" className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/50 scroll-mt-28 w-full">
              <SectionTitle title="Third-Party Service Providers" id="section5" number="5" />
              {openSections.section5 && (
                <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <p className="mb-4">We use the following services to operate Moody. These providers have their own privacy policies and security practices:</p>

                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                      <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Service</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Purpose</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Data Shared</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Privacy Policy</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm text-slate-600 dark:text-slate-400">
                        <tr>
                          <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">Firebase (Google)</td>
                          <td className="px-4 py-3">Auth, DB</td>
                          <td className="px-4 py-3">Email, UID, Mood/Journal</td>
                          <td className="px-4 py-3"><a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline">Link</a></td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">Cloudinary</td>
                          <td className="px-4 py-3">Image Storage</td>
                          <td className="px-4 py-3">Avatar/Memory Images, UID</td>
                          <td className="px-4 py-3"><a href="https://cloudinary.com/privacy" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline">Link</a></td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">Google Gemini API</td>
                          <td className="px-4 py-3">AI Insights</td>
                          <td className="px-4 py-3">Journal Text, Opt-in Context</td>
                          <td className="px-4 py-3"><a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline">Link</a></td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">Upstash Redis</td>
                          <td className="px-4 py-3">AI Cache</td>
                          <td className="px-4 py-3">Gemini Responses (7-day TTL)</td>
                          <td className="px-4 py-3"><a href="https://upstash.com/trust/privacy.pdf" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline">Link</a></td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">Netlify</td>
                          <td className="px-4 py-3">Hosting</td>
                          <td className="px-4 py-3">IP Address, Browser info</td>
                          <td className="px-4 py-3"><a href="https://www.netlify.com/privacy/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline">Link</a></td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">PostHog</td>
                          <td className="px-4 py-3">Analytics</td>
                          <td className="px-4 py-3">Anonymized interactions, metrics</td>
                          <td className="px-4 py-3"><a href="https://posthog.com/privacy" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline">Link</a></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>

            <section id="section6" className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/50 scroll-mt-28 w-full">
              <SectionTitle title="Data Storage & Security" id="section6" number="6" />
              {openSections.section6 && (
                <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <p>Your data is stored using trusted third-party infrastructure providers:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Firebase (Authentication &amp; Firestore)</li>
                    <li>Cloudinary (Image storage)</li>
                    <li>Google Gemini API (AI processing)</li>
                    <li>Upstash Redis (AI caching)</li>
                  </ul>
                  <p className="mt-4">Security measures include HTTPS encryption, Authentication-based access controls, and Limited AI cache duration. However, no system is completely secure.</p>

                  <div className="mt-4 p-4 bg-indigo-50/80 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800/30">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Technical Data Access Controls</h3>
                    <ul className="list-disc pl-6 space-y-1 text-sm sm:text-base">
                      <li>Firestore security rules enforce user-level authentication</li>
                      <li>Users can only access their own mood entries and journals</li>
                      <li>Admin access is logged and restricted to essential maintenance</li>
                      <li>All database queries require valid Firebase Authentication tokens</li>
                    </ul>
                  </div>
                </div>
              )}
            </section>

            <section id="section7" className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/50 scroll-mt-28 w-full">
              <SectionTitle title="Data Retention & Deletion" id="section7" number="7" />
              {openSections.section7 && (
                <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">7.1 Data Retention</h3>
                  <p>We retain your data:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1 text-slate-600 dark:text-slate-400">
                    <li>While your account is active</li>
                    <li>Until you delete specific entries</li>
                    <li>Until you delete your account</li>
                  </ul>
                  <p className="mt-2 text-sm text-indigo-500 dark:text-indigo-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis">AI cache data is automatically deleted after expiration (maximum 7 days).</p>

                  <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">7.2 Account Deletion</h3>
                  <p>You can delete your account at any time via <span className="font-medium text-slate-900 dark:text-slate-100">Settings &rarr; Delete Account</span>. This process is <span className="text-red-600 dark:text-red-400 font-bold uppercase">irreversible</span>.</p>

                  <p className="mt-4 font-medium italic">Upon deletion:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1 text-sm sm:text-base text-slate-600 dark:text-slate-400">
                    <li>All mood entries and journals are permanently deleted from our primary database within 30 days</li>
                    <li>Cached AI responses are deleted within 7 days</li>
                    <li>Uploaded images are removed from Cloudinary within 30 days</li>
                    <li>Your email may be retained for up to 90 days in a hashed format to prevent re-registration fraud</li>
                    <li>Aggregated, anonymized analytics may be retained for service optimization</li>
                  </ul>
                </div>
              )}
            </section>

            <section id="section8" className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/50 scroll-mt-28 w-full">
              <SectionTitle title="Your Rights & Data Portability" id="section8" number="8" />
              {openSections.section8 && (
                <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <p>Depending on your location, you may have the right to Access your personal data, Request correction, Request deletion, Request export of your data, or Withdraw consent.</p>

                  <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">8.1 Data Export Format</h3>
                  <p>Upon request, we will provide your data in a machine-readable JSON format, including:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1 text-sm sm:text-base text-slate-600 dark:text-slate-400">
                    <li>All mood entries with associated timestamps</li>
                    <li>Full journal text content</li>
                    <li>Profile information (name, age, gender, etc.)</li>
                    <li>Activity and streak statistics</li>
                  </ul>
                  <p className="mt-4 italic text-sm text-indigo-500 dark:text-indigo-400">Exported data will be sent to your registered email address within 30 days of a verified request.</p>

                  <p className="mt-4">You can update or delete your profile information at any time from your account settings.</p>
                  <p className="mt-4">For assistance, contact: <a href="mailto:holaaditya123@gmail.com" className="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition duration-200 hover:underline">holaaditya123@gmail.com</a></p>
                </div>
              )}
            </section>

            <section id="section9" className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/50 scroll-mt-28 w-full">
              <SectionTitle title="International Data Transfers" id="section9" number="9" />
              {openSections.section9 && (
                <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <p>Your information may be processed and stored on servers located outside your country of residence, including the United States.</p>
                  <p className="mt-2">By using Moody, you consent to these transfers.</p>
                </div>
              )}
            </section>

            <section id="section10" className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/50 scroll-mt-28 w-full">
              <SectionTitle title="AI-Generated Content Disclaimer" id="section10" number="10" />
              {openSections.section10 && (
                <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-4">
                    <p>AI-powered insights are automated and provided to help you identify emotional patterns. However, they come with important limitations:</p>

                    <ul className="list-disc pl-6 space-y-2">
                      <li>AI insights are generated by Google Gemini and may contain errors or &ldquo;hallucinations.&rdquo;</li>
                      <li>The AI does not have access to your full mental health history or medical records.</li>
                      <li>Insights are generated based solely on the specific journal entries you provide for analysis.</li>
                      <li className="font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-tight">This is NOT a medical diagnosis or mental health treatment tool.</li>
                    </ul>

                    <div className="p-4 bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 text-slate-800 dark:text-slate-200 rounded-lg">
                      <span className="font-bold block mb-2 text-slate-900 dark:text-slate-100 italic">Emergency Assistance:</span>
                      If you are experiencing a mental health crisis or emergency, please contact professional services immediately:
                      <br />• <span className="font-semibold text-slate-900 dark:text-slate-100">Kiran Helpline:</span> <span className="text-indigo-600 dark:text-indigo-400 font-medium">1800-599-0019</span> (24/7 toll-free, India-wide)
                      <br />• <span className="font-semibold text-slate-900 dark:text-slate-100">Tele-MANAS:</span> <span className="text-indigo-600 dark:text-indigo-400 font-medium">14416 <span className="text-black dark:text-white">or</span> 1800-91-4416</span> (24/7 mental health support)
                      <br />• <span className="font-semibold text-slate-900 dark:text-slate-100">AASRA:</span> <span className="text-indigo-600 dark:text-indigo-400 font-medium">022-27546669</span>
                      <br />• <span className="font-semibold text-slate-900 dark:text-slate-100">Vandrevala Foundation:</span> <span className="text-indigo-500 dark:text-indigo-400 font-medium">9999666555</span>
                      <br />• <span className="font-semibold text-slate-900 dark:text-slate-100">International Support:</span> <a href="https://www.iasp.info/resources/Crisis_Centres/" target="_blank" rel="noopener noreferrer" className="text-indigo-500 dark:text-indigo-400 hover:underline">Find local crisis centers via IASP</a>
                    </div>

                    <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">By using the AI features in Moody, you acknowledge and accept these limitations.</p>
                  </div>
                </div>
              )}
            </section>

            <section id="section11" className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/50 scroll-mt-28 w-full">
              <SectionTitle title="Cookies and Local Storage" id="section11" number="11" />
              {openSections.section11 && (
                <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <p>Moody uses the following browser storage to provide a stable and secure experience:</p>

                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mt-4 mb-2">Essential Cookies:</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Firebase Authentication tokens (required for login)</li>
                    <li>Session persistence data</li>
                  </ul>

                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mt-4 mb-2">Local Storage:</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>User preferences (theme, language)</li>
                    <li>Temporary form data (to prevent data loss)</li>
                  </ul>

                  <p className="mt-4 text-sm text-slate-500 italic">You can clear this data through your browser settings, but doing so will log you out and reset your local preferences.</p>
                </div>
              )}
            </section>

            <section id="appendix" className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 scroll-mt-28 w-full">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Appendix: Technical Data Flow</h2>
              <div className="space-y-4 text-sm sm:text-base">
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200">1. Authentication Flow:</h3>
                  <p className="font-mono text-xs sm:text-sm bg-white dark:bg-slate-950 p-2 rounded mt-1">User &rarr; Next.js Frontend &rarr; Firebase Auth &rarr; Firestore (user profile)</p>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200">2. Mood Entry Flow:</h3>
                  <p className="font-mono text-xs sm:text-sm bg-white dark:bg-slate-950 p-2 rounded mt-1">User &rarr; Next.js &rarr; Firestore (write with security rules validation)</p>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200">3. AI Insight Flow:</h3>
                  <p className="font-mono text-xs sm:text-sm bg-white dark:bg-slate-950 p-2 rounded mt-1">User Request &rarr; Next.js API Route &rarr; Check Upstash Cache &rarr; (if miss) &rarr; Gemini API &rarr; Cache Response &rarr; Return to User</p>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200">4. Image Upload Flow:</h3>
                  <p className="font-mono text-xs sm:text-sm bg-white dark:bg-slate-950 p-2 rounded mt-1">User &rarr; Cloudinary Upload Widget &rarr; Cloudinary CDN &rarr; Store URL in Firestore &rarr; Display via Next.js Image component</p>
                </div>
                <p className="text-xs text-slate-500 mt-4 italic">All connections are encrypted using industry-standard HTTPS/TLS 1.3 protocols.</p>
              </div>
            </section>

            <section id="section12" className="scroll-mt-28 w-full pt-4 border-t border-slate-100 dark:border-slate-800/50">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">12. Changes to This Policy</h2>
              <p>We may update this Privacy Policy periodically. Changes will be reflected with a revised &ldquo;Last Updated&rdquo; date.</p>
            </section>

            <section id="section13" className="border-t border-slate-200 dark:border-slate-800 pt-8 scroll-mt-28 w-full">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">13. Contact Us</h2>
              <p>If you have questions about this Privacy Policy, please contact us at:</p>
              <ul className="list-none mt-4 space-y-2">
                <li>Email: <a href="mailto:holaaditya123@gmail.com" className="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-500 font-medium transition duration-200 hover:underline">holaaditya123@gmail.com</a></li>
                <li>X: <a href="https://x.com/Tema_roon" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-500 font-medium transition duration-200">@Tema_roon</a></li>
                <li>Website: <a href="https://moody-adi.netlify.app" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-500 font-medium transition duration-200">https://moody-adi.netlify.app</a></li>
              </ul>
            </section>
          </div>
        </div>
      </div>

      <LandingFooter />
    </main>
  );
}
