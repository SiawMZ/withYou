"use client";
import withAuth from '../../components/withAuth';
import Confetti from '../../components/Confetti';
import MilestonePopup from '../../components/MilestonePopup';
import MissionBoard from '../../components/MissionBoard';
import { useState, useEffect } from 'react';
import { firestore, auth, storage } from '../../lib/firebase';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, Timestamp, collection, query, where, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { isToday } from '../../lib/streak';
import Image from 'next/image';
import { useAuth } from '../../context/AuthContext';
import { SeedIcon, SproutIcon, TrophyIcon } from '../../components/Icons';


interface Milestone {
  id: number;
  description: string;
  completed: boolean;
}

interface Goal {
  name: string;
  description: string;
  createdAt?: any;
  lastCompleted?: any;
  history?: any[];
  milestones?: Milestone[];
  status?: 'active' | 'completed';
  completedAt?: any;
}

interface Motivation {
  id: string;
  motivationMessage?: string;
  motivationImageUrl?: string;
  congratsMessage?: string;
  congratsImageUrl?: string;
  type?: 'motivation' | 'congrats';
  saved?: boolean;
}

const RANK_MILESTONES = [
  { count: 1, rank: 'Seedling' },
  { count: 3, rank: 'Sprout' },
  { count: 7, rank: 'Sapling' },
  { count: 14, rank: 'Tree' },
  { count: 30, rank: 'Forest' },
  { count: 60, rank: 'Guardian' },
  { count: 90, rank: 'Ancient' },
];

function ChallengerPage() {
  const { user,userData, dataLoading } = useAuth();
  const [showConfetti, setShowConfetti] = useState(false);
  const [showMilestonePopup, setShowMilestonePopup] = useState(false);
  const [newRank, setNewRank] = useState('');
  
  const [goalName, setGoalName] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [currentGoal, setCurrentGoal] = useState<Goal | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [allMotivations, setAllMotivations] = useState<Motivation[]>([]);
  const [currentMotivationIndex, setCurrentMotivationIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [loadingMotivations, setLoadingMotivations] = useState(true);

  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [milestoneEditDesc, setMilestoneEditDesc] = useState('');


  useEffect(() => {
  const fetchGoalAndMotivations = async () => {
    // Guard clause: Stop if no user
    if (!user?.uid) return;

    try {
      setLoadingMotivations(true);

      const docRef = doc(firestore, 'goals', user.uid);  // Use user.uid directly
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as Goal;
        if (!data.milestones) {
          data.milestones = Array.from({ length: 7 }, (_, i) => ({
            id: i + 1,
            description: `Milestone ${i + 1}`,
            completed: false
          }));
          await updateDoc(docRef, { milestones: data.milestones });
        }
        setCurrentGoal(data);
      }

const today = new Date().toLocaleDateString('en-CA');
const motivationsRef = collection(firestore, 'motivations');

// Fetch today's messages
const todayQuery = query(motivationsRef, 
  where('to', '==', user.uid),
  where('date', '==', today)
);

// Fetch saved messages
const savedQuery = query(motivationsRef,
  where('to', '==', user.uid),
  where('saved', '==', true)
);

const [todaySnap, savedSnap] = await Promise.all([
  getDocs(todayQuery),
  getDocs(savedQuery)
]);

const loadedMotivations: Motivation[] = [];
const addedIds = new Set<string>(); // Prevent duplicates

// Add today's messages
todaySnap.forEach((doc) => {
  const data = doc.data();
  addedIds.add(doc.id);
  loadedMotivations.push({
    id: doc.id,
    motivationMessage: data.motivationMessage,
    motivationImageUrl: data.motivationImageUrl,
    congratsMessage: data.congratsMessage,
    congratsImageUrl: data.congratsImageUrl,
    type: data.type,
    saved: data.saved || false
  });
});

// Add saved messages (skip if already added from today)
savedSnap.forEach((doc) => {
  if (!addedIds.has(doc.id)) {
    const data = doc.data();
    loadedMotivations.push({
      id: doc.id,
      motivationMessage: data.motivationMessage,
      motivationImageUrl: data.motivationImageUrl,
      congratsMessage: data.congratsMessage,
      congratsImageUrl: data.congratsImageUrl,
      type: data.type,
      saved: data.saved || false
    });
  }
});

setAllMotivations(loadedMotivations);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoadingMotivations(false);
    }
  };
  
  fetchGoalAndMotivations();
  
}, []);

  const isCompletedToday = currentGoal?.lastCompleted && isToday(currentGoal.lastCompleted.toDate());

  const relevantMotivations = allMotivations.filter(m => {
    if (isCompletedToday) {
      return m.type === 'congrats' || m.congratsMessage;
    } else {
      return m.type === 'motivation' || m.motivationMessage;
    }
  });

  useEffect(() => {
    if (relevantMotivations.length > 1) {
      const interval = setInterval(() => {
        setFade(false);
        setTimeout(() => {
          setCurrentMotivationIndex((prev) => (prev + 1) % relevantMotivations.length);
          setFade(true);
        }, 500);
      }, 16000);
      return () => clearInterval(interval);
    } else {
      setCurrentMotivationIndex(0);
    }
  }, [relevantMotivations.length]);

  const toggleSaveMotivation = async (motivation: Motivation) => {
    if (!auth.currentUser) return;
    
    try {
      const motivationRef = doc(firestore, 'motivations', motivation.id);
      const newSavedStatus = !motivation.saved;
      
      await updateDoc(motivationRef, { saved: newSavedStatus });
      
      setAllMotivations(prev => prev.map(m => 
        m.id === motivation.id ? { ...m, saved: newSavedStatus } : m
      ));
    } catch (error) {
      console.error("Error toggling save status:", error);
    }
  };

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000);
  };

  const handleConfettiComplete = () => {
    setShowConfetti(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const notifyFriends = async (type: 'daily_completion' | 'goal_completion', message: string) => {
    if (!auth.currentUser) return;
    
    try {
      const friendsRef = collection(firestore, 'users', auth.currentUser.uid, 'friends');
      const friendsSnap = await getDocs(friendsRef);
      
      const batchPromises = friendsSnap.docs.map(async (friendDoc) => {
        const friendId = friendDoc.id;
        await addDoc(collection(firestore, 'notifications'), {
          to: friendId,
          from: auth.currentUser!.uid,
          fromName: userData?.username || 'Your Friend',
          type: type,
          message: message,
          read: false,
          createdAt: Timestamp.now()
        });
      });

      await Promise.all(batchPromises);
    } catch (error) {
      console.error("Error sending notifications:", error);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !auth.currentUser || !currentGoal) return;
    setUploading(true);

    try {
      const storageRef = ref(storage, `proofs/${auth.currentUser.uid}/${Date.now()}_${selectedFile.name}`);
      await uploadBytes(storageRef, selectedFile);
      const downloadURL = await getDownloadURL(storageRef);

      const goalRef = doc(firestore, 'goals', auth.currentUser.uid);
      await updateDoc(goalRef, {
        lastCompleted: new Date(),
        history: arrayUnion({
          date: new Date(),
          url: downloadURL
        })
      });

      const currentCount = (currentGoal.history?.length || 0) + 1;
      const rankMilestone = RANK_MILESTONES.find(m => m.count === currentCount);
      if (rankMilestone) {
        setNewRank(rankMilestone.rank);
        setShowMilestonePopup(true);
      }

      setCurrentGoal({ 
        ...currentGoal, 
        lastCompleted: Timestamp.fromDate(new Date()),
        history: [...(currentGoal.history || []), { date: new Date(), url: downloadURL }]
      });
      
      await notifyFriends('daily_completion', `${userData?.username || 'Your friend'} completed their daily goal!`);

      setUploading(false);
      setSelectedFile(null);
      triggerConfetti();
    } catch (error) {
      console.error("Error uploading proof:", error);
      alert("Failed to upload proof. Please try again.");
      setUploading(false);
    }
  };

  const createGoal = async () => {
    if (goalName.trim() === '' || goalDescription.trim() === '') {
      alert('Goal name and description cannot be empty.');
      return;
    }
    
    if (!auth.currentUser) return;

    try {
      const goalRef = doc(firestore, 'goals', auth.currentUser.uid);
      
      // Fetch the current goal from Firestore to ensure we have the latest data
      // and to handle cases where local state might be null (e.g. after completion)
      const goalSnap = await getDoc(goalRef);
      
      if (goalSnap.exists()) {
        const existingGoal = goalSnap.data() as Goal;
        const pastGoalsRef = collection(firestore, 'goals', auth.currentUser.uid, 'pastGoals');
        await addDoc(pastGoalsRef, {
          ...existingGoal,
          archivedAt: new Date(),
          // Preserve the status, or mark as abandoned if not completed
          status: existingGoal.status === 'completed' ? 'completed' : 'abandoned'
        });
      }

      const newGoal: Goal = {
        name: goalName,
        description: goalDescription,
        createdAt: new Date(),
        lastCompleted: null,
        history: [],
        status: 'active',
        milestones: Array.from({ length: 7 }, (_, i) => ({
          id: i + 1,
          description: `Milestone ${i + 1}`,
          completed: false
        }))
      };
      await setDoc(goalRef, newGoal);
      setCurrentGoal(newGoal);
      setGoalName('');
      setGoalDescription('');
    } catch (error) {
      console.error("Error creating goal:", error);
      alert("Failed to create goal. Please try again.");
    }
  };

  const openMilestoneModal = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
    setMilestoneEditDesc(milestone.description);
    setIsMilestoneModalOpen(true);
  };

  const saveMilestoneDescription = async () => {
    if (!auth.currentUser || !currentGoal || !selectedMilestone) return;
    
    const updatedMilestones = currentGoal.milestones?.map(m => 
      m.id === selectedMilestone.id ? { ...m, description: milestoneEditDesc } : m
    );

    const goalRef = doc(firestore, 'goals', auth.currentUser.uid);
    await updateDoc(goalRef, { milestones: updatedMilestones });
    
    setCurrentGoal({ ...currentGoal, milestones: updatedMilestones });
    setIsMilestoneModalOpen(false);
  };

  const completeMilestone = async () => {
    if (!auth.currentUser || !currentGoal || !selectedMilestone) return;

    const updatedMilestones = currentGoal.milestones?.map(m => 
      m.id === selectedMilestone.id ? { ...m, completed: true } : m
    );

    const goalRef = doc(firestore, 'goals', auth.currentUser.uid);
    
    const allCompleted = updatedMilestones?.every(m => m.completed);
    
    if (allCompleted) {
      await updateDoc(goalRef, { 
        milestones: updatedMilestones,
        status: 'completed',
        completedAt: new Date()
      });

      // Delete unsaved motivations from Firestore AND update local state
      try {
        const motivationsRef = collection(firestore, 'motivations');
        const q = query(motivationsRef, where('to', '==', auth.currentUser.uid));
        const snapshot = await getDocs(q);
        
        const allMotivationsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Motivation));
        const unsavedMotivations = allMotivationsData.filter(m => !m.saved);
        
        // Delete from Firestore
        const deletePromises = unsavedMotivations.map(m => deleteDoc(doc(firestore, 'motivations', m.id)));
        await Promise.all(deletePromises);
        
        // Update local state to remove unsaved motivations immediately
        const savedMotivationsOnly = allMotivationsData.filter(m => m.saved);
        setAllMotivations(savedMotivationsOnly);
        console.log(`Deleted ${unsavedMotivations.length} unsaved motivations, kept ${savedMotivationsOnly.length} saved ones`);
      } catch (error) {
        console.error("Error cleaning up unsaved motivations:", error);
      }

      setCurrentGoal({ 
        ...currentGoal, 
        milestones: updatedMilestones, 
        status: 'completed', 
        completedAt: new Date() 
      });
      
      await notifyFriends('goal_completion', `${userData?.username || 'Your friend'} has completed their goal: ${currentGoal.name}!`);

      triggerConfetti();
      alert("CONGRATULATIONS! You have completed all milestones and achieved your goal!");
    } else {
      await updateDoc(goalRef, { milestones: updatedMilestones });
      setCurrentGoal({ ...currentGoal, milestones: updatedMilestones });
    }
    
    setIsMilestoneModalOpen(false);
  };

  const currentMotivation = relevantMotivations.length > 0 ? relevantMotivations[currentMotivationIndex] : null;

  if (currentGoal?.status === 'completed') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-transparent text-center">
        <Confetti active={showConfetti} onComplete={handleConfettiComplete} />
        <div className="glass-panel p-10 rounded-3xl max-w-lg w-full animate-scale-up">
          <h1 className="text-4xl font-bold text-[var(--color-primary)] mb-6">Mission Accomplished!</h1>
          <div className="relative w-64 h-64 mx-auto mb-6">
            <Image src="/great_job_cat.png" alt="Goal Achieved" fill className="object-contain" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">{currentGoal.name} Completed!</h2>
          <p className="text-[var(--color-text)] mb-8 opacity-80">You have successfully completed all milestones. Outstanding work!</p>
          <button 
            onClick={() => setCurrentGoal(null)}
            className="bg-[var(--color-primary)] text-white py-3 px-8 rounded-full text-lg font-semibold hover:bg-[var(--color-accent)] transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Start New Mission
          </button>
        </div>
      </div>
    );
  }

 return (
    <div className="min-h-screen flex flex-col p-4 pt-24 bg-transparent">
      <Confetti active={showConfetti} onComplete={handleConfettiComplete} />
      
      {showMilestonePopup && (
        <MilestonePopup 
          rank={newRank} 
          onAcknowledge={() => setShowMilestonePopup(false)} 
        />
      )}

      {/* Header Section */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          {currentGoal ? currentGoal.name : 'My Journey'}
        </h1>
        {currentGoal && (
          <div className="flex items-center gap-2 text-sm text-[var(--color-text)] font-semibold bg-gradient-to-r from-[var(--color-primary)]/20 to-[var(--color-accent)]/20 px-4 py-2 rounded-full shadow-sm border border-[var(--color-primary)] border-opacity-30">
            <TrophyIcon className="w-5 h-5 text-[var(--color-primary)]" />
            <span>
              {(() => {
                const completedCount = currentGoal.history?.length || 0;
                const currentRank = [...RANK_MILESTONES].reverse().find(m => completedCount >= m.count);
                return currentRank ? currentRank.rank : 'Seedling';
              })()}
            </span>
            <span className="text-xs opacity-70">({currentGoal.history?.length || 0} days)</span>
          </div>
        )}
      </div>
      
      {/* Milestones Progress Bar */}
      {currentGoal && (
        <div className="mb-4 overflow-x-auto pb-2 no-scrollbar">
          <div className="flex justify-center min-w-max px-4 gap-6 md:gap-8 mx-auto">
            {currentGoal.milestones?.map((milestone, index) => {
              const isLast = index === (currentGoal.milestones?.length || 0) - 1;
              return (
                <div key={milestone.id} className="flex flex-col items-center group cursor-pointer" onClick={() => openMilestoneModal(milestone)}>
                  <div 
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 
                      ${milestone.completed 
                        ? 'text-[var(--color-primary)] scale-110 drop-shadow-md' 
                        : 'text-gray-300 group-hover:text-[var(--color-primary)] group-hover:scale-105'}`}
                  >
                    {isLast ? <TrophyIcon className="w-12 h-12" /> : 
                     milestone.completed ? <SproutIcon className="w-12 h-12" /> : 
                     <SeedIcon className="w-12 h-12" />}
                  </div>
                  <span className={`text-[9px] mt-1 font-bold transition-colors ${milestone.completed ? 'text-[var(--color-primary)]' : 'text-gray-400'}`}>
                    M{milestone.id}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content Area - Split into Two Columns */}
      <div className="flex-grow flex flex-col items-center lg:flex-row lg:items-start lg:justify-center gap-6 relative">
        
        {/* LEFT COLUMN: Changes based on Goal Status (Active vs Completed vs New) */}
        <div className="w-full max-w-md flex flex-col items-center">
          {currentGoal ? (
            isCompletedToday ? (
              // --- SCENARIO 1: Goal Done Today ---
              <div className={`transition-opacity duration-500 ease-in-out text-center animate-fade-in glass-panel p-8 rounded-3xl w-full relative  ${fade ? 'opacity-100' : 'opacity-0'}`}>
                
                {currentMotivation && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSaveMotivation(currentMotivation);
                    }}
                    className="absolute top-4 right-4 p-3 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40 transition-all transform hover:scale-110 group/btn z-20"
                    title={currentMotivation.saved ? "Unsave" : "Save to Memories"}
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className={`h-6 w-6 transition-colors ${currentMotivation.saved ? 'text-red-500 fill-current' : 'text-gray-600'}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                )}
                
                <div className="relative w-full h-[40vh] mx-auto mb-6">
                   <Image 
                    src={currentMotivation?.congratsImageUrl || "/great_job_cat.png"} 
                    alt="Great Job" 
                    fill
                    className="object-contain drop-shadow-xl"
                  />
                </div>
                <h3 className="text-3xl font-bold text-[var(--color-primary)] mb-2">
                  {currentMotivation?.congratsMessage || "You did a great Job today!"}
                </h3>
                <p className="text-[var(--color-text)] opacity-70">See you tomorrow!</p>
              </div>
            ) : (
              // --- SCENARIO 2: Goal Not Done (Show Motivation + Upload) ---
              <>
                <div className={`transition-opacity duration-500 ease-in-out w-full flex flex-col items-center ${fade ? 'opacity-100' : 'opacity-0'}`}>
                  {loadingMotivations ? (
                    <div className="w-full flex items-center justify-center py-12">
                      <div className="animate-pulse text-[var(--color-text)] opacity-50">Loading...</div>
                    </div>
                  ) : currentMotivation ? (
                    <div className="relative w-full glass-panel rounded-3xl overflow-hidden shadow-2xl border border-white/40 group">
                      <div className="relative w-full h-[60vh]">
                        <Image 
                          src={currentMotivation.motivationImageUrl || "/welcome_home_cat.png"} 
                          alt="Motivation" 
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                      </div>
                      
                      <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
                        <p className="text-xl md:text-2xl font-bold text-white drop-shadow-md leading-relaxed">
                          "{currentMotivation.motivationMessage}"
                        </p>
                      </div>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSaveMotivation(currentMotivation);
                        }}
                        className="absolute top-4 right-4 p-3 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40 transition-all transform hover:scale-110 group/btn z-20"
                      >
                        {/* Save Icon SVG */}
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-colors ${currentMotivation.saved ? 'text-red-500 fill-current' : 'text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="text-center opacity-90 glass-panel p-8 rounded-3xl w-full">
                      <div className="relative w-64 h-64 mx-auto mb-6">
                        <Image src="/welcome_home_cat.png" alt="Welcome" fill className="object-contain" />
                      </div>
                      <h2 className="text-2xl font-bold text-[var(--color-text)]">Ready to grow?</h2>
                      <p className="text-[var(--color-text)] mt-2">Upload your proof to start the day.</p>
                    </div>
                  )}
                </div>

                <div className="mt-8 relative group z-10">
                  <input type="file" accept="image/*" onChange={handleFileChange} id="file-upload" className="hidden" />
                  <label htmlFor="file-upload" className={`cursor-pointer flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-primary)] text-white shadow-xl hover:bg-[var(--color-accent)] hover:scale-110 transition-all duration-300 glass-icon border-4 border-white/30 ${uploading ? 'animate-pulse' : ''}`}>
                    {selectedFile ? <span className="text-2xl">✓</span> : <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}
                  </label>
                  {selectedFile && (
                    <button onClick={handleUpload} disabled={uploading} className="absolute top-2 left-20 bg-[var(--color-accent)] text-green-500 px-6 py-2 rounded-full font-bold shadow-lg hover:bg-opacity-90 whitespace-nowrap transition-all animate-fade-in glass-panel border-none">
                      {uploading ? 'Planting...' : 'Upload Proof'}
                    </button>
                  )}
                </div>
              </>
            )
          ) : (
            // --- SCENARIO 3: No Goal Yet (Show Create Form) ---
            <div className="w-full bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-xl border border-white/50 animate-scale-up">
              <h2 className="text-2xl font-bold text-[var(--color-text)] mb-6 text-center">Plant a New Goal</h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-[var(--color-text)] opacity-70 mb-1">Goal Name</label>
                  <input type="text" className="block w-full rounded-xl border-gray-200 bg-white/50 focus:border-[var(--color-primary)] p-3 transition-colors shadow-sm" value={goalName} onChange={(e) => setGoalName(e.target.value)} placeholder="e.g., Morning Jog" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--color-text)] opacity-70 mb-1">Description</label>
                  <textarea rows={3} className="block w-full rounded-xl border-gray-200 bg-white/50 focus:border-[var(--color-primary)] p-3 transition-colors shadow-sm" value={goalDescription} onChange={(e) => setGoalDescription(e.target.value)} placeholder="What do you want to achieve?" />
                </div>
                <button onClick={createGoal} className="w-full py-3 px-4 rounded-xl text-white bg-[var(--color-primary)] hover:bg-[var(--color-accent)] font-bold shadow-md transition-all transform hover:scale-[1.02]">Start Growing</button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Mission Board - ALWAYS VISIBLE if a goal exists */}
        {/* We keep this OUTSIDE the isCompletedToday logic */}
        {currentGoal && (
           <div className="w-full max-w-md lg:w-80 lg:max-w-none lg:flex-shrink-0 lg:ml-4">
              <MissionBoard />
           </div>
        )}

      </div>

      {/* Modal Logic (Keep as is) */}
      {isMilestoneModalOpen && selectedMilestone && (
         // ... your modal code ...
         <div className="fixed inset-0 bg-white/10 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
           {/* ... modal content ... */}
           {/* (Just ensuring you keep this part) */}
             <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 max-w-sm w-full shadow-2xl transform transition-all scale-100 border border-white/50">
            <h3 className="text-2xl font-bold mb-6 text-[var(--color-text)] text-center">Milestone {selectedMilestone.id}</h3>
            
            <div className="mb-8">
              <label className="block text-xs font-bold text-[var(--color-text)] uppercase tracking-wide mb-2 text-center">Description</label>
              <input 
                type="text" 
                className="w-full border-b-2 border-gray-200 focus:border-[var(--color-primary)] outline-none py-2 text-lg text-center bg-transparent transition-colors font-medium"
                value={milestoneEditDesc}
                onChange={(e) => setMilestoneEditDesc(e.target.value)}
                disabled={selectedMilestone.completed}
              />
            </div>

            <div className="space-y-3">
              {!selectedMilestone.completed && (
                <button 
                  onClick={saveMilestoneDescription}
                  className="w-full bg-gray-100 text-[var(--color-text)] py-3 rounded-xl hover:bg-gray-200 font-bold transition-colors"
                >
                  Save Changes
                </button>
              )}
              
              {!selectedMilestone.completed ? (
                <button 
                  onClick={completeMilestone}
                  className="w-full bg-[var(--color-primary)] text-white py-3 rounded-xl hover:bg-opacity-90 font-bold shadow-md transition-transform active:scale-95"
                >
                  Mark as Completed
                </button>
              ) : (
                <div className="text-center text-[var(--color-primary)] font-bold py-3 border-2 border-[var(--color-primary)] rounded-xl bg-[var(--color-secondary)]">
                  ✓ Completed
                </div>
              )}

              <button
                onClick={() => setIsMilestoneModalOpen(false)}
                className="w-full text-gray-400 py-2 text-sm hover:text-gray-600 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
         </div>
      )}
    </div>
  );
}

export default withAuth(ChallengerPage);