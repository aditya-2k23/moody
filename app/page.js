import GlowBackground from "@/components/GlowBackground";
import HeroSection from "@/components/landing/HeroSection";
import ComparisonSection from "@/components/landing/ComparisonSection";
import FeaturesGrid from "@/components/landing/FeaturesGrid";
import TechStack from "@/components/landing/TechStack";
import FinalCTA from "@/components/landing/FinalCTA";
import LandingFooter from "@/components/landing/LandingFooter";
import Image from "next/image";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col relative">
      <GlowBackground />

      {/* Contained sections */}
      <div className="px-4 sm:px-8">
        <HeroSection />

        <section className="flex justify-center">
          <div className="w-full rounded-2xl shadow-xl shadow-indigo-500/5 dark:shadow-slate-900/30 border border-slate-200/80 dark:border-slate-700/50 overflow-hidden">
            <Image
              src="/mood-preview-light.png"
              alt="Moody mood picker preview"
              className="w-full h-auto"
              width={800}
              height={500}
            />
          </div>
        </section>

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
