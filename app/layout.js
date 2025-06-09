import { Fugaz_One, Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
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
      <h1 className={`${fugaz.className} text-base sm:text-lg textGradient`}>Moody</h1>
    </header>
  )

  const Footer = (
    <footer>
      blaw
    </footer>
  );

  return (
    <html lang="en">
      <body className={`w-full max-w-[1000px] mx-auto text-sm sm:text-base min-h-screen flex flex-col ${geistSans.variable}`}>
        {Header}
        {children}
        {Footer}
      </body>
    </html>
  );
}
