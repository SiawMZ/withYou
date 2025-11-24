import React from 'react';

interface MilestonePopupProps {
  rank: string;
  onAcknowledge: () => void;
}

const MilestonePopup: React.FC<MilestonePopupProps> = ({ rank, onAcknowledge }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 animate-fade-in backdrop-blur-sm">
      <div className="bg-white p-8 rounded-3xl text-center shadow-2xl max-w-sm w-full mx-4 transform transition-all animate-scale-up border-4 border-[var(--color-highlight)]">
        <div className="mb-4 text-6xl animate-bounce">
          🌱
        </div>
        <h2 className="text-2xl font-bold text-[var(--color-primary)] mb-2">Congratulations!</h2>
        <p className="text-[var(--color-text)] opacity-80 text-lg">You've reached the rank of</p>
        <h3 className="text-4xl font-extrabold text-[var(--color-text)] my-6 uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)]">
          {rank}
        </h3>
        <button 
          onClick={onAcknowledge}
          className="bg-[var(--color-primary)] text-white py-3 px-8 text-lg font-bold rounded-xl hover:bg-[var(--color-accent)] transition-all transform hover:scale-105 shadow-lg"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default MilestonePopup;
