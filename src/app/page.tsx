import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth-helpers';

export default async function Home() {
  const session = await getCurrentSession();
  
  if (session) {
    redirect('/displays');
  } else {
    redirect('/auth/login');
  }
}