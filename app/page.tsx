"use client";
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import SignInButton from "../components/SignInButton";
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react'; // Add useRef
import { usePathname } from 'next/navigation'; // Add this import



export default function Home() {
  const { user, userData, loading, dataLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); // Get current path
  const initialCheckDone = useRef(false); // Track if we've done the initial check


  useEffect(() => {
    if (loading || dataLoading) {
      initialCheckDone.current = false;
      return;
    }
    
    if (initialCheckDone.current) return;
    
    // STRICT CHECK: Only redirect if we are actually at the root path
    if (pathname !== '/') return;
    
    if (user && userData !== null) {
      initialCheckDone.current = true;
      
      const targetPath = userData.username ? '/challenger' : '/onboarding';
      router.replace(targetPath);
    }
  }, [loading, dataLoading, user, userData, pathname, router]);

  if (loading || dataLoading) {
    return <div className="flex justify-center items-center h-screen bg-[var(--color-secondary)] text-[var(--color-primary)]">Loading...</div>;
  }

  // CRITICAL FIX: If we are logged in but NOT at root (e.g. /challenger), 
  // we must return null so this component doesn't block the real page.
  if (user && pathname !== '/') {
    return null; 
  }

  // Only show "Redirecting..." if we are at root and about to redirect
  if (user && pathname === '/') {
    return <div className="flex justify-center items-center h-screen bg-[var(--color-secondary)] text-[var(--color-primary)]">Redirecting...</div>;
  }

// Landing page for non-logged-in users
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
