import Link from "next/link";
import { ExternalLink } from "lucide-react";

export default function TechStack() {
  const stack = [
    {
      name: "NEXT.JS",
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
          <path d="M11.572 0c-.176 0-.31.001-.358.007a19.76 19.76 0 0 1-.364.033C7.443.346 4.25 2.185 2.228 5.012a11.875 11.875 0 0 0-2.119 5.243c-.096.659-.108.854-.108 1.747s.012 1.089.108 1.748c.652 4.506 3.86 8.292 8.209 9.695.779.25 1.6.422 2.534.525.363.04 1.935.04 2.299 0 1.611-.178 2.977-.577 4.323-1.264.207-.106.247-.134.219-.158-.02-.013-.9-1.193-1.955-2.62l-1.919-2.592-2.404-3.558a338.739 338.739 0 0 0-2.422-3.556c-.009-.002-.018 1.579-.023 3.51-.007 3.38-.01 3.515-.052 3.595a.426.426 0 0 1-.206.214c-.075.037-.14.044-.495.044H7.81l-.108-.068a.438.438 0 0 1-.157-.171l-.05-.106.006-4.703.007-4.705.072-.092a.645.645 0 0 1 .174-.143c.096-.047.134-.051.54-.051.478 0 .558.018.682.154.035.038 1.337 1.999 2.895 4.361a10760.433 10760.433 0 0 0 4.735 7.17l1.9 2.879.096-.063a12.317 12.317 0 0 0 2.466-2.163 11.944 11.944 0 0 0 2.824-6.134c.096-.66.108-.854.108-1.748 0-.893-.012-1.088-.108-1.747-.652-4.506-3.86-8.292-8.208-9.695a12.597 12.597 0 0 0-2.499-.523A33.119 33.119 0 0 0 11.572 0zm4.069 7.217c.347 0 .408.005.486.047a.473.473 0 0 1 .237.277c.018.06.023 1.365.018 4.304l-.006 4.218-.744-1.14-.746-1.14v-3.066c0-1.982.01-3.097.023-3.15a.478.478 0 0 1 .233-.296c.096-.05.13-.054.5-.054z" />
        </svg>
      ),
    },
    {
      name: "FIREBASE",
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
          <path d="M3.89 15.672L6.255.461A.542.542 0 0 1 7.27.288l2.543 4.771zm16.794 3.692l-2.25-14a.54.54 0 0 0-.919-.295L3.316 19.365l7.856 4.427a1.621 1.621 0 0 0 1.588 0zM14.3 7.147l-1.82-3.482a.542.542 0 0 0-.96 0L3.53 17.984z" />
        </svg>
      ),
    },
    {
      name: "GEMINI",
      icon: (
        <svg viewBox="0 0 28 28" className="w-6 h-6" fill="none">
          <path
            d="M14 28C14 21.79 9.21 16.68 3.11 16.12C2.07 16.02 1.03 15.98 0 16C0 16 0 12 0 12C1.03 12.02 2.07 11.98 3.11 11.88C9.21 11.32 14 6.21 14 0C14 6.21 18.79 11.32 24.89 11.88C25.93 11.98 26.97 12.02 28 12C28 12 28 16 28 16C26.97 15.98 25.93 16.02 24.89 16.12C18.79 16.68 14 21.79 14 28Z"
            fill="currentColor"
          />
        </svg>
      ),
    },
    {
      name: "CLOUDINARY",
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
        </svg>
      ),
    },
    {
      name: "SECURE",
      icon: (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L3.5 6.5V11C3.5 16.25 7.08 21.12 12 22.5C16.92 21.12 20.5 16.25 20.5 11V6.5L12 2Z" />
          <path d="M9 12L11 14L15.5 9.5" />
        </svg>
      ),
    },
  ];

  return (
    <section className="py-16 md:py-24 text-center">
      <h2 className="fugaz text-xl sm:text-2xl md:text-3xl mb-10 md:mb-12">
        Built for <span className="textGradient">Speed</span> and <span className="textGradient">Security</span>
      </h2>

      {/* Tech icons row */}
      <div className="flex items-center justify-center gap-6 sm:gap-10 md:gap-12 mb-8">
        {stack.map(({ name, icon }) => (
          <div key={name} className="flex flex-col items-center gap-2.5">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
              {icon}
            </div>
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {name}
            </span>
          </div>
        ))}
      </div>

      {/* GitHub link */}
      <Link
        href="https://www.github.com/aditya-2k23/moody"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors duration-200"
      >
        View GitHub Repository <ExternalLink size={14} />
      </Link>
    </section>
  );
}
