import { Open_Sans } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { AuthProvider } from "@/context/authContext";
import { ThemeProvider } from "@/context/themeContext";
import Logout from "@/components/Logout";
import { BlobSvgFilter } from "@/components/Button";
import ThemeToggle from "@/components/ThemeToggle";
import ConditionalFooter from "@/components/ConditionalFooter";

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
