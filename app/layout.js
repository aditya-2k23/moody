import { Open_Sans } from "next/font/google";
import "./globals.css";

const openSans = Open_Sans({
  subsets: ["latin"],
});

export const metadata = {
  title: "Moody",
  description: "Track your mood every day of the year!",
};

export default function RootLayout({ children }) {
  const Header = (
    <header className="p-4 sm:p-8 flex items-center justify-between gap-4">
      <h1 className={`fugaz text-lg sm:text-2xl textGradient`}>Moody</h1>

      <div className="flex items-center justify-between">
        PLACEHOLDER CTA || STATS
      </div>
    </header>
  )

  const Footer = (
    <footer className="p-4 sm:p-8 grid place-items-center">
      <p className={`text-indigo-400 fugaz`}>Created with 💜</p>
    </footer>
  );

  return (
    <html lang="en">
      <body className={`w-full max-w-[1000px] mx-auto text-sm sm:text-base min-h-screen flex flex-col text-slate-800 ${openSans.className}`}>
        {Header}
        {children}
        {Footer}
      </body>
    </html>
  );
}
