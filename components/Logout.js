"use client";

import { useAuth } from "@/context/authContext";
import Button from "./Button";

export default function Logout() {
  const { logOut, currentUser } = useAuth();

  if (!currentUser) return null;

  return (
    <div className="flex items-center justify-center gap-2">
      <p className="text-sm sm:text-base md:text-lg font-sans text-slate-700 font-semibold fugaz">Hello <span className="textGradient">{currentUser.email.split("@")[0]}</span>👋</p>
      <Button text={<>Log Out<i className="ml-1 sm:ml-2 fa-solid fa-right-from-bracket text-indigo-600"></i></>} onClick={logOut} />
    </div>
  )
}
