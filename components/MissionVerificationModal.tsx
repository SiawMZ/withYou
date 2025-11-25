"use client";
import { firestore, auth } from '../lib/firebase';
import { doc, updateDoc, Timestamp, addDoc, collection } from 'firebase/firestore';
import Image from 'next/image';

interface Mission {
  id: string;
  from: string;
  to: string;
  title: string;
  description: string;
  deadline: any;
  reward: string;
  status: 'pending' | 'on-going' | 'verifying' | 'completed' | 'denied' | 'cancelled';
  proofUrl?: string;
  createdAt: any;
  submittedAt?: any;
}

interface MissionVerificationModalProps {
  mission: Mission;
  challengerName: string;
  onClose: () => void;
}

const MissionVerificationModal = ({ mission, challengerName, onClose }: MissionVerificationModalProps) => {
  const handleApprove = async () => {
    if (!auth.currentUser) return;

    try {
      // Update mission status to completed
      const missionRef = doc(firestore, 'missions', mission.id);
      await updateDoc(missionRef, {
        status: 'completed',
        completedAt: Timestamp.now()
      });

      // Send notification to challenger
      await addDoc(collection(firestore, 'notifications'), {
        to: mission.to,
        from: auth.currentUser.uid,
        fromName: auth.currentUser.displayName || 'Your Motivator',
        type: 'mission_verified',
        message: `Your mission "${mission.title}" was approved! 🎉`,
        read: false,
        createdAt: Timestamp.now()
      });

      alert('Mission approved!');
      onClose();
    } catch (error) {
      console.error("Error approving mission:", error);
      alert("Failed to approve mission");
    }
  };

  const handleDeny = async () => {
    if (!auth.currentUser) return;

    if (!confirm('Are you sure you want to deny this mission? The challenger will need to resubmit proof.')) {
      return;
    }

    try {
      // Update mission status back to on-going
      const missionRef = doc(firestore, 'missions', mission.id);
      await updateDoc(missionRef, {
        status: 'on-going',
        proofUrl: null // Remove the rejected proof
      });

      // Send notification to challenger
      await addDoc(collection(firestore, 'notifications'), {
        to: mission.to,
        from: auth.currentUser.uid,
        fromName: auth.currentUser.displayName || 'Your Motivator',
        type: 'mission_verified',
        message: `Your proof for "${mission.title}" needs improvement. Please try again.`,
        read: false,
        createdAt: Timestamp.now()
      });

      alert('Mission proof denied');
      onClose();
    } catch (error) {
      console.error("Error denying mission:", error);
      alert("Failed to deny mission");
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" 
      onClick={onClose}
    >
      <div 
        className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto" 
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-[var(--color-text)] mb-2">
          Verify Mission: {mission.title}
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Submitted by: <span className="font-semibold">{challengerName}</span>
        </p>

        {/* Mission Details */}
        <div className="bg-[var(--color-highlight)] rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-[var(--color-text)] mb-2">Mission Details</h3>
          <p className="text-sm text-gray-700 mb-2">{mission.description}</p>
          <div className="flex gap-4 text-xs text-gray-600">
            <span>📅 Deadline: {mission.deadline?.toDate?.()?.toLocaleDateString() || 'N/A'}</span>
            <span>🎁 Reward: {mission.reward}</span>
          </div>
        </div>

        {/* Submitted Proof */}
        {mission.proofUrl && (
          <div className="mb-6">
            <h3 className="font-semibold text-[var(--color-text)] mb-3">Submitted Proof</h3>
            <div className="relative w-full h-96 rounded-xl overflow-hidden border-4 border-[var(--color-primary)]/20">
              <Image
                src={mission.proofUrl}
                alt="Mission proof"
                fill
                className="object-contain bg-gray-50"
                unoptimized
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Submitted: {mission.submittedAt?.toDate?.()?.toLocaleString() || 'Unknown'}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleApprove}
            className="flex-1 bg-green-500 text-white py-3 rounded-xl font-bold hover:bg-green-600 transition-colors shadow-md flex items-center justify-center gap-2"
          >
            ✅ Approve Mission
          </button>
          <button
            onClick={handleDeny}
            className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition-colors shadow-md flex items-center justify-center gap-2"
          >
            ❌ Deny Proof
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-3 bg-gray-200 text-gray-700 py-2 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default MissionVerificationModal;
