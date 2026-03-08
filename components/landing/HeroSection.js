"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "../Button";
import { useAuth } from "@/context/authContext";
import { ArrowRightToLine, Play } from "lucide-react";
import VideoModal from "./VideoModal";

export default function HeroSection() {
  const { currentUser } = useAuth();
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  return (
    <section className="pt-12 pb-16 md:pt-20 md:pb-28 text-center">
      {/* Version Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 mb-8">
        <span className="w-2 h-2 rounded-full bg-green-400" />
        <span className="text-sm text-indigo-600 dark:text-indigo-300 font-medium italic font-sans">
          v2.5 Now Available in Public Release!
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
      <p className="text-base sm:text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-[600px] mx-auto mb-10 leading-relaxed font-sans font-medium">
        Your personal AI-powered emotional architect. Track, analyze, and
        optimize your mental state with precision—no more subjective guesswork.
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        {currentUser ? (
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button
              text={
                <span className="flex items-center justify-center gap-2 w-full">
                  Go to your Dashboard <ArrowRightToLine size={20} />
                </span>
              }
              size="lg"
              className="w-full sm:w-auto sm:!px-56 flex justify-center"
            />
          </Link>
        ) : (
          <>
            <Link href="/dashboard?register=true">
              <Button
                text={
                  <>
                    Start Tracking <ArrowRightToLine size={20} />
                  </>
                }
                dark
                size="lg"
              />
            </Link>
            <div onClick={() => setIsVideoModalOpen(true)}>
              <Button
                text={
                  <>
                    <Play size={19} /> Live Demo
                  </>
                }
                size="lg"
              />
            </div>
          </>
        )}
      </div>

      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
      />
    </section>
  );
}
