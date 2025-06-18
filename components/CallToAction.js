"use client";

import Link from "next/link";
import Button from "./Button";
import { useAuth } from "@/context/authContext";

export default function CallToAction() {
  const { currentUser } = useAuth();

  if (currentUser) {
    return (
      <div className="max-w-[600px] mx-auto w-full">
        <Link href="/dashboard">
          <Button text="Go to Dashboard" full dark />
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 w-fit mx-auto">
      <Link href="/dashboard?register=true">
        <Button text="Sign Up" />
      </Link>
      <Link href="/dashboard">
        <Button text="Log In" dark />
      </Link>
    </div>
  )
}
