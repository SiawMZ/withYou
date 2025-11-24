"use client";
import { useState } from 'react';
import { firestore, auth, storage } from '../lib/firebase';
import { doc, updateDoc, deleteDoc, addDoc, collection, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Image from 'next/image';

interface Mission {
  id: string;
  from: string;
  to: string;
  title: string;
  description: string;
  deadline: any;
  reward: string;
  status: 'pending' | 'on-going' | 'verifying' | 'completed' | 'denied';
  proofUrl?: string;
  createdAt: any;
  acceptedAt?: any;
  submittedAt?: any;
  completedAt?: any;
}

interface MissionDetailModalProps {
  mission: Mission;
  onClose: () => void;
}

const MissionDetailModal = ({ mission, onClose }: MissionDetailModalProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleAccept = async () => {
    if (!auth.currentUser) return;
    
    try {
      const missionRef = doc(firestore, 'missions', mission.id);
      await updateDoc(missionRef, {
        status: 'on-going',
        acceptedAt: Timestamp.now()
      });

      // Send notification to motivator
      await addDoc(collection(firestore, 'notifications'), {
        to: mission.from,
        from: auth.currentUser.uid,
        fromName: auth.currentUser.displayName || 'Challenger',
        type: 'mission_accepted',
        message: `Accepted your mission: ${mission.title}`,
        read: false,
        createdAt: Timestamp.now()
      });

      onClose();
    } catch (error) {
      console.error("Error accepting mission:", error);
      alert("Failed to accept mission");
    }
  };

  const handleReject = async () => {
    if (!auth.currentUser) return;
    
    if (!confirm("Are you sure you want to reject this mission?")) return;

    try {
      const missionRef = doc(firestore, 'missions', mission.id);
      await deleteDoc(missionRef);
      onClose();
    } catch (error) {
      console.error("Error rejecting mission:", error);
      alert("Failed to reject mission");
    }
  };

  const handleUploadProof = async () => {
    if (!selectedFile || !auth.currentUser) return;
    
    setUploading(true);
    try {
      // Upload proof image to storage
      const storageRef = ref(storage, `mission-proofs/${auth.currentUser.uid}/${mission.id}`);
      await uploadBytes(storageRef, selectedFile);
      const downloadURL = await getDownloadURL(storageRef);

      // Update mission with proof URL and change status to verifying
      const missionRef = doc(firestore, 'missions', mission.id);
      await updateDoc(missionRef, {
        status: 'verifying',
        proofUrl: downloadURL,
        submittedAt: Timestamp.now()
      });

      // Send notification to motivator
      await addDoc(collection(firestore, 'notifications'), {
        to: mission.from,
        from: auth.currentUser.uid,
        fromName: auth.currentUser.displayName || 'Challenger',
        type: 'mission_submitted',
        message: `Submitted proof for mission: ${mission.title}`,
        read: false,
        createdAt: Timestamp.now()
      });

      setSelectedFile(null);
      setUploading(false);
      onClose();
    } catch (error) {
      console.error("Error uploading proof:", error);
      alert("Failed to upload proof");
      setUploading(false);
    }
  };

  const getDeadlineText = (deadline: any) => {
    if (!deadline) return 'No deadline';
    const deadlineDate = deadline.toDate ? deadline.toDate() : new Date(deadline);
    return deadlineDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const isExpired = () => {
    if (!mission.deadline) return false;
    const deadlineDate = mission.deadline.toDate ? mission.deadline.toDate() : new Date(mission.deadline);
    return deadlineDate < new Date();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fade-in" 
      onClick={onClose}
    >
      <div 
        className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full shadow-2xl transform transition-all scale-100" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-[var(--color-text)] mb-2">{mission.title}</h2>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
              mission.status === 'pending' ? 'bg-blue-100 text-blue-700' :
              mission.status === 'on-going' ? 'bg-yellow-100 text-yellow-700' :
              mission.status === 'verifying' ? 'bg-purple-100 text-purple-700' :
              mission.status === 'completed' ? 'bg-green-100 text-green-700' :
              'bg-red-100 text-red-700'
            }`}>
              {mission.status.toUpperCase()}
            </span>
            {isExpired() && mission.status !== 'completed' && (
              <span className="text-xs px-3 py-1 rounded-full font-semibold bg-red-100 text-red-700">
                EXPIRED
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <p className="text-gray-700 leading-relaxed">{mission.description}</p>
        </div>

        {/* Details */}
        <div className="space-y-3 mb-6 bg-[var(--color-highlight)] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⏰</span>
            <div>
              <p className="text-xs text-gray-500 font-semibold">Deadline</p>
              <p className={`font-semibold ${isExpired() ? 'text-red-600' : 'text-gray-800'}`}>
                {getDeadlineText(mission.deadline)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎁</span>
            <div>
              <p className="text-xs text-gray-500 font-semibold">Reward</p>
              <p className="font-semibold text-[var(--color-primary)]">{mission.reward}</p>
            </div>
          </div>
        </div>

        {/* Proof Image (if exists) */}
        {mission.proofUrl && (
          <div className="mb-6 rounded-xl overflow-hidden">
            <p className="text-xs text-gray-500 font-semibold mb-2">Submitted Proof:</p>
            <div className="relative w-full h-48">
              <Image 
                src={mission.proofUrl} 
                alt="Mission proof" 
                fill
                className="object-cover rounded-xl"
                unoptimized
              />
            </div>
          </div>
        )}

        {/* Actions based on status */}
        <div className="space-y-3">
          {mission.status === 'pending' && (
            <>
              <button
                onClick={handleAccept}
                className="w-full bg-[var(--color-primary)] text-white py-3 rounded-xl font-bold hover:bg-[var(--color-accent)] transition-colors shadow-md transform hover:scale-[1.02]"
              >
                ✅ Accept Mission
              </button>
              <button
                onClick={handleReject}
                className="w-full bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition-colors shadow-md transform hover:scale-[1.02]"
              >
                ❌ Reject Mission
              </button>
            </>
          )}

          {mission.status === 'on-going' && (
            <>
              <div>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange}
                  id="mission-file-upload"
                  className="hidden"
                />
                <label 
                  htmlFor="mission-file-upload"
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-colors shadow-md cursor-pointer ${
                    selectedFile 
                      ? 'bg-blue-500 text-white hover:bg-blue-600' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  📷 {selectedFile ? selectedFile.name : 'Select Proof Image'}
                </label>
              </div>
              {selectedFile && (
                <button
                  onClick={handleUploadProof}
                  disabled={uploading}
                  className="w-full bg-[var(--color-primary)] text-white py-3 rounded-xl font-bold hover:bg-[var(--color-accent)] transition-colors shadow-md transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : '✅ Submit Proof'}
                </button>
              )}
            </>
          )}

          {mission.status === 'verifying' && (
            <div className="text-center py-4 bg-purple-50 rounded-xl">
              <p className="text-purple-700 font-semibold">⏳ Waiting for verification...</p>
              <p className="text-sm text-gray-600 mt-1">Your motivator is reviewing your proof</p>
            </div>
          )}

          {mission.status === 'completed' && (
            <div className="text-center py-4 bg-green-50 rounded-xl">
              <p className="text-2xl mb-2">🎉</p>
              <p className="text-green-700 font-bold text-lg">Mission Complete!</p>
              <p className="text-sm text-gray-600 mt-1">You earned: {mission.reward}</p>
            </div>
          )}

          {mission.status === 'denied' && (
            <>
              <div className="text-center py-3 bg-red-50 rounded-xl mb-3">
                <p className="text-red-700 font-semibold">❌ Proof was rejected</p>
                <p className="text-sm text-gray-600 mt-1">Please try again with better proof</p>
              </div>
              <div>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange}
                  id="mission-file-upload-retry"
                  className="hidden"
                />
                <label 
                  htmlFor="mission-file-upload-retry"
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-colors shadow-md cursor-pointer ${
                    selectedFile 
                      ? 'bg-blue-500 text-white hover:bg-blue-600' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  📷 {selectedFile ? selectedFile.name : 'Select New Proof Image'}
                </label>
              </div>
              {selectedFile && (
                <button
                  onClick={handleUploadProof}
                  disabled={uploading}
                  className="w-full bg-[var(--color-primary)] text-white py-3 rounded-xl font-bold hover:bg-[var(--color-accent)] transition-colors shadow-md transform hover:scale-[1.02] disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : '✅ Resubmit Proof'}
                </button>
              )}
            </>
          )}

          <button
            onClick={onClose}
            className="w-full bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MissionDetailModal;
