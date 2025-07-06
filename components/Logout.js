"use client";

import { useAuth } from "@/context/authContext";
import Button from "./Button";

export default function Logout() {
  const { logOut, currentUser } = useAuth();

  if (!currentUser) return null;

  return (
    <div className="flex items-center justify-center gap-2 md:gap-3 text-indigo-600 hover:text-white transition duration-200">
      <p className="hidden sm:block text-base md:text-lg text-slate-700 font-semibold fugaz">Hello <span className="textGradient">{currentUser.email.split("@")[0]}</span>👋</p>
      <Button text={<>Log Out<i className="ml-1 sm:ml-2 fa-solid fa-right-from-bracket"></i></>} onClick={logOut} normal={false} className="text-xs sm:text-base md:text-lg border-2 border-indigo-600 rounded-full text-slate-600 hover:text-white hover:bg-indigo-600 overflow-hidden transition duration-200 px-2 md:px-4 py-1" />
    </div>
  )
}
