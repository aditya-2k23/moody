import Dashboard from '@/components/Dashboard';
import Main from '@/components/Main';

export const metadata = {
  title: "Moody ⋅ Dashboard",
  description: "Your personal mood tracker and journal with AI insights",
};

export default function DashboardPage() {
  return (
    <Main>
      <Dashboard />
    </Main>
  )
}
