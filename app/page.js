import GlowBackground from "@/components/GlowBackground";
import HeroSection from "@/components/landing/HeroSection";
import ComparisonSection from "@/components/landing/ComparisonSection";
import FeaturesGrid from "@/components/landing/FeaturesGrid";
import TechStack from "@/components/landing/TechStack";
import FinalCTA from "@/components/landing/FinalCTA";
import LandingFooter from "@/components/landing/LandingFooter";
import GuestMoodSection from "@/components/landing/GuestMoodSection";
import HomeRedirect from "@/components/HomeRedirect";
import { Suspense } from "react";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col relative">
      <div className="absolute inset-0 opacity-10 pointer-events-none -z-20" style={{
        maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)'
      }}>
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(var(--color-brand-500) 1px, transparent 1px), linear-gradient(to right, var(--color-brand-500) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <Suspense fallback={null}>
        <HomeRedirect />
      </Suspense>

      <GlowBackground />

      {/* Contained sections */}
      <div className="px-8 sm:px-12">
        <HeroSection />

        {/* Interactive guest mood picker */}
        <div id="guest-mood">
          <GuestMoodSection />
        </div>
        <div id="comparison">
          <ComparisonSection />
        </div>
        <div id="features">
          <FeaturesGrid />
        </div>
        <div id="tech-stack">
          <TechStack />
        </div>
      </div>

      {/* Full-width dark sections */}
      <FinalCTA />
      <LandingFooter />
    </main>
  );
}
