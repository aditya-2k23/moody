"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/authContext";

export default function HomeRedirect() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (loading) return;

    const isInternal = searchParams.get("ref") === "internal";

    if (currentUser && !isInternal) {
      router.replace("/dashboard");
    }
  }, [currentUser, loading, router, searchParams]);

  return null;
}
