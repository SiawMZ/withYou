"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { firestore, auth } from '../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import Image from 'next/image';

export default function OnboardingPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState('challenger');
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    } else if (!loading && userData?.role && userData?.username) {
      // If user already has a role AND a username, redirect to appropriate dashboard
      // We must ensure they have a username, otherwise they should stay here to set it
      if (userData.role === 'challenger') {
        router.push('/challenger');
      } else if (userData.role === 'motivator') {
        router.push('/motivator');
      }
    }
  }, [user, userData, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      alert('Please enter a username');
      return;
    }
    setIsSubmitting(true);

    try {
      if (auth.currentUser) {
        const userRef = doc(firestore, 'users', auth.currentUser.uid);
        await setDoc(userRef, {
          username: username,
          role: role,
          email: auth.currentUser.email,
          photoURL: auth.currentUser.photoURL,
          createdAt: new Date(),
        }, { merge: true });

        // Redirect will be handled by the useEffect once userData updates
      }
    } catch (error) {
      console.error("Error creating profile:", error);
      alert("Failed to create profile. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen bg-[var(--color-secondary)] text-[var(--color-primary)]">Loading...</div>;

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
            Let's get your profile set up.
          </p>
        </div>
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
      </div>
    </div>
  );
}
