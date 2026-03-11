import { Open_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/authContext";
import { ThemeProvider } from "@/context/themeContext";
import { BlobSvgFilter } from "@/components/Button";
import { HandDrawnSvgFilters } from "@/components/HandDrawnButton";
import ConditionalFooter from "@/components/ConditionalFooter";
import Header from "@/components/Header";

const openSans = Open_Sans({
  subsets: ["latin"],
});

export const metadata = {
  title: "Moody ⋅ Track Your Mood",
  description: "Track your mood every day of the year! Now with the power of AI to provide insights.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className="overflow-x-clip">
      <body className={`w-full max-w-[1200px] mx-auto text-sm sm:text-base min-h-screen flex flex-col text-slate-800 dark:text-slate-100 selection:bg-indigo-600 selection:text-white ${openSans.className}`}>
        <AuthProvider>
          <ThemeProvider>
            <BlobSvgFilter />
            <HandDrawnSvgFilters />
            <Header />
            <main className="flex-1">{children}</main>
            <ConditionalFooter />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
