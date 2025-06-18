"use client";

import { useAuth } from "@/context/authContext";
import Button from "./Button";

export default function Logout() {
  const { logOut, currentUser } = useAuth();

  if (!currentUser) return null;

  return (
    <Button text="Log Out" onClick={logOut} />
  )
}
