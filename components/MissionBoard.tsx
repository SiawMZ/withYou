"use client";
import { useState, useEffect } from 'react';



import { firestore } from '../lib/firebase'; // Removed auth import, we use useAuth now
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import MissionDetailModal from './MissionDetailModal';
import { useAuth } from '../context/AuthContext'; // Import this!

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
  acceptedAt?: any;
  submittedAt?: any;
  completedAt?: any;
}

interface MissionBoardProps {
  className?: string;
}

const MissionBoard = ({ className = "" }: MissionBoardProps) => {
  // 1. Use Context instead of auth.currentUser
  const { user } = useAuth(); 
  
  const [activeTab, setActiveTab] = useState<'wanted' | 'completed'>('wanted');
  const [wantedMissions, setWantedMissions] = useState<Mission[]>([]);
  const [completedMissions, setCompletedMissions] = useState<Mission[]>([]);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);

  useEffect(() => {
    // 2. Wait for user to be available from context
    if (!user?.uid) return;

    // Subscribe to missions addressed to this user
    const missionsRef = collection(firestore, 'missions');
    
    // NOTE: This query (where + orderBy) requires a Firestore Composite Index.
    // Check your browser console; if you see a red link from Firebase, click it to create the index.
    const q = query(
      missionsRef,
      where('to', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const missions: Mission[] = [];
      snapshot.forEach((doc) => {
        missions.push({ id: doc.id, ...doc.data() } as Mission);
      });

      // Separate into wanted (active) and completed
      setWantedMissions(missions.filter(m => m.status !== 'completed' && m.status !== 'cancelled'));
      setCompletedMissions(missions.filter(m => m.status === 'completed'));
    }, (error) => {
      console.error("Error fetching missions:", error);
    });

    return () => unsubscribe();
  }, [user?.uid]); // 3. Re-run only if user ID changes

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { color: 'bg-blue-500', text: 'Pending' },
      'on-going': { color: 'bg-yellow-500', text: 'On-going' },
      verifying: { color: 'bg-purple-500', text: 'Verifying' },
      completed: { color: 'bg-green-500', text: 'Completed' },
      denied: { color: 'bg-red-500', text: 'Denied' }
    };
    const badge = badges[status as keyof typeof badges] || badges.pending;
    return (
      <span className={`${badge.color} text-white text-xs px-2 py-1 rounded-full`}>
        {badge.text}
      </span>
    );
  };

  const getDeadlineText = (deadline: any) => {
    if (!deadline) return '';
    const deadlineDate = deadline.toDate ? deadline.toDate() : new Date(deadline);
    const now = new Date();
    // Calculate difference in days (start of day to start of day roughly)
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `Expired`;
    if (diffDays === 0) return `Due today`;
    if (diffDays === 1) return `Due tomorrow`;
    return `${diffDays} days left`;
  };

  return (
    <div className={`${className} glass-panel rounded-3xl p-6 h-full flex flex-col`}>
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">🎯 Mission Board</h2>
        
        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('wanted')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'wanted'
                ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            New Mission ({wantedMissions.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'completed'
                ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Completed ({completedMissions.length})
          </button>
        </div>
      </div>

      {/* Mission List */}
      <div className="flex-1 overflow-y-auto space-y-3 min-h-[200px]">
        {activeTab === 'wanted' ? (
          wantedMissions.length > 0 ? (
            wantedMissions.map((mission) => (
              <div
                key={mission.id}
                onClick={() => setSelectedMission(mission)}
                className="bg-white/50 rounded-xl p-4 cursor-pointer hover:bg-white/70 transition-all hover:shadow-md"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-[var(--color-text)] flex-1 pr-2 truncate">{mission.title}</h3>
                  {getStatusBadge(mission.status)}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>⏰ {getDeadlineText(mission.deadline)}</span>
                  <span>•</span>
                  <span className="truncate max-w-[100px]">🎁 {mission.reward}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg">No active missions</p>
              <p className="text-sm mt-2">Your motivator will send you missions!</p>
            </div>
          )
        ) : (
          completedMissions.length > 0 ? (
            completedMissions.map((mission) => (
              <div
                key={mission.id}
                onClick={() => setSelectedMission(mission)}
                className="bg-white/50 rounded-xl p-4 cursor-pointer hover:bg-white/70 transition-all hover:shadow-md"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-[var(--color-text)] flex-1 pr-2 truncate">{mission.title}</h3>
                  {getStatusBadge(mission.status)}
                </div>
                <div className="text-sm text-gray-600">
                  ✅ Completed • 🎁 {mission.reward}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg">No completed missions yet</p>
              <p className="text-sm mt-2">Complete missions to see them here!</p>
            </div>
          )
        )}
      </div>

      {/* Mission Detail Modal */}
      {selectedMission && (
        <MissionDetailModal
          mission={selectedMission}
          onClose={() => setSelectedMission(null)}
        />
      )}
    </div>
  );
};

export default MissionBoard;