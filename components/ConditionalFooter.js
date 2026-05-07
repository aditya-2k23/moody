"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Button from "./Button";
import { Github, Linkedin } from "lucide-react";
import { APP_VERSION_LABEL } from "@/lib/release";
import Image from "next/image";

export default function ConditionalFooter() {
  const pathname = usePathname();

  // Hide layout footer on landing page and policy pages
  if (pathname === "/" || pathname === "/privacy" || pathname === "/terms") return null;

  return (
    <footer className="p-4 md:px-8 flex justify-between text-xs sm:text-sm md:text-base">
      {/* Logo */}
      <div className="flex items-center">
        <Link href="/?ref=internal" className="fugaz text-sm sm:text-base md:text-lg text-slate-600 dark:text-gray-300">
          <span className="text-indigo-500 dark:text-indigo-400" aria-hidden="true">✦</span> Moody
          <span className="text-[6px] sm:text-[8px] md:text-[10px] self-end ml-0.5 sm:ml-1">
            {APP_VERSION_LABEL}
          </span>
        </Link>
      </div>
      <p className="hidden sm:block fugaz text-slate-600 dark:text-gray-300">
        Created with 💜 by
        <a href="https://www.x.com/Tema_roon"
          target="_blank" rel="noopener noreferrer"
          title="X/Twitter"
          className="hover:underline text-indigo-500 dark:text-indigo-400"
        >
          <Image
            src="/x.svg"
            alt="X/Twitter"
            width={16}
            height={16}
            className="inline-block mx-1"
          />
          Aditya
        </a>
      </p>
      <div className="flex gap-2 sm:gap-4 text-xs sm:text-sm md:text-base">
        <Link
          href="https://www.github.com/aditya-2k23/moody"
          target="_blank"
          rel="noopener noreferrer"
          title="Give a Star on GitHub!"
        >
          <Button
            text={
              <>
                <Github size={18} className="mb-1" /> GitHub
              </>
            }
            normal={false}
            className="text-slate-600 hover:text-indigo-500 dark:hover:text-white duration-200"
          />
        </Link>
        <Link
          href="https://www.linkedin.com/in/aditya-2k23"
          target="_blank"
          rel="noopener noreferrer"
          title="Adi's LinkedIn"
        >
          <Button
            text={
              <>
                <Linkedin size={18} className="mb-1" /> LinkedIn
              </>
            }
            normal={false}
            className="text-slate-600 hover:text-indigo-500 dark:hover:text-white duration-200"
          />
        </Link>
      </div>
    </footer>
  );
}
