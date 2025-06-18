import { Open_Sans } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { AuthProvider } from "@/context/authContext";
import Logout from "@/components/Logout";
import Button from "@/components/Button";

const openSans = Open_Sans({
  subsets: ["latin"],
});

export const metadata = {
  title: "Moody ⋅ Track Your Mood",
  description: "Track your mood every day of the year!",
};

export default function RootLayout({ children }) {
  const Header = (
    <header className="p-4 sm:p-8 flex items-center justify-between gap-4">
      <Link href="/">
        <h1 className={`fugaz text-xl sm:text-3xl textGradient`}>Moody</h1>
      </Link>

      <Logout />
    </header>
  )

  const Footer = (
    <footer className="p-4 sm:p-8 pt-0 sm:pt-0 flex justify-between text-sm md:text-base">
      <p className={`text-indigo-500 fugaz`}>Created with 💜 by Aditya</p>
      <div className="flex gap-4">
        <Link href="https://www.github.com/aditya-2k23" target="_blank" rel="noopener noreferrer">
          <Button text={<><i className="fa-brands fa-github md:mr-1"></i> GitHub</>} normal={false} className="text-slate-600 hover:text-indigo-500 duration-200" />
        </Link>
        <Link href="https://www.linkedin.com/in/aditya-2k23" target="_blank" rel="noopener noreferrer">
          <Button text={<><i className="fa-brands fa-linkedin md:mr-1"></i> LinkedIn</>} normal={false} className="text-slate-600 hover:text-indigo-500 duration-200" />
        </Link>
      </div>
    </footer>
  );

  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" integrity="sha512-9usAa10IRO0HhonpyAIVpjrylPvoDwiPUiKdWk5t3PyolY1cOd4DSE0Ga+ri4AuTroPR5aQvXU9xC6qOPnzFeg==" crossOrigin="anonymous" referrerPolicy="no-referrer" />
      </head>
      <AuthProvider>
        <body className={`w-full max-w-[1000px] mx-auto text-sm sm:text-base min-h-screen flex flex-col text-slate-800 selection:bg-indigo-600 selection:text-white ${openSans.className}`}>
          {Header}
          {children}
          {Footer}
        </body>
      </AuthProvider>
    </html>
  );
}
