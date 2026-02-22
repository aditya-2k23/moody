"use client";

import Link from "next/link";
import Button from "../Button";
import { useAuth } from "@/context/authContext";
import { ArrowRight, Play } from "lucide-react";

export default function HeroSection() {
  const { currentUser } = useAuth();

  return (
    <section className="pt-12 pb-16 md:pt-20 md:pb-28 text-center">
      {/* Version Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 mb-8">
        <span className="w-2 h-2 rounded-full bg-green-400" />
        <span className="text-sm text-indigo-600 dark:text-indigo-300 font-medium">
          v2.5 Now Available with Gemini Flash 3
        </span>
      </div>

      {/* Headline */}
      <h1 className="fugaz text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.1] mb-6">
        Understand Your
        <br />
        Emotions.{" "}
        <span className="textGradient block sm:inline mt-1 sm:mt-0">
          Grow Every Day.
        </span>
      </h1>

      {/* Subheading */}
      <p className="text-base sm:text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-[600px] mx-auto mb-10 leading-relaxed">
        Your personal AI-powered emotional architect. Track, analyze, and
        optimize your mental state with precision—no more subjective guesswork.
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        {currentUser ? (
          <Link href="/dashboard">
            <Button
              text={
                <>
                  Go to your Dashboard <ArrowRight size={18} />
                </>
              }
              size="lg"
              className="!px-56"
            />
          </Link>
        ) : (
          <>
            <Link href="/dashboard?register=true">
              <Button
                text={
                  <>
                    Start Tracking Free <ArrowRight size={18} />
                  </>
                }
                dark
                size="lg"
              />
            </Link>
            <Link href="/dashboard">
              <Button
                text={
                  <>
                    <Play size={16} /> View Live Demo
                  </>
                }
                size="lg"
              />
            </Link>
          </>
        )}
      </div>
    </section>
  );
}
