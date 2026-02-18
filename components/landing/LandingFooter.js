import Link from "next/link";

export default function LandingFooter() {
  return (
    <footer className="w-screen relative left-1/2 -translate-x-1/2 bg-slate-950 border-t border-slate-800">
      <div className="max-w-[1200px] mx-auto px-6 sm:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          {/* Logo */}
          <div className="flex items-center gap-1.5">
            <span className="fugaz text-lg text-white">
              <span className="text-indigo-400">✦</span> Moody
            </span>
          </div>

          {/* Copyright */}
          <p className="text-slate-500 text-xs sm:text-sm">
            © 2026 Moody Inc. All rights reserved.
          </p>

          {/* Links */}
          <div className="flex items-center gap-5">
            <Link
              href="#"
              className="text-slate-400 hover:text-white transition-colors duration-200"
            >
              Privacy
            </Link>
            <Link
              href="#"
              className="text-slate-400 hover:text-white transition-colors duration-200"
            >
              Terms
            </Link>
            <Link
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition-colors duration-200"
            >
              Twitter
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
