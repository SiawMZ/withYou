"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import withAuth from '../../components/withAuth';
import { useAuth } from '../../context/AuthContext';
import { firestore, auth, storage } from '../../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, setDoc, Timestamp, onSnapshot, updateDoc, deleteDoc, orderBy, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { isToday } from '../../lib/streak';
import Image from 'next/image';
import CreateMissionModal from '../../components/CreateMissionModal';
import MissionVerificationModal from '../../components/MissionVerificationModal';

interface Milestone {
  id: number;
  description: string;
  completed: boolean;
}

interface Challenger {
  id: string;
  username: string;
  goalName?: string;
  lastCompleted?: any;
  milestones?: Milestone[];
  shareMilestones?: boolean;
  history?: any[];
}

interface Notification {
  id: string;
  fromName: string;
  message: string;
  type: 'daily_completion' | 'goal_completion';
  read: boolean;
  createdAt: any;
}

interface Mission {
  id: string;
  from: string;
  to: string;
  title: string;
  description: string;
  deadline: any;
  reward: string;
  const [sending, setSending] = useState(false);
  
    // Mission tracking state
  const [missions, setMissions] = useState<Mission[]>([]);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [selectedMissionForVerification, setSelectedMissionForVerification] = useState<Mission | null>(null);
  // Detail Modal State
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailChallenger, setDetailChallenger] = useState<Challenger | null>(null);
  const [currentMilestoneIndex, setCurrentMilestoneIndex] = useState(0);
  
  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Form States
  const [messageType, setMessageType] = useState<'motivation' | 'congrats'>('motivation');
  const [messageText, setMessageText] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  // Mission Modal States
  const [showCreateMissionModal, setShowCreateMissionModal] = useState(false);
  const [selectedChallengerForMission, setSelectedChallengerForMission] = useState<Challenger | null>(null);


  // Fetch Challengers
  useEffect(() => {
    const fetchChallengers = async () => {
      if (!auth.currentUser) return;

      const friendsRef = collection(firestore, 'users', auth.currentUser.uid, 'friends');
      const friendsSnap = await getDocs(friendsRef);
      const friendIds = friendsSnap.docs.map(doc => doc.id);

      if (friendIds.length === 0) return;

      const challengersData: Challenger[] = [];
      for (const friendId of friendIds) {
        const userDoc = await getDoc(doc(firestore, 'users', friendId));
        const goalDoc = await getDoc(doc(firestore, 'goals', friendId));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const goalData = goalDoc.exists() ? goalDoc.data() : null;
          
          challengersData.push({
            id: friendId,
            username: userData.username || 'Unknown User',
            goalName: goalData?.name,
            lastCompleted: goalData?.lastCompleted,
            milestones: goalData?.milestones || [],
            shareMilestones: userData.settings?.shareMilestones ?? true,
            history: goalData?.history || []
          });
        }
      }
      setChallengers(challengersData);
    };

    fetchChallengers();
  }, []);

  // Fetch Notifications (Real-time)
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(firestore, 'notifications'),
      where('to', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: Notification[] = [];
      snapshot.forEach((doc) => {
        notifs.push({ id: doc.id, ...doc.data() } as Notification);
      });
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, []);

  // Fetch Missions (Real-time)
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(firestore, 'missions'),
      where('from', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const missionsData: Mission[] = [];
      snapshot.forEach((doc) => {
        missionsData.push({ id: doc.id, ...doc.data() } as Mission);
      });
      setMissions(missionsData);
    });

    return () => unsubscribe();
  }, []);

    const getChallenger = (challengerId: string) => {
    return challengers.find(c => c.id === challengerId);
  };

  const handleOpenModal = (challenger: Challenger) => {
    setSelectedChallenger(challenger);
    setShowModal(true);
    setMessageType('motivation');
    setMessageText('');
    setSelectedImage(null);
  };

  const handleOpenDetailModal = (challenger: Challenger) => {
    setDetailChallenger(challenger);
    setCurrentMilestoneIndex(0);
    setShowDetailModal(true);
  };

  const handleSend = async () => {
    if (!auth.currentUser || !selectedChallenger) return;
    if (!messageText.trim()) {
      alert("Please enter a message.");
      return;
    }

    setSending(true);
    try {
      const today = new Date().toLocaleDateString('en-CA');
      const timestamp = Date.now();
      const motivationId = `${auth.currentUser.uid}_${selectedChallenger.id}_${timestamp}`;

      let imageUrl = '';
      if (selectedImage) {
        const storageRef = ref(storage, `motivations/${auth.currentUser.uid}/${timestamp}_${messageType}_${selectedImage.name}`);
        await uploadBytes(storageRef, selectedImage);
        imageUrl = await getDownloadURL(storageRef);
      }

      await setDoc(doc(firestore, 'motivations', motivationId), {
        from: auth.currentUser.uid,
        to: selectedChallenger.id,
        date: today,
        createdAt: Timestamp.now(),
        type: messageType,
        ...(messageType === 'motivation' ? {
          motivationMessage: messageText,
          motivationImageUrl: imageUrl
        } : {
          congratsMessage: messageText,
          congratsImageUrl: imageUrl
        })
      });

      alert('Daily Boost sent successfully!');
      setShowModal(false);
    } catch (error) {
      console.error("Error sending boost:", error);
      alert("Failed to send. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const notifRef = doc(firestore, 'notifications', notificationId);
      await updateDoc(notifRef, { read: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await deleteDoc(doc(firestore, 'notifications', notificationId));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-transparent p-4 pt-24">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[var(--color-text)]">Motivator Dashboard</h1>
            <p className="text-[var(--color-text)] opacity-70">Support your friends on their journey.</p>
          </div>
          <div className="relative">
            <span className="bg-[var(--color-highlight)] text-[var(--color-text)] text-sm font-bold px-4 py-2 rounded-full shadow-sm border border-[var(--color-primary)] border-opacity-20">
              {unreadCount} New Updates
            </span>
          </div>
        </div>

        {/* Notifications Section */}
        {notifications.length > 0 && (
          <div className="mb-10 glass-panel rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4 text-[var(--color-primary)] flex items-center">
              <span className="mr-2">🔔</span> Recent Activity
            </h2>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-4 rounded-xl flex justify-between items-start transition-all duration-200 ${notif.read ? 'bg-white/40' : 'bg-white/80 border-l-4 border-[var(--color-primary)] shadow-sm'}`}
                >
                  <div onClick={() => markAsRead(notif.id)} className="cursor-pointer flex-1">
                    <p className={`text-sm ${notif.read ? 'text-gray-500' : 'text-[var(--color-text)] font-semibold'}`}>
                      {notif.message}
                    </p>
                    <p className="text-xs text-[var(--color-text)] opacity-50 mt-1">
                      {notif.createdAt?.toDate().toLocaleDateString()} {notif.createdAt?.toDate().toLocaleTimeString()}
                    </p>
                  </div>
                  <button 
                    onClick={() => deleteNotification(notif.id)}
                    className="text-gray-400 hover:text-red-400 ml-3 transition-colors"
                    title="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Tabbed Content */}
        <div className="mb-6">
          {/* Tab Navigation */}
          <div className="flex gap-4 mb-6 border-b-2 border-gray-200">
            <button
              onClick={() => setActiveTab('challengers')}
              className={`pb-3 px-4 font-bold text-lg transition-colors relative ${
                activeTab === 'challengers'
                  ? 'text-[var(--color-primary)]'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Your Challengers
              {activeTab === 'challengers' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary)]"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('missions')}
              className={`pb-3 px-4 font-bold text-lg transition-colors relative ${
                activeTab === 'missions'
                  ? 'text-purple-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Active Missions
              {missions.filter(m => m.status === 'verifying').length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {missions.filter(m => m.status === 'verifying').length}
                </span>
              )}
              {activeTab === 'missions' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"></div>
              )}
            </button>
          </div>

          {/* Challengers Tab Content */}
          {activeTab === 'challengers' && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {challengers.length > 0 ? (
                challengers.map((challenger) => (
                  <div key={challenger.id} className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-white/50 hover-card">
                    <div 
                      className="cursor-pointer mb-4" 
                      onClick={() => handleOpenDetailModal(challenger)}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h2 className="text-xl font-bold text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors">{challenger.username}</h2>
                          <p className="text-sm text-[var(--color-text)] opacity-60">{challenger.goalName || 'No goal set'}</p>
                        </div>
                        {challenger.lastCompleted && isToday(challenger.lastCompleted.toDate()) ? (
                          <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
                            Done
                          </span>
                        ) : (
                          <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded-full">
                            Pending
                          </span>
                        )}
                      </div>

                      {challenger.milestones && challenger.milestones.length > 0 && (
                        <div className="mb-4 bg-[var(--color-secondary)]/50 rounded-xl p-3">
                          <h3 className="text-xs font-bold text-[var(--color-text)] opacity-50 uppercase tracking-wider mb-2">Progress</h3>
                          <div className="flex flex-wrap gap-1">
                            {challenger.milestones.map((m) => (
                              <div 
                                key={m.id} 
                                className={`w-2 h-2 rounded-full ${m.completed ? 'bg-[var(--color-primary)]' : 'bg-gray-300'}`}
                                title={challenger.shareMilestones ? m.description : `Milestone ${m.id}`}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-[var(--color-text)] mt-2 opacity-70">
                            {challenger.milestones.filter(m => m.completed).length} / {challenger.milestones.length} Milestones
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleOpenModal(challenger)}
                      className="w-full bg-[var(--color-primary)] text-white py-3 px-4 rounded-xl font-semibold hover:bg-[var(--color-accent)] transition-colors shadow-sm flex items-center justify-center"
                    >
                      <span className="mr-2">🚀</span> Send Boost
                    </button>

                    <button
                      onClick={() => {
                        setSelectedChallengerForMission(challenger);
                        setShowCreateMissionModal(true);
                      }}
                      className="w-full mt-2 bg-purple-500 text-white py-3 px-4 rounded-xl font-semibold hover:bg-purple-600 transition-colors shadow-sm flex items-center justify-center"
                    >
                      <span className="mr-2">🎯</span> Send Mission
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-12 glass-panel rounded-2xl">
                  <p className="text-[var(--color-text)] opacity-50 mb-4">You don't have any challengers yet.</p>
                  <a href="/profile" className="text-[var(--color-primary)] font-bold hover:underline">Add friends in Profile</a>
                </div>
              )}
            </div>
          )}

          {/* Missions Tab Content */}
          {activeTab === 'missions' && (
            <div className="space-y-4">
              {missions.filter(m => ['on-going', 'verifying', 'pending'].includes(m.status)).length > 0 ? (
                missions
                  .filter(m => ['on-going', 'verifying', 'pending'].includes(m.status))
                  .map((mission) => {
                    const challenger = getChallenger(mission.to);
                    return (
                      <div
                        key={mission.id}
                        className={`p-6 rounded-xl flex justify-between items-center transition-all ${
                          mission.status === 'verifying'
                            ? 'bg-yellow-50 border-2 border-yellow-300 shadow-md'
                            : 'bg-white/80 backdrop-blur-sm border border-white/50'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-bold text-xl text-[var(--color-text)]">{mission.title}</p>
                            <span
                              className={`text-xs px-3 py-1 rounded-full font-semibold ${
                                mission.status === 'pending'
                                  ? 'bg-gray-200 text-gray-700'
                                  : mission.status === 'on-going'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              {mission.status === 'pending' && '📤 Pending'}
                              {mission.status === 'on-going' && '⏳ In Progress'}
                              {mission.status === 'verifying' && '🔍 Needs Review'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            For: <span className="font-semibold">{challenger?.username || 'Unknown'}</span>
                          </p>
                          <p className="text-sm text-gray-700 mb-2">{mission.description}</p>
                          <div className="flex gap-4 text-xs text-gray-600">
                            <span>📅 Deadline: {mission.deadline?.toDate?.()?.toLocaleDateString() || 'N/A'}</span>
                            <span>🎁 Reward: {mission.reward}</span>
                          </div>
                        </div>
                        {mission.status === 'verifying' && (
                          <button
                            onClick={() => {
                              setSelectedMissionForVerification(mission);
                              setShowVerificationModal(true);
                            }}
                            className="ml-6 bg-purple-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-600 transition-colors shadow-md"
                          >
                            Review Proof
                          </button>
                        )}
                      </div>
                    );
                  })
              ) : (
                <div className="text-center py-12 glass-panel rounded-2xl">
                  <p className="text-[var(--color-text)] opacity-50">No active missions</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Challenger Detail Modal */}
        {showDetailModal && detailChallenger && (
          <div className="fixed inset-0 bg-white/10 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 max-w-2xl w-full shadow-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-[var(--color-text)]">{detailChallenger.username}</h2>
                  <p className="text-[var(--color-text)] opacity-60 mt-1">{detailChallenger.goalName || 'No active goal'}</p>
                </div>
                <button 
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Milestones Carousel */}
              {detailChallenger.milestones && detailChallenger.milestones.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-[var(--color-primary)]">Milestones</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentMilestoneIndex((prev) => Math.max(0, prev - 1))}
                        disabled={currentMilestoneIndex === 0}
                        className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--color-accent)] transition-colors"
                      >
                        ←
                      </button>
                      <span className="text-sm text-[var(--color-text)] opacity-70 font-medium">
                        {currentMilestoneIndex + 1} / {detailChallenger.milestones.length}
                      </span>
                      <button
                        onClick={() => setCurrentMilestoneIndex((prev) => Math.min(detailChallenger.milestones!.length - 1, prev + 1))}
                        disabled={currentMilestoneIndex === detailChallenger.milestones.length - 1}
                        className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--color-accent)] transition-colors"
                      >
                        →
                      </button>
                    </div>
                  </div>
                  
                  <div className="relative overflow-hidden">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={currentMilestoneIndex}
                        initial={{ x: 300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -300, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(e, { offset, velocity }) => {
                          const swipe = Math.abs(offset.x) * velocity.x;
                          if (swipe < -500 && currentMilestoneIndex < detailChallenger.milestones!.length - 1) {
                            setCurrentMilestoneIndex(currentMilestoneIndex + 1);
                          } else if (swipe > 500 && currentMilestoneIndex > 0) {
                            setCurrentMilestoneIndex(currentMilestoneIndex - 1);
                          }
                        }}
                        className={`p-6 rounded-2xl border-2 cursor-grab active:cursor-grabbing ${
                          detailChallenger.milestones[currentMilestoneIndex].completed 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                              detailChallenger.milestones[currentMilestoneIndex].completed 
                                ? 'bg-green-500 text-white' 
                                : 'bg-gray-300 text-gray-600'
                            }`}>
                              {detailChallenger.milestones[currentMilestoneIndex].completed ? '✓' : detailChallenger.milestones[currentMilestoneIndex].id}
                            </div>
                            <div>
                              <p className={`text-xl font-bold ${
                                detailChallenger.milestones[currentMilestoneIndex].completed 
                                  ? 'text-green-700' 
                                  : 'text-[var(--color-text)]'
                              }`}>
                                Milestone {detailChallenger.milestones[currentMilestoneIndex].id}
                              </p>
                              <p className="text-sm text-[var(--color-text)] opacity-60 mt-1">
                                {detailChallenger.milestones[currentMilestoneIndex].completed ? 'Completed' : 'In Progress'}
                              </p>
                            </div>
                          </div>
                          {detailChallenger.milestones[currentMilestoneIndex].completed && (
                            <span className="text-xs font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                              ✨ Done
                            </span>
                          )}
                        </div>
                        
                        {detailChallenger.shareMilestones ? (
                          <div className="mt-4 p-4 bg-white/50 rounded-xl">
                            <p className="text-[var(--color-text)] leading-relaxed">
                              {detailChallenger.milestones[currentMilestoneIndex].description}
                            </p>
                          </div>
                        ) : (
                          <div className="mt-4 p-4 bg-white/50 rounded-xl text-center">
                            <p className="text-[var(--color-text)] opacity-50 italic text-sm">
                              🔒 Description is private
                            </p>
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  
                  <p className="text-xs text-[var(--color-text)] opacity-40 mt-3 text-center">
                    💡 Swipe or use arrows to navigate
                  </p>
                </div>
              )}

              {/* Recent Activity */}
              <div>
                <h3 className="text-xl font-bold mb-4 text-[var(--color-primary)]">Recent Activity</h3>
                {detailChallenger.history && detailChallenger.history.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {detailChallenger.history.slice(0, 6).map((item, index) => (
                      <div key={index} className="glass-panel rounded-xl p-3 hover-card">
                        <div className="relative w-full h-32 mb-2 bg-white/50 rounded-lg overflow-hidden">
                          <Image 
                            src={item.url} 
                            alt={`Activity ${index + 1}`} 
                            fill
                            className="object-cover"
                          />
                        </div>
                        <p className="text-xs text-[var(--color-text)] font-semibold">
                          {new Date(item.date.seconds * 1000).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 glass-panel rounded-xl">
                    <p className="text-[var(--color-text)] opacity-50">No activity yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Send Boost Modal */}
        {showModal && selectedChallenger && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl transform transition-all scale-100 border-4 border-[var(--color-highlight)]">
              <h3 className="text-2xl font-bold mb-6 text-[var(--color-text)]">Boost {selectedChallenger.username}</h3>
              
              <div className="mb-6 flex bg-[var(--color-secondary)] p-1 rounded-xl">
                <button
                  className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${messageType === 'motivation' ? 'bg-white text-yellow-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  onClick={() => setMessageType('motivation')}
                >
                  ☀️ Motivation
                </button>
                <button
                  className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${messageType === 'congrats' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  onClick={() => setMessageType('congrats')}
                >
                  🎉 Congrats
                </button>
              </div>

              <div className={`p-4 rounded-xl border-2 transition-colors ${messageType === 'motivation' ? 'bg-yellow-50 border-yellow-100' : 'bg-green-50 border-green-100'}`}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-text)] uppercase tracking-wide mb-2">Message</label>
                    <input 
                      type="text" 
                      className="block w-full rounded-lg border-gray-200 focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)] p-3"
                      placeholder={messageType === 'motivation' ? "e.g. You can do it!" : "e.g. Great job!"}
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-text)] uppercase tracking-wide mb-2">Photo (Optional)</label>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-white transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {selectedImage ? (
                                <p className="text-sm text-[var(--color-primary)] font-medium">{selectedImage.name}</p>
                            ) : (
                                <>
                                    <svg className="w-8 h-8 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                                    <p className="text-xs text-gray-500">Click to upload image</p>
                                </>
                            )}
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => setSelectedImage(e.target.files ? e.target.files[0] : null)} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex space-x-3 justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 rounded-xl text-gray-500 hover:bg-gray-100 font-medium transition-colors"
                  disabled={sending}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={sending}
                  className="bg-[var(--color-primary)] text-white px-8 py-3 rounded-xl font-bold hover:bg-[var(--color-accent)] shadow-md transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? 'Sending...' : 'Send Boost'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

              {/* Create Mission Modal */}
        {showCreateMissionModal && selectedChallengerForMission && (
          <CreateMissionModal
            challengerId={selectedChallengerForMission.id}
            challengerName={selectedChallengerForMission.username}
            onClose={() => {
              setShowCreateMissionModal(false);
              setSelectedChallengerForMission(null);
            }}
          />
        )}

                {/* Mission Verification Modal */}
        {showVerificationModal && selectedMissionForVerification && (
          <MissionVerificationModal
            mission={selectedMissionForVerification}
            challengerName={getChallenger(selectedMissionForVerification.to)?.username || 'Unknown'}
            onClose={() => {
              setShowVerificationModal(false);
              setSelectedMissionForVerification(null);
            }}
          />
        )}

    </div>
  );
}

export default withAuth(MotivatorPage);