import { Open_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/authContext";
import { ThemeProvider } from "@/context/themeContext";
import { BlobSvgFilter } from "@/components/Button";
import { HandDrawnSvgFilters } from "@/components/HandDrawnButton";
import ConditionalFooter from "@/components/ConditionalFooter";
import Header from "@/components/Header";
import { Toaster } from "react-hot-toast";

const openSans = Open_Sans({
  subsets: ["latin"],
});

export const metadata = {
  title: "Moody v3.0 (beta) ⋅ Track Your Mood",
  description: "Track your mood every day of the year with Lumi chat beta and AI-powered journal insights.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className="overflow-x-clip">
      <body className={`w-full max-w-[1200px] mx-auto text-sm sm:text-base min-h-screen flex flex-col text-slate-800 dark:text-slate-100 selection:bg-indigo-600 selection:text-white ${openSans.className}`}>
        <AuthProvider>
          <ThemeProvider>
            <Toaster position="top-center" toastOptions={{ style: { zIndex: 999999 } }} containerStyle={{ zIndex: 999999 }} />
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
