import { Open_Sans } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { AuthProvider } from "@/context/authContext";
import { ThemeProvider } from "@/context/themeContext";
import Logout from "@/components/Logout";
import Button, { BlobSvgFilter } from "@/components/Button";
import ThemeToggle from "@/components/ThemeToggle";
import { Github, Linkedin } from "lucide-react";

const openSans = Open_Sans({
  subsets: ["latin"],
});

export const metadata = {
  title: "Moody ⋅ Track Your Mood",
  description: "Track your mood every day of the year! Now with the power of AI to provide insights.",
};

export default function RootLayout({ children }) {
  const Header = (
    <header className="p-4 sm:p-8 flex items-center justify-between gap-4">
      <Link href="/">
        <h1 className={`fugaz text-2xl sm:text-4xl textGradient hover:scale-110 duration-200`} title="Home">Moody</h1>
      </Link>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <Logout />
      </div>
    </header>
  );

  const Footer = (
    <footer className="p-4 sm:p-8 pt-2 sm:pt-0 flex justify-between text-sm md:text-base">
      <p className={`text-indigo-500 dark:text-indigo-400 fugaz cursor-default`}>Created with 💜 by Aditya</p>
      <div className="flex gap-4">
        <Link href="https://www.github.com/aditya-2k23/moody" target="_blank" rel="noopener noreferrer" title="Adi's GitHub">
          <Button text={<><Github className="md:mr-1" size={18} /> GitHub</>} normal={false} className="text-slate-600 hover:text-indigo-500 dark:hover:text-white duration-200" />
        </Link>
        <Link href="https://www.linkedin.com/in/aditya-2k23" target="_blank" rel="noopener noreferrer" title="Adi's LinkedIn">
          <Button text={<><Linkedin className="md:mr-1" size={18} /> LinkedIn</>} normal={false} className="text-slate-600 hover:text-indigo-500 dark:hover:text-white duration-200" />
        </Link>
      </div>
    </footer>
  );

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`w-full max-w-[1000px] mx-auto text-sm sm:text-base min-h-screen flex flex-col text-slate-800 dark:text-slate-100 selection:bg-indigo-600 selection:text-white ${openSans.className}`}>
        <AuthProvider>
          <ThemeProvider>
            <BlobSvgFilter />
            {Header}
            {children}
            {Footer}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
