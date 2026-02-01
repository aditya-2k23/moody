"use client";

import { useAuth } from "@/context/authContext";
import Button from "./Button";

export default function Logout() {
  const { logOut, currentUser } = useAuth();

  if (!currentUser) return null;

  return (
    <div className="flex items-center justify-center gap-2 md:gap-3 text-slate-700 hover:text-white transition duration-200">
      <p className="hidden sm:block text-base md:text-lg text-slate-700 font-semibold fugaz">Hello <span className="textGradient">
        {currentUser.email.split("@")[0]}</span>👋
      </p>

      <Button
        text={<>
          Log Out
          <i className="ml-1 sm:ml-2 fa-solid fa-right-from-bracket"></i>
        </>}
        onClick={logOut}
        className="dark:!text-slate-200 !text-slate-700 dark:hover:!text-white hover:!text-white !py-2 !px-5"
      />
    </div>
  )
}
