"use client";
import Link from 'next/link';
import SignInButton from './SignInButton';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { user, loading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { href: "/challenger", label: "Challenger" },
    { href: "/motivator", label: "Motivator" },
    { href: "/profile", label: "Profile" },
    { href: "/settings", label: "Settings" },
  ];

  // Hide header if not logged in
  // Don't hide during loading to prevent flashing during page transitions
  if (!loading && !user) {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      {/* Desktop Navigation */}
      <nav className="hidden md:flex justify-center pt-6 pb-2">
        <div className="bg-white/60 backdrop-blur-xl shadow-lg rounded-full px-4 lg:px-8 py-3 flex items-center gap-2 lg:gap-8 pointer-events-auto border border-white/40 transition-all hover:bg-white/70 hover:shadow-xl hover:scale-[1.02]">
          <ul className="flex space-x-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link 
                  href={link.href}
                  className="px-2 lg:px-4 py-2 rounded-full text-[var(--color-text)] font-medium text-sm lg:text-base transition-all duration-300 hover:bg-[var(--color-primary)] hover:text-white hover:shadow-md block whitespace-nowrap"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="pl-2 lg:pl-4 border-l border-gray-300/50">
            <SignInButton />
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden flex justify-between items-center px-4 pt-4 pb-2 pointer-events-auto">
        <div className="bg-white/60 backdrop-blur-xl shadow-lg rounded-full px-4 py-2 flex items-center justify-between w-full border border-white/40">
          <Link href="/" className="text-lg font-bold text-[var(--color-primary)]">
            WithYou
          </Link>
          
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-full hover:bg-[var(--color-highlight)] transition-colors"
            aria-label="Toggle menu"
          >
            <svg 
              className="w-6 h-6 text-[var(--color-text)]" 
              fill="none" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden fixed top-16 left-0 right-0 bg-white/95 backdrop-blur-xl shadow-xl pointer-events-auto border-b border-white/40 animate-fade-in">
          <ul className="flex flex-col py-2">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link 
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-6 py-3 text-[var(--color-text)] font-medium transition-colors hover:bg-[var(--color-highlight)] hover:text-[var(--color-primary)]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="px-6 py-3 border-t border-gray-200">
              <SignInButton />
            </li>
          </ul>
        </div>
      )}
    </header>
  );
};

export default Header;
