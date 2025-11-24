
import React, { useState, useEffect, useCallback } from 'react';
import './Confetti.css';

interface ConfettiProps {
  active: boolean;
  onComplete?: () => void;
}

interface Particle {
  id: number;
  color: string;
  x: number;
  y: number;
  rotation: number;
  size: number;
  duration: number;
  delay: number;
}

const Confetti: React.FC<ConfettiProps> = ({ active, onComplete }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  const createConfetti = useCallback(() => {
    const newParticles = [];
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722', '#795548', '#9E9E9E', '#607D8B'];
    const numParticles = 100; // Number of confetti particles

    for (let i = 0; i < numParticles; i++) {
      newParticles.push({
        id: i,
        color: colors[Math.floor(Math.random() * colors.length)],
        x: Math.random() * window.innerWidth, // Random X position across the screen
        y: -Math.random() * window.innerHeight, // Start above the screen
        rotation: Math.random() * 360,
        size: Math.random() * 10 + 5, // Size between 5 and 15px
        duration: Math.random() * 2 + 3, // Duration between 3 and 5 seconds
        delay: Math.random() * 0.5, // Delay up to 0.5 seconds
      });
    }
    setParticles(newParticles);

    // Clear particles after animation duration
    const maxDuration = Math.max(...newParticles.map(p => p.duration + p.delay));
    setTimeout(() => {
      setParticles([]);
      if (onComplete) {
        onComplete();
      }
    }, maxDuration * 1000); // Convert to milliseconds
  }, [onComplete]);

  useEffect(() => {
    if (active) {
      createConfetti();
    }
  }, [active, createConfetti]);

  return (
    <div className="confetti-container">
      {particles.map(p => (
        <div
          key={p.id}
          className="confetti-particle"
          style={{
            backgroundColor: p.color,
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            transform: `rotate(${p.rotation}deg)`,
            animation: `fall ${p.duration}s linear ${p.delay}s forwards,
                        fade ${p.duration}s linear ${p.delay}s forwards,
                        rotate ${p.duration}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
};

export default Confetti;
