import React from 'react';

export const SeedIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22C12 22 4 18 4 10C4 5.58 7.58 2 12 2C16.42 2 20 5.58 20 10C20 18 12 22 12 22Z" fillOpacity="0.2" />
    <circle cx="12" cy="10" r="4" />
  </svg>
);

export const SproutIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M2 22H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 22V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 10C12 10 16 10 18 6C18 6 18 11 12 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 10C12 10 8 10 6 6C6 6 6 11 12 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const TrophyIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M8 21H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17 4H7C5.89543 4 5 4.89543 5 6V10C5 12.7614 7.23858 15 10 15H14C16.7614 15 19 12.7614 19 10V6C19 4.89543 18.1046 4 17 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19 4H20C21.1046 4 22 4.89543 22 6V9C22 10.1046 21.1046 11 20 11H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 4H4C2.89543 4 2 4.89543 2 6V9C2 10.1046 2.89543 11 4 11H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
