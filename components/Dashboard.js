"use client";

import { Suspense } from "react";
import DashboardContent from "./DashboardContent";
import Splashscreen from "./Splashscreen";

export default function Dashboard() {
  return (
    <Suspense fallback={<Splashscreen />}>
      <DashboardContent />
    </Suspense>
  );
}
