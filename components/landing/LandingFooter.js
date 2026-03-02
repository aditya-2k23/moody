import { Github, Linkedin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const SocialLinks = () => {
  const links = [
    {
      name: "Privacy",
      href: "/privacy",
    },
    {
      name: "Terms",
      href: "/terms",
    },
    {
      name: "X",
      href: "https://x.com/Tema_roon",
      logo: "/x.svg",
      external: true,
    },
    {
      name: "GitHub",
      href: "https://github.com/aditya-2k23/moody",
      logo: <Github size={20} />,
      external: true,
    },
    {
      name: "LinkedIn",
      href: "https://www.linkedin.com/in/aditya-2k23/",
      logo: <Linkedin size={20} />,
      external: true,
    }
  ]

  return (
    <div className="flex items-center gap-5">
      {links.map(({ name, href, external, logo }) => (
        <Link
          key={name}
          href={href}
          target={external ? "_blank" : "_self"}
          className="text-slate-300 hover:text-slate-100 text-xs sm:text-sm transition duration-200"
        >
          {logo ? (logo === "/x.svg") ? <Image src="/x.svg" alt="X (Twitter) logo" width={20} height={20} /> : logo : name}
        </Link>
      ))}
    </div>
  )
}

export default function LandingFooter() {
  return (
    <footer className="w-screen relative left-1/2 -translate-x-1/2 bg-slate-950 border-t border-slate-800">
      <div className="max-w-[1200px] mx-auto px-6 sm:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          {/* Logo */}
          <div className="flex items-center gap-1.5">
            <span className="fugaz text-lg text-gray-300">
              <span className="text-indigo-400">✦</span> Moody
            </span>
          </div>

          {/* Copyright */}
          <p className="text-slate-500 text-xs sm:text-sm">
            © 2026 Moody Inc. All rights reserved.
          </p>

          <SocialLinks />
        </div>
      </div>
    </footer>
  );
}
