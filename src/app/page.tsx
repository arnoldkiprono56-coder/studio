import { redirect } from 'next/navigation';

export default function Home() {
  // This is the single entry point for the application.
  // Authenticated users will see the dashboard.
  // Unauthenticated users will be redirected from '/dashboard' to '/login' by the logic in the dashboard page/layout.
  redirect('/dashboard');
}
