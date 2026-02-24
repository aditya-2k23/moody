"use client";

import { useAuth } from "@/context/authContext";
import { usePathname, useRouter } from "next/navigation";
import Button from "./Button";
import { LogOut } from "lucide-react";

export default function Logout() {
  const { logOut, currentUser } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (!currentUser || pathname === "/") return null;

  async function handleLogout() {
    await logOut();
    router.push("/");
  }

  return (
    <div className="flex items-center justify-center gap-2 md:gap-3 text-slate-700 hover:text-white transition duration-200">
      <p className="hidden sm:block text-base md:text-lg text-slate-700 font-semibold fugaz">Hello <span className="textGradient">
        {currentUser.email.split("@")[0].replace(/[0-9]/g, '')}</span>👋
      </p>

      <Button
        text={<>
          Log Out
          <LogOut className="ml-1 sm:ml-2" size={16} />
        </>}
        onClick={handleLogout}
        className="dark:!text-slate-200 !text-slate-700 dark:hover:!text-white hover:!text-white !py-2 !px-5"
      />
    </div>
  )
}
