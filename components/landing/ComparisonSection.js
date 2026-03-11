import React from "react";
import { X, Check, Sparkles, Calendar, XCircle, ArrowRight, ArrowDown, Star } from "lucide-react";

export default function ComparisonSection() {
  const stages = [
    {
      id: "chaos",
      icon: <XCircle size={28} strokeWidth={1.5} className="text-red-400 dark:text-red-500" />,
      iconBg: "bg-indigo-200/50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400",
      title: "Chaos",
      subtitle: "Scattered & Forgettable",
      cardBg: "bg-slate-50/80 dark:bg-slate-800/40 border-slate-100 dark:border-slate-600/50 shadow shadow-indigo-400/20 relative",
      textColor: "text-slate-700 dark:text-slate-300",
      subTextColor: "text-slate-500 dark:text-slate-400",
      listIcon: <X size={24} className="text-red-400 dark:text-red-500" />,
      features: ["Notes everywhere", "No long-term tracking", "No measurable patterns"],
      quote: '"You remember how you felt. But you don\'t know why."',
      divider: "border-slate-200 dark:border-slate-700/50"
    },
    {
      id: "structure",
      icon: <Calendar size={28} strokeWidth={1.5} />,
      iconBg: "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-500 dark:text-indigo-300",
      title: "Structure",
      subtitle: "Daily Clarity",
      cardBg: "bg-white dark:bg-slate-800 border-indigo-100 dark:border-indigo-500/20 shadow-xl shadow-indigo-500/10 relative",
      textColor: "text-slate-800 dark:text-slate-100",
      subTextColor: "text-slate-500 dark:text-slate-400",
      listIcon: <Check size={20} className="text-green-500 dark:text-green-400" />,
      features: ["One-click mood logging", "Calendar history", "Streak tracking"],
      quote: '"You start seeing consistency."',
      divider: "border-slate-200 dark:border-slate-700"
    },
    {
      id: "intelligence",
      icon: <Sparkles size={28} strokeWidth={1.5} />,
      iconBg: "bg-white/20 text-white",
      title: "Intelligence",
      subtitle: "AI-Powered Insights",
      cardBg: "bg-gradient-to-br from-indigo-500 to-violet-600 border-indigo-400 dark:border-indigo-500 shadow-xl shadow-indigo-500/30 text-white relative overflow-hidden",
      textColor: "text-white",
      subTextColor: "text-indigo-100",
      listIcon: <Star size={14} className="text-white fill-white" />,
      features: ["Gemini analysis", "Trigger detection", "Emotional pattern recognition"],
      quote: '"You understand patterns before they repeat."',
      divider: "border-indigo-400/50"
    }
  ];

  return (
    <section className="py-12 md:py-16" id="comparison">
      <div className="max-w-6xl mx-auto">
        <h2 className="fugaz text-2xl sm:text-3xl md:text-4xl text-center mb-2">
          From Chaos to <span className="textGradient">Intelligence</span>
        </h2>
        <p className="text-center text-slate-500 dark:text-slate-400 mb-10 md:mb-14 max-w-[500px] mx-auto">
          Stop relying on subjective guesswork. Switch to data-driven clarity.
        </p>

        <div className="flex flex-col lg:flex-row items-stretch justify-center gap-4 lg:gap-2 relative z-10">
          {stages.map((stage, index) => (
            <React.Fragment key={stage.id}>
              {/* Card */}
              <div className={`flex-1 flex flex-col rounded-3xl border p-4 sm:p-6 transition-all duration-300 hover:-translate-y-1 ${stage.cardBg}`}>
                {/* Decorative glows for the Intelligence card */}
                {stage.id === 'intelligence' && (
                  <>
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-black/10 rounded-full blur-3xl pointer-events-none" />
                  </>
                )}

                <div className="flex md:flex-col gap-4 md:gap-0 items-center text-center mb-6 relative z-10">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center md:mb-5 ${stage.iconBg}`}>
                    {stage.icon}
                  </div>
                  <h3 className={`fugaz text-xl sm:text-2xl mb-1.5 ${stage.textColor}`}>{stage.title}</h3>
                  <p className={`text-xs sm:text-sm font-medium ${stage.subTextColor}`}>{stage.subtitle}</p>
                </div>

                <div className="flex-1 space-y-4 mb-6 relative z-10 px-4 sm:px-6">
                  {stage.features.map((feat, i) => (
                    <div key={i} className="flex gap-2 sm:gap-4 items-center">
                      <span className="shrink-0 flex items-center justify-center w-5 h-5 mt-0.5 sm:mt-1">
                        {stage.listIcon}
                      </span>
                      <span className={`text-sm md:text-base font-medium leading-tight ${stage.textColor}`}>{feat}</span>
                    </div>
                  ))}
                </div>

                <div className={`pt-4 border-t relative z-10 ${stage.divider}`}>
                  <p className={`text-sm text-center italic ${stage.subTextColor}`}>
                    {stage.quote}
                  </p>
                </div>
              </div>

              {/* Arrow */}
              {index < stages.length - 1 && (
                <div className="flex items-center justify-center shrink-0 lg:w-12 py-2 lg:py-0 text-indigo-400 dark:text-indigo-500">
                  <ArrowRight size={28} strokeWidth={2.5} className="hidden lg:block" />
                  <ArrowDown size={28} strokeWidth={2.5} className="block lg:hidden" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
