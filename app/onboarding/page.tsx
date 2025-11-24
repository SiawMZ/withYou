"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext'; // Ensure this path is correct
import { firestore, auth } from '../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import Image from 'next/image';
import SignInButton from '../../components/SignInButton'; // Import your SignInButton
import { usePathname } from 'next/navigation'; // Add this import


export default function HomePage() {
  const { user, userData, loading, dataLoading } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState('challenger');
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialCheckDone = useRef(false);
  const pathname = usePathname();

  useEffect(() => {
    if (loading || dataLoading) {
      initialCheckDone.current = false;
      return;
    }
    
    if (initialCheckDone.current) return;

    // STRICT CHECK: Only redirect if we are actually at the onboarding path
    if (pathname !== '/onboarding') return;

    if (user && userData?.role && userData?.username) {
      initialCheckDone.current = true;
      const targetPath = userData.role === 'challenger' ? '/challenger' : '/motivator';
      router.replace(targetPath);
    }
  }, [loading, dataLoading, user, userData, pathname, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return; // Safety check

    if (!username.trim()) {
      alert('Please enter a username');
      return;
    }
    setIsSubmitting(true);

    try {
      const userRef = doc(firestore, 'users', auth.currentUser.uid);
      
      // Save the profile
      await setDoc(userRef, {
        username: username,
        role: role,
        email: auth.currentUser.email,
        photoURL: auth.currentUser.photoURL,
        createdAt: new Date(),
      }, { merge: true });

      // The useEffect above will detect the new userData and redirect automatically
      
    } catch (error) {
      console.error("Error creating profile:", error);
      alert("Failed to create profile. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Show a simple loading screen while AuthContext initializes
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[var(--color-secondary)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-secondary)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl border border-[var(--color-highlight)]">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-4">
            <Image src="/welcome_home_cat.png" alt="Welcome" fill className="object-contain" />
          </div>
          <h2 className="text-3xl font-extrabold text-[var(--color-text)]">
            Welcome to WithYou
          </h2>
          <p className="mt-2 text-sm text-[var(--color-text)] opacity-70">
            {user ? "Let's get your profile set up." : "Log in to start your journey together."}
          </p>
        </div>

        {/* LOGIC SPLIT: Show Form ONLY if logged in. Show Login Button if Guest. */}
        {user ? (
          // --- ONBOARDING FORM (For Logged In Users with no Profile) ---
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div>
                <label htmlFor="username" className="block text-sm font-bold text-[var(--color-text)] mb-2">
                  Choose a Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-[var(--color-text)] rounded-xl focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] focus:z-10 sm:text-sm bg-[var(--color-secondary)] transition-colors"
                  placeholder="e.g. ForestWalker"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--color-text)] mb-3">
                  Select your Role
                </label>
                <div className="space-y-3">
                  <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${role === 'challenger' ? 'border-[var(--color-primary)] bg-[var(--color-highlight)]' : 'border-gray-200 hover:border-[var(--color-primary)]'}`}>
                    <input
                      type="radio"
                      className="form-radio h-5 w-5 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                      name="role"
                      value="challenger"
                      checked={role === 'challenger'}
                      onChange={() => setRole('challenger')}
                    />
                    <div className="ml-3">
                      <span className="block text-sm font-bold text-[var(--color-text)]">Challenger</span>
                      <span className="block text-xs text-[var(--color-text)] opacity-70">I want to achieve goals</span>
                    </div>
                  </label>

                  <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${role === 'motivator' ? 'border-[var(--color-primary)] bg-[var(--color-highlight)]' : 'border-gray-200 hover:border-[var(--color-primary)]'}`}>
                    <input
                      type="radio"
                      className="form-radio h-5 w-5 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                      name="role"
                      value="motivator"
                      checked={role === 'motivator'}
                      onChange={() => setRole('motivator')}
                    />
                    <div className="ml-3">
                      <span className="block text-sm font-bold text-[var(--color-text)]">Motivator</span>
                      <span className="block text-xs text-[var(--color-text)] opacity-70">I want to support friends</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-[var(--color-primary)] hover:bg-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] disabled:opacity-50 shadow-md transition-all transform hover:scale-[1.02]"
              >
                {isSubmitting ? 'Setting up...' : 'Get Started'}
              </button>
            </div>
          </form>
        ) : (
          // --- LANDING PAGE VIEW (For Guests) ---
          <div className="mt-8 flex flex-col items-center">
             <div className="w-full">
                <SignInButton /> 
                {/* Note: Ensure SignInButton is styled to look good here, or just render a custom button that calls the google login function */}
             </div>
             <p className="mt-6 text-xs text-center text-gray-400">
               By signing in, you agree to start a journey of mutual growth.
             </p>
          </div>
        )}
      </div>
    </div>
  );
}