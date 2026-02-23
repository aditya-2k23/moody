import { Open_Sans } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { AuthProvider } from "@/context/authContext";
import { ThemeProvider } from "@/context/themeContext";
import Logout from "@/components/Logout";
import { BlobSvgFilter } from "@/components/Button";
import ThemeToggle from "@/components/ThemeToggle";
import ConditionalFooter from "@/components/ConditionalFooter";
import NavbarLinks from "@/components/NavbarLinks";

const openSans = Open_Sans({
  subsets: ["latin"],
});

export const metadata = {
  title: "Moody ⋅ Track Your Mood",
  description: "Track your mood every day of the year! Now with the power of AI to provide insights.",
};

export default function RootLayout({ children }) {
  const Header = (
    <header className="p-4 sm:p-8 sticky top-0 z-20 flex items-center justify-between gap-4 backdrop-blur-sm">
      <div className="flex items-center gap-4 lg:gap-6">
        <Link href="/?ref=internal" className="flex items-center fugaz hover:scale-105 duration-200 shrink-0">
          <h1 className={`text-2xl sm:text-4xl textGradient`} title="Moody v2.5">Moody</h1>
          <span className="text-xs self-end text-indigo-500 dark:text-indigo-300">v2.5</span>
        </Link>
        <div className="hidden md:block">
          <NavbarLinks />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <Logout />
        <ThemeToggle />
        <div className="md:hidden">
          <NavbarLinks />
        </div>
      </div>
    </header>
  );

  return (
    <html lang="en" suppressHydrationWarning className="overflow-x-clip">
      <body className={`w-full max-w-[1200px] mx-auto text-sm sm:text-base min-h-screen flex flex-col text-slate-800 dark:text-slate-100 selection:bg-indigo-600 selection:text-white ${openSans.className}`}>
        <AuthProvider>
          <ThemeProvider>
            <BlobSvgFilter />
            {Header}
            {children}
            <ConditionalFooter />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
