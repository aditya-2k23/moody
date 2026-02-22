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
      <Suspense fallback={null}>
        <HomeRedirect />
      </Suspense>
      <GlowBackground />

      {/* Contained sections */}
      <div className="px-4 sm:px-8">
        <HeroSection />

        {/* Interactive guest mood picker — sign-up not required */}
        <GuestMoodSection />

        <ComparisonSection />
        <FeaturesGrid />
        <TechStack />
      </div>

      {/* Full-width dark sections */}
      <FinalCTA />
      <LandingFooter />
    </main>
  );
}
