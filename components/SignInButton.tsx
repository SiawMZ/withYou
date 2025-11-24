"use client";
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { signInWithGoogle, logOut, signInWithEmail, signUpWithEmail } from '../lib/auth';

const SignInButton = () => {
  const { user } = useAuth();
  const [isEmailMode, setIsEmailMode] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        if (!username) {
          throw new Error("Username is required for sign up");
        }
        await signUpWithEmail(email, password, username);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div className="flex items-center space-x-4">
        <img
          src={user.photoURL || '/default_profile.png'}
          alt="Profile picture"
          className="w-10 h-10 rounded-full bg-[var(--color-highlight)] border-2 border-[var(--color-primary)]"
        />
        <button
          onClick={logOut}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-xl shadow-sm transition-colors"
        >
          Sign Out
        </button>
      </div>
    );
  }

  if (isEmailMode) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-xl absolute top-20 right-4 w-80 z-50 border border-[var(--color-highlight)] animate-fade-in">
        <h3 className="text-xl font-bold mb-4 text-[var(--color-text)]">{isSignUp ? 'Join the Forest' : 'Welcome Back'}</h3>
        {error && <p className="text-red-500 text-xs mb-3 bg-red-50 p-2 rounded">{error}</p>}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-bold text-[var(--color-text)] uppercase tracking-wide mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none"
                required
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-[var(--color-text)] uppercase tracking-wide mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--color-text)] uppercase tracking-wide mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--color-primary)] text-white py-2.5 px-4 rounded-xl hover:bg-[var(--color-accent)] font-bold shadow-md transition-all transform active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>
        <div className="mt-4 text-sm text-center space-y-3">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[var(--color-primary)] font-semibold hover:underline"
          >
            {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
          </button>
          <div className="border-t pt-3">
            <button 
              onClick={() => setIsEmailMode(false)}
              className="text-gray-400 hover:text-gray-600 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
      <button
        onClick={() => setIsEmailMode(true)}
        className="bg-white text-[var(--color-text)] font-bold py-3 px-6 rounded-xl border-2 border-gray-100 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all shadow-sm"
      >
        Email Sign In
      </button>
      <button
        onClick={signInWithGoogle}
        className="bg-[var(--color-primary)] hover:bg-[var(--color-accent)] text-white font-bold py-3 px-6 rounded-xl shadow-md transition-colors flex items-center justify-center"
      >
        <span className="mr-2">G</span> Sign in with Google
      </button>
    </div>
  );
};

export default SignInButton;
