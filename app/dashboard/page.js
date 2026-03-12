import Dashboard from '@/components/Dashboard';

export const metadata = {
  title: "Moody ⋅ Dashboard",
  description: "Your personal mood tracker and journal with AI insights",
};

// Allow server actions (AI insights) up to 60s on serverless platforms (Netlify/Vercel)
export const maxDuration = 60;

export default function DashboardPage() {
  return (
    <main className="flex-1 flex flex-col p-4 sm:p-8 relative overflow-x-clip">
      <Dashboard />
    </main>
  )
}
