"use client";
import { useState } from 'react';
import { firestore, auth } from '../lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

interface CreateMissionModalProps {
  challengerId: string;
  challengerName: string;
  onClose: () => void;
}

const CreateMissionModal = ({ challengerId, challengerName, onClose }: CreateMissionModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [reward, setReward] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendMission = async () => {
    if (!title.trim() || !description.trim() || !deadline || !reward.trim()) {
      alert('Please fill in all fields');
      return;
    }

    if (!auth.currentUser) return;

    setSending(true);
    try {
      // Create mission document
      await addDoc(collection(firestore, 'missions'), {
        from: auth.currentUser.uid,
        to: challengerId,
        title: title.trim(),
        description: description.trim(),
        deadline: Timestamp.fromDate(new Date(deadline)),
        reward: reward.trim(),
        status: 'pending',
        createdAt: Timestamp.now()
      });

      // Send notification to challenger
      await addDoc(collection(firestore, 'notifications'), {
        to: challengerId,
        from: auth.currentUser.uid,
        fromName: auth.currentUser.displayName || 'Your Motivator',
        type: 'mission_received',
        message: `New mission: ${title}`,
        read: false,
        createdAt: Timestamp.now()
      });

      setSending(false);
      alert('Mission sent successfully!');
      onClose();
    } catch (error) {
      console.error("Error sending mission:", error);
      alert("Failed to send mission. Please try again.");
      setSending(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" 
      onClick={onClose}
    >
      <div 
        className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full shadow-2xl" 
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">
          Send Mission to {challengerName}
        </h2>

        <div className="space-y-4 mb-6">
          {/* Mission Title */}
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text)] mb-1">
              Mission Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Read 30 pages"
              className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text)] mb-1">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the mission details..."
              rows={3}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none transition-colors resize-none"
            />
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text)] mb-1">
              Deadline *
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none transition-colors"
            />
          </div>

          {/* Reward */}
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text)] mb-1">
              Reward *
            </label>
            <input
              type="text"
              value={reward}
              onChange={(e) => setReward(e.target.value)}
              placeholder="e.g., Ice cream treat, 500 points"
              className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none transition-colors"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSendMission}
            disabled={sending}
            className="flex-1 bg-[var(--color-primary)] text-white py-3 rounded-xl font-bold hover:bg-[var(--color-accent)] transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? 'Sending...' : '🚀 Send Mission'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateMissionModal;
