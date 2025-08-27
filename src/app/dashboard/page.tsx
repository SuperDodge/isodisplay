import { redirect } from 'next/navigation';

export default function DashboardPage() {
  // Dashboard is no longer used, redirect to displays
  redirect('/displays');
}