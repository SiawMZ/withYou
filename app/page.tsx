"use client";
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import SignInButton from "../components/SignInButton";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // If user is logged in:
      // 1. If they have a username (profile complete) -> Redirect to Challenger Dashboard
      // 2. If they don't have a username (profile incomplete) -> Redirect to Onboarding
      if (userData && userData.username) {
        router.push('/challenger');
      } else {
        router.push('/onboarding');
      }
    }
  }, [user, userData, loading, router]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen bg-[var(--color-secondary)] text-[var(--color-primary)]">Loading...</div>;
  }

  // If user is logged in, we are redirecting, so show loading/redirecting state
  // This prevents the "Choose your Path" screen from flashing
  if (user) {
     return <div className="flex justify-center items-center h-screen bg-[var(--color-secondary)] text-[var(--color-primary)]">Redirecting...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-[var(--color-secondary)]">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-6xl font-bold mb-8 text-[var(--color-text)]">
          Welcome to <span className="text-[var(--color-primary)]">WithYou</span>
        </h1>
        
        <div>
          <p className="mt-3 text-2xl mb-8 text-[var(--color-text)] opacity-80">
            Achieve your goals with the support of your friends.
          </p>
          <SignInButton />
        </div>
      </main>
    </div>
  );
}
