import Link from "next/link";

const SocialLinks = () => {
  const links = [
    {
      name: "Privacy",
      href: "#",
    },
    {
      name: "Terms",
      href: "#",
    },
    {
      name: "X",
      href: "https://x.com/Tema_roon",
      external: true,
    },
    {
      name: "GitHub",
      href: "https://github.com/aditya-2k23/moody",
      external: true,
    },
    {
      name: "LinkedIn",
      href: "https://www.linkedin.com/in/aditya-2k23/",
      external: true,
    }
  ]

  return (
    <div className="flex items-center gap-5">
      {links.map(({ name, href, external }) => (
        <Link
          key={name}
          href={href}
          target={external ? "_blank" : "_self"}
          className="text-slate-500 hover:text-slate-300 text-xs sm:text-sm transition duration-200"
        >
          {name === "X" ? <span className="font-bold text-lg">X</span> : name}
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
            <span className="fugaz text-lg text-white">
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
