import Dashboard from '@/components/Dashboard';
import Main from '@/components/Main';

export const metadata = {
  title: "Moody ⋅ Dashboard",
  description: "Your personal mood tracker and journal with AI insights",
};

// Allow server actions (AI insights) up to 60s on serverless platforms (Netlify/Vercel)
export const maxDuration = 60;

export default function DashboardPage() {
  return (
    <Main>
      <Dashboard />
    </Main>
  )
}
