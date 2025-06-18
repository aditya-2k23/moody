"use client";

import { Suspense } from "react";
import DashboardContent from "./DashboardContent";

export default function Dashboard() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}
