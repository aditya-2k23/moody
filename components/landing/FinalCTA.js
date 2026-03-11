"use client";

import Link from "next/link";
import Button from "../Button";
import { useAuth } from "@/context/authContext";
import { ArrowRight } from "lucide-react";

export default function FinalCTA() {
  const { currentUser } = useAuth();

  return (
    <section className="w-screen relative left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-slate-950">
      <div className="max-w-[1200px] mx-auto px-6 sm:px-8 py-16 md:py-20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 md:gap-12">
          {/* Left: Headline */}
          <div className="md:max-w-[55%]">
            <h2 className="fugaz text-2xl sm:text-3xl md:text-4xl text-white leading-snug">
              Start Understanding Yourself Better Today.
            </h2>
            <p className="text-slate-400 mt-3 text-sm sm:text-base leading-relaxed">
              Join thousands of high-performers optimizing their emotional
              intelligence.
            </p>
          </div>

          {/* Right: CTA */}
          <div className="flex flex-col items-start md:items-end gap-3">
            <Link href={currentUser ? "/dashboard" : "/dashboard?register=true"}>
              <Button
                text={
                  <>
                    {currentUser ? "Go to Dashboard" : "Get Started for Free"}{" "}
                    <ArrowRight size={18} />
                  </>
                }
                dark
                size="lg"
              />
            </Link>
            {/* <p className="text-xs text-slate-500 italic">
              No credit card required for 14-day trial.
            </p> */}
          </div>
        </div>
      </div>
    </section>
  );
}
