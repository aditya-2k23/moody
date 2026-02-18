"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Button from "./Button";
import { Github, Linkedin } from "lucide-react";

export default function ConditionalFooter() {
  const pathname = usePathname();

  // Hide layout footer on landing page (it has its own footer)
  if (pathname === "/") return null;

  return (
    <footer className="p-4 sm:p-8 pt-2 sm:pt-0 flex justify-between text-sm md:text-base">
      <p className="text-indigo-500 dark:text-indigo-400 fugaz cursor-default">
        Created with 💜 by Aditya
      </p>
      <div className="flex gap-4">
        <Link
          href="https://www.github.com/aditya-2k23/moody"
          target="_blank"
          rel="noopener noreferrer"
          title="Adi's GitHub"
        >
          <Button
            text={
              <>
                <Github size={18} /> GitHub
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
                <Linkedin size={18} /> LinkedIn
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
