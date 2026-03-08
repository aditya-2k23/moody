"use client";
import LandingFooter from "@/components/landing/LandingFooter";
import { ShieldAlert, AlignLeft, ChevronDown, ChevronUp, Link } from "lucide-react";
import { useState, useEffect } from "react";

export default function TermsOfService() {
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

  const SectionTitle = ({ title, id, number, hideNumber }) => {
    const handleCopyLink = () => {
      const url = `${window.location.origin}${window.location.pathname}#${id}`;
      navigator.clipboard.writeText(url);
    };

    return (
      <div className="w-full flex items-center gap-2 group mb-4 text-slate-900 dark:text-slate-100 hover:text-indigo-500 dark:hover:text-indigo-400 transition-all duration-200 cursor-pointer" onClick={handleCopyLink}>
        <h2
          id={id}
          className="text-xl sm:text-2xl font-bold "
        >
          {!hideNumber && `${number}. `}{title}
        </h2>

        <span
          className="opacity-0 group-hover:opacity-100 transition"
          aria-label="Copy link to section"
        >
          <Link />
        </span>
      </div>
    );
  };

  const tocItems = [
    { id: "intro", title: "Introduction" },
    { id: "section1", title: "1. Description of the Service" },
    { id: "section2", title: "2. Eligibility" },
    { id: "section3", title: "3. Account Registration & Security" },
    { id: "section4", title: "4. User Content & Data Ownership" },
    { id: "section5", title: "5. Acceptable Use Policy" },
    { id: "section6", title: "6. AI Insights Disclaimer" },
    { id: "section7", title: "7. Service Availability & Usage Limits" },
    { id: "section8", title: "8. Data Retention & Account Deletion" },
    { id: "section9", title: "9. Third-Party Services" },
    { id: "section10", title: "10. Intellectual Property" },
    { id: "section11", title: "11. Limitation of Liability" },
    { id: "section12", title: "12. Indemnification" },
    { id: "section13", title: "13. Modifications to the Terms" },
  ];

  return (
    <main className="flex-1 flex flex-col w-full relative">
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
        <aside className={`hidden md:block w-72 shrink-0 sticky h-fit max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar transition-all duration-300 ${isScrollingDown ? 'top-6' : 'top-24'
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
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 fugaz text-indigo-500 uppercase tracking-tighter">Terms of Service</h1>
          <div className="flex flex-col sm:flex-row sm:gap-6 mb-8 text-slate-500 italic text-sm">
            <p>Effective Date: March 2026 &mdash; Version 1.0</p>
          </div>

          <div className="mb-10 p-6 pt-4 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 rounded-2xl">
            <h2 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-2">
              <span className="text-2xl"><ShieldAlert /></span> Terms at a Glance
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm sm:text-base">
              <div className="flex gap-3">
                <span className="text-indigo-500 font-bold shrink-0">1.</span>
                <p><span className="font-semibold text-slate-900 dark:text-slate-100">Not Medical Advice:</span> Moody is an AI journaling tool, NOT a diagnostic or medical service.</p>
              </div>
              <div className="flex gap-3">
                <span className="text-indigo-500 font-bold shrink-0">2.</span>
                <p><span className="font-semibold text-slate-900 dark:text-slate-100">Age Minimum:</span> You must be 13 or older to use Moody.</p>
              </div>
              <div className="flex gap-3">
                <span className="text-indigo-500 font-bold shrink-0">3.</span>
                <p><span className="font-semibold text-slate-900 dark:text-slate-100">Your Responsibility:</span> You are responsible for keeping your account secure and all activities under it.</p>
              </div>
              <div className="flex gap-3">
                <span className="text-indigo-500 font-bold shrink-0">4.</span>
                <p><span className="font-semibold text-slate-900 dark:text-slate-100">AI Processing:</span> Using insights requires sharing journal data temporarily with AI APIs like Gemini.</p>
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 italic">This is a summary for convenience. Please read the full terms below.</p>
          </div>

          <div className="space-y-12 text-slate-700 dark:text-slate-300 leading-relaxed max-w-none">
            <section id="intro" className="scroll-mt-28 w-full">
              <p className="text-lg">
                Welcome to Moody, an AI-powered mood tracking and journaling platform designed to help users reflect on their emotions and daily experiences. These Terms of Service (&quot;Terms&quot;) govern your access to and use of the Moody website, applications, and related services (collectively, the &quot;Service&quot;).
              </p>
              <div className="mt-6 p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border-l-4 border-indigo-500 shadow-sm">
                <p className="font-bold text-slate-900 dark:text-slate-100 mb-2">Binding Agreement</p>
                <p className="text-slate-700 dark:text-slate-300 italic">
                  By accessing or using Moody, you agree to be legally bound by these Terms. If you do not agree to these Terms, you must not use the Service.
                </p>
              </div>
            </section>

            <section id="section1" className="scroll-mt-28 w-full">
              <SectionTitle title="Description of the Service" id="section1" number="1" />
              <div className="space-y-4">
                <p>
                  Moody is a digital self-reflection tool that allows users to log daily moods,
                  write personal journal entries, upload images associated with memories, view
                  historical mood analytics, and receive AI-generated insights about their
                  journal entries.
                </p>

                <ul className="list-disc pl-6 space-y-1 text-slate-600 dark:text-slate-400">
                  <li>Log daily moods</li>
                  <li>Write personal journal entries</li>
                  <li>Upload photos connected to memories</li>
                  <li>View historical mood data and analytics</li>
                  <li>Receive AI-generated insights about journal entries</li>
                </ul>

                <p>
                  Moody is designed to help users better understand emotional patterns over
                  time and support personal reflection.
                </p>

                <div className="p-4 bg-amber-50 dark:bg-amber-900/15 border-l-4 border-amber-500 rounded-r-xl">
                  <p className="font-semibold">
                    Important Notice
                  </p>
                  <p className="text-sm italic">
                    Moody is not a medical service and is not intended to diagnose, treat, or
                    prevent mental health conditions. AI insights are informational and should
                    not be considered professional medical or psychological advice.
                  </p>
                </div>
              </div>
            </section>

            <section id="section2" className="scroll-mt-28 w-full">
              <SectionTitle title="Eligibility" id="section2" number="2" />
              <div className="space-y-4">
                <p>To use Moody you must meet the following requirements:</p>

                <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400">
                  <li>You must be at least 13 years old.</li>
                  <li>Users under 13 are not permitted to use the Service.</li>
                </ul>

                <p>
                  If we become aware that an account belongs to a user under the age of 13,
                  the account and any associated data may be removed from the platform.
                </p>
              </div>
            </section>

            <section id="section3" className="scroll-mt-28 w-full">
              <SectionTitle title="Account Registration and Security" id="section3" number="3" />
              <div className="space-y-4">
                <p>
                  To access certain features of Moody you may be required to create an
                  account. You are responsible for maintaining the security of your account.
                </p>

                <p className="font-semibold">User Responsibilities:</p>

                <ul className="list-disc pl-6 space-y-1 text-slate-600 dark:text-slate-400">
                  <li>Provide accurate registration information</li>
                  <li>Maintain confidentiality of login credentials</li>
                  <li>All activities that occur under your account</li>
                </ul>

                <p className="font-semibold mt-4">Security Practices:</p>

                <ul className="list-disc pl-6 space-y-1 text-slate-600 dark:text-slate-400">
                  <li>Firebase Authentication security infrastructure</li>
                  <li>Encrypted connections using modern TLS protocols</li>
                  <li>Password hashing and authentication managed by Firebase</li>
                </ul>

                <p>
                  If you believe your account has been compromised, you should notify us
                  immediately and change your credentials.
                </p>
              </div>
            </section>

            <section id="section4" className="scroll-mt-28 w-full">
              <SectionTitle title="User Content and Data Ownership" id="section4" number="4" />
              <div className="space-y-4">
                <p>
                  Users retain ownership of all content they submit to Moody including
                  journal entries, mood logs, and uploaded photos.
                </p>

                <p>
                  By submitting content to Moody you grant a limited, non-exclusive license
                  allowing the platform to store, process, and analyze this data solely for
                  the purpose of providing the Service.
                </p>

                <p>
                  Moody does not claim ownership over your personal content.
                </p>
              </div>
            </section>

            <section id="section5" className="scroll-mt-28 w-full">
              <SectionTitle title="Acceptable Use Policy" id="section5" number="5" />

              <div className="space-y-4">
                <p>You agree not to misuse the Moody platform.</p>

                <p className="font-semibold">Technical Misuse</p>

                <ul className="list-disc pl-6 space-y-1 text-slate-600 dark:text-slate-400">
                  <li>Automated scraping or crawling</li>
                  <li>Reverse engineering internal systems</li>
                  <li>Bypassing platform rate limits</li>
                  <li>Attempting to exploit vulnerabilities</li>
                </ul>

                <p className="font-semibold mt-4">Account Misuse</p>

                <ul className="list-disc pl-6 space-y-1 text-slate-600 dark:text-slate-400">
                  <li>Creating spam accounts</li>
                  <li>Selling or transferring accounts</li>
                  <li>Impersonating individuals or platform administrators</li>
                </ul>

                <p>
                  Violations of these policies may result in account suspension or
                  termination.
                </p>
              </div>
            </section>

            <section id="section6" className="scroll-mt-28 w-full">
              <SectionTitle title="AI Insights Disclaimer" id="section6" number="6" />
              <div className="space-y-4">
                <p>
                  Moody uses artificial intelligence to generate insights from journal
                  entries. These insights are generated algorithmically and may be
                  inaccurate, incomplete, or misleading.
                </p>

                <p>
                  Moody does not guarantee the accuracy of AI generated insights.
                </p>

                <p>
                  Users should not rely on Moody for medical, psychological, or professional
                  mental health advice.
                </p>
              </div>
            </section>

            <section id="section7" className="scroll-mt-28 w-full">
              <SectionTitle title="Service Availability and Usage Limits" id="section7" number="7" />
              <div className="space-y-4">
                <p>
                  To maintain platform stability Moody may apply certain usage limits.
                </p>

                <ul className="list-disc pl-6 space-y-1 text-slate-600 dark:text-slate-400">
                  <li>AI insight requests may be limited per day</li>
                  <li>Journal entries may be subject to storage limits</li>
                  <li>Image uploads may be limited per day</li>
                </ul>

                <p>
                  These limits may change as the platform evolves.
                </p>
              </div>
            </section>

            <section id="section8" className="scroll-mt-24 w-full">
              <SectionTitle title="Data Retention and Account Deletion" id="section8" number="8" />

              <div className="space-y-4">
                <p>
                  Users may request deletion of their account and all associated data at any time.
                </p>

                <p className="font-semibold">When an account is deleted:</p>

                <ul className="list-disc pl-6 space-y-1 text-slate-600 dark:text-slate-400">
                  <li>Active database records are removed within approximately 30 days.</li>
                  <li>Backup systems may retain data for up to 90 days before permanent deletion.</li>
                  <li>Minimal system logs may be retained for security and compliance purposes.</li>
                </ul>
              </div>
            </section>

            <section id="section9" className="scroll-mt-24 w-full">
              <SectionTitle title="Third-Party Services" id="section9" number="9" />

              <div className="space-y-4">
                <p>
                  Moody relies on several external infrastructure providers to operate the
                  platform.
                </p>

                <p className="font-semibold">These services include:</p>

                <ul className="list-disc pl-6 space-y-1 text-slate-600 dark:text-slate-400">
                  <li>Firebase</li>
                  <li>Google Gemini</li>
                  <li>Cloudinary</li>
                  <li>Upstash Redis</li>
                </ul>

                <p>
                  Moody cannot guarantee the availability, performance, or reliability of
                  these third-party services. Any service disruptions caused by these
                  providers are outside Moody&apos;s direct control.
                </p>
              </div>
            </section>

            <section id="section10" className="scroll-mt-24 w-full">
              <SectionTitle title="Intellectual Property" id="section10" number="10" />

              <div className="space-y-4">
                <p>
                  All platform elements including the following are the intellectual
                  property of Moody or its contributors unless otherwise stated:
                </p>

                <ul className="list-disc pl-6 space-y-1 text-slate-600 dark:text-slate-400">
                  <li>Application code</li>
                  <li>Design systems</li>
                  <li>Branding</li>
                  <li>Logos</li>
                  <li>User interface elements</li>
                </ul>

                <p>
                  Open source libraries used by Moody are credited in the project&apos;s public
                  documentation.
                </p>
              </div>
            </section>

            <section id="section11" className="scroll-mt-24 w-full">
              <SectionTitle title="Limitation of Liability" id="section11" number="11" />

              <div className="space-y-4">
                <p>
                  Moody is provided on an <strong>&quot;as is&quot;</strong> and{" "}
                  <strong>&quot;as available&quot;</strong> basis.
                </p>

                <p>
                  To the maximum extent permitted by law, Moody and its creators shall not
                  be liable for:
                </p>

                <ul className="list-disc pl-6 space-y-1 text-slate-600 dark:text-slate-400">
                  <li>Data loss</li>
                  <li>Emotional distress</li>
                  <li>Service interruptions</li>
                  <li>Damages resulting from misuse of the platform</li>
                  <li>Indirect or incidental damages</li>
                </ul>

                <p>
                  Users assume full responsibility for their use of the Service.
                </p>
              </div>
            </section>

            <section id="section12" className="scroll-mt-24 w-full">
              <SectionTitle title="Indemnification" id="section12" number="12" />

              <div className="space-y-4">
                <p>
                  You agree to indemnify and hold Moody and its creators harmless from any
                  claims, damages, or legal disputes arising from:
                </p>

                <ul className="list-disc pl-6 space-y-1 text-slate-600 dark:text-slate-400">
                  <li>Your misuse of the Service</li>
                  <li>Your violation of these Terms</li>
                  <li>Your infringement of third-party rights</li>
                </ul>
              </div>
            </section>

            <section id="section13" className="scroll-mt-24 w-full">
              <SectionTitle title="Modifications to the Terms" id="section13" number="13" />

              <div className="space-y-4">
                <p>
                  Moody may update these Terms periodically.
                </p>

                <p className="font-semibold">When changes are made:</p>

                <ul className="list-disc pl-6 space-y-1 text-slate-600 dark:text-slate-400">
                  <li>The &quot;Last Updated&quot; date will be modified.</li>
                  <li>
                    Continued use of the Service after updates indicates acceptance of the
                    revised Terms.
                  </li>
                </ul>

                <p>
                  Users are encouraged to review these Terms periodically.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
      <LandingFooter />
    </main>
  );
}
