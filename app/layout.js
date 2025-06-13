import { Fugaz_One, Open_Sans } from "next/font/google";
import "./globals.css";

const openSans = Open_Sans({
  subsets: ["latin"],
});

const fugaz = Fugaz_One({
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata = {
  title: "Moody",
  description: "Track your mood every day of the year!",
};

export default function RootLayout({ children }) {
  const Header = (
    <header className="p-4 sm:p-8 flex items-center justify-between gap-4">
      <h1 className={`${fugaz.className} text-lg sm:text-2xl textGradient`}>Moody</h1>
    </header>
  )

  const Footer = (
    <footer className="p-4 sm:p-8">
      blaw
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
