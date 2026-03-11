import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to plans page where user can select or create a plan
  redirect('/plans');
}
