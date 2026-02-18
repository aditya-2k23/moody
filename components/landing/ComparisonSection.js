import { X, Check, Sparkles, ClipboardCheck } from "lucide-react";

export default function ComparisonSection() {
  const oldWay = [
    {
      title: "Inconsistent Notes",
      desc: "Scattered across apps and paper journals.",
    },
    {
      title: "Forgotten Triggers",
      desc: "Impossible to spot patterns over months.",
    },
    {
      title: "Zero Data",
      desc: "Feelings are never quantified or measured.",
    },
  ];

  const moodyWay = [
    {
      title: "One-click Logging",
      desc: "Capture your state in seconds, anywhere.",
    },
    {
      title: "AI Analysis",
      desc: "Gemini Flash 3 detects hidden correlations.",
    },
    {
      title: "Visual Memories",
      desc: "Attach photos to anchor feelings to moments.",
    },
  ];

  return (
    <section className="py-16 md:py-24">
      <h2 className="fugaz text-2xl sm:text-3xl md:text-4xl text-center mb-3">
        The Old Way vs. The Moody Way
      </h2>
      <p className="text-center text-slate-500 dark:text-slate-400 mb-10 md:mb-14 max-w-[500px] mx-auto">
        Stop relying on subjective guesswork. Switch to data-driven clarity.
      </p>

      <div className="grid md:grid-cols-2 gap-5 md:gap-6">
        {/* The Old Way */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700/60 p-6 sm:p-8 bg-white dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5 mb-7">
            <span className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center text-lg">
              <ClipboardCheck size={20} className="text-slate-500 dark:text-slate-400" />
            </span>
            <h3 className="fugaz text-base sm:text-lg">The Old Way</h3>
          </div>
          <div className="space-y-5">
            {oldWay.map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <X size={12} className="text-red-500" />
                </span>
                <div>
                  <p className="font-bold text-sm mb-0.5">{item.title}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* The Moody Way */}
        <div className="rounded-2xl border border-indigo-200 dark:border-indigo-500/25 p-6 sm:p-8 bg-gradient-to-br from-indigo-50/80 to-white dark:from-indigo-500/5 dark:to-slate-800/40 relative overflow-hidden">
          {/* Decorative glows */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-300/20 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-purple-300/15 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Decorative stars */}
          <div className="absolute top-4 right-4 text-indigo-200 dark:text-indigo-500/30">
            <Sparkles size={24} />
          </div>

          <div className="flex items-center gap-2.5 mb-7 relative z-10">
            <span className="w-9 h-9 rounded-lg bg-indigo-500 flex items-center justify-center text-white text-lg">
              😊
            </span>
            <h3 className="fugaz text-base sm:text-lg">The Moody Way</h3>
          </div>
          <div className="space-y-5 relative z-10">
            {moodyWay.map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check
                    size={12}
                    className="text-green-600 dark:text-green-400"
                  />
                </span>
                <div>
                  <p className="font-bold text-sm mb-0.5">{item.title}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
