"use client";
import { useState, useEffect } from 'react';
import withAuth from '../../components/withAuth';
import { firestore, auth } from '../../lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, onSnapshot, setDoc, getDoc, orderBy } from 'firebase/firestore';
import Image from 'next/image';

interface FriendRequest {
  id: string;
  from: string;
  to: string;
  status: string;
  username?: string; // Added username field
}

interface User {
  id: string;
  username?: string;
}

interface Friend {
  id: string;
  username?: string;
  friend?: boolean;
}

interface GoalHistory {
  date: any;
  url: string;
  source?: string; // 'current' or goalId
  goalId?: string;
}

interface Goal {
  id?: string;
  name: string;
  createdAt: any;
  lastCompleted?: any;
  history?: GoalHistory[];
  status?: string;
  completedAt?: any;
  milestones?: any[];
}

interface Motivation {
  id: string;
  motivationMessage?: string;
  motivationImageUrl?: string;
  congratsMessage?: string;
  congratsImageUrl?: string;
  type?: 'motivation' | 'congrats';
  saved?: boolean;
  from?: string;
  createdAt?: any;
}

function ProfilePage() {
  const [activeTab, setActiveTab] = useState('Activity');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [activity, setActivity] = useState<GoalHistory[]>([]);
  const [currentGoal, setCurrentGoal] = useState<Goal | null>(null);
  const [pastGoals, setPastGoals] = useState<Goal[]>([]);
  const [savedMotivations, setSavedMotivations] = useState<Motivation[]>([]);
  const [loadingMemories, setLoadingMemories] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Fetch Friends and Requests (Existing logic)
    const friendRequestsRef = collection(firestore, 'friendRequests');
    const q = query(friendRequestsRef, where('to', '==', auth.currentUser.uid), where('status', '==', 'pending'));

    const unsubscribeRequests = onSnapshot(q, (querySnapshot) => {
      const fetchRequestData = async () => {
        const requests = await Promise.all(querySnapshot.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data();
          // Fetch sender's username
          const senderRef = doc(firestore, 'users', data.from);
          const senderSnap = await getDoc(senderRef);
          let senderName = data.from;
          if (senderSnap.exists()) {
            senderName = senderSnap.data().username || data.from;
          }
          
          return { 
            id: docSnapshot.id, 
            ...data,
            username: senderName
          } as FriendRequest;
        }));
        setFriendRequests(requests);
      };
      
      fetchRequestData();
    });

    const friendsRef = collection(firestore, 'users', auth.currentUser.uid, 'friends');
    const unsubscribeFriends = onSnapshot(friendsRef, (querySnapshot) => {
      const fetchFriendsData = async () => {
        const friendsList = await Promise.all(querySnapshot.docs.map(async (friendDoc) => {
          const friendId = friendDoc.id;
          const userDocRef = doc(firestore, 'users', friendId);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data() as User;
            return { id: friendId, username: userData.username, ...friendDoc.data() } as Friend;
          }
          return { id: friendId, ...friendDoc.data() } as Friend;
        }));
        setFriends(friendsList);
      };
      
      fetchFriendsData();
    });

    // Fetch Goal for Activity and Past Goals
    const fetchGoals = async () => {
      if (!auth.currentUser) return;
      
      let allActivity: GoalHistory[] = [];

      // Current Goal
      const goalRef = doc(firestore, 'goals', auth.currentUser.uid);
      const goalSnap = await getDoc(goalRef);
      if (goalSnap.exists()) {
        const goalData = goalSnap.data() as Goal;
        setCurrentGoal(goalData);
        if (goalData.history) {
          const currentHistory = goalData.history.map(h => ({ ...h, source: 'current' }));
          allActivity = [...allActivity, ...currentHistory];
        }
      }

      // Past Goals
      const pastGoalsRef = collection(firestore, 'goals', auth.currentUser.uid, 'pastGoals');
      const pastGoalsSnap = await getDocs(pastGoalsRef);
      const loadedPastGoals = pastGoalsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal));
      
      loadedPastGoals.forEach(goal => {
        if (goal.history) {
          const pastHistory = goal.history.map(h => ({ ...h, source: goal.id, goalId: goal.id }));
          allActivity = [...allActivity, ...pastHistory];
        }
      });

      // Sort by completedAt descending for goals list
      loadedPastGoals.sort((a, b) => (b.completedAt?.seconds || 0) - (a.completedAt?.seconds || 0));
      setPastGoals(loadedPastGoals);

      // Sort all activity by date descending
      allActivity.sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));
      setActivity(allActivity);

      // Fetch Saved Motivations
      // Note: Fetching all and filtering client-side to avoid needing a composite index for now
      const motivationsRef = collection(firestore, 'motivations');
      const savedQ = query(motivationsRef, where('to', '==', auth.currentUser.uid));
      const savedSnap = await getDocs(savedQ);
      const loadedSaved = savedSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Motivation))
        .filter(m => m.saved === true);
      console.log('Fetched saved motivations:', loadedSaved.length);
      setSavedMotivations(loadedSaved);
    };

    fetchGoals();

    return () => {
      unsubscribeRequests();
      unsubscribeFriends();
    };
  }, []);

  // Refetch saved motivations when Memories tab is activated
  useEffect(() => {
    const fetchSavedMotivations = async () => {
      if (!auth.currentUser || activeTab !== 'Memories') return;
      
      setLoadingMemories(true);
      try {
        const motivationsRef = collection(firestore, 'motivations');
        const q = query(motivationsRef, where('to', '==', auth.currentUser.uid));
        const snapshot = await getDocs(q);
        const loadedSaved = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Motivation))
          .filter(m => m.saved === true);
        console.log('Memories tab - Fetched saved motivations:', loadedSaved.length, loadedSaved);
        setSavedMotivations(loadedSaved);
      } catch (error) {
        console.error('Error fetching saved motivations:', error);
      } finally {
        setLoadingMemories(false);
      }
    };

    fetchSavedMotivations();
  }, [activeTab]);

  const deleteActivityItem = async (itemToDelete: GoalHistory) => {
    if (!auth.currentUser) return;
    
    if (!confirm('Are you sure you want to delete this activity item? This cannot be undone.')) {
      return;
    }

    try {
      if (itemToDelete.source === 'current') {
        if (!currentGoal) return;
        const updatedHistory = currentGoal.history?.filter(h => h.url !== itemToDelete.url) || [];
        
        const goalRef = doc(firestore, 'goals', auth.currentUser.uid);
        await updateDoc(goalRef, { history: updatedHistory });
        
        setCurrentGoal({ ...currentGoal, history: updatedHistory });
      } else if (itemToDelete.source) {
        // It's a past goal
        const goalId = itemToDelete.source;
        const targetGoal = pastGoals.find(g => g.id === goalId);
        if (targetGoal) {
          const updatedHistory = targetGoal.history?.filter(h => h.url !== itemToDelete.url) || [];
          
          const goalDocRef = doc(firestore, 'goals', auth.currentUser.uid, 'pastGoals', goalId);
          await updateDoc(goalDocRef, { history: updatedHistory });
          
          setPastGoals(prev => prev.map(g => g.id === goalId ? { ...g, history: updatedHistory } : g));
        }
      }

      // Update local activity state
      setActivity(prev => prev.filter(item => item.url !== itemToDelete.url));

    } catch (error) {
      console.error('Error deleting activity item:', error);
      alert('Failed to delete activity item. Please try again.');
    }
  };

  const deletePastGoal = async (goalId: string) => {
    if (!auth.currentUser) return;
    
    if (!confirm('Are you sure you want to delete this past goal? This cannot be undone.')) {
      return;
    }

    try {
      const goalDocRef = doc(firestore, 'goals', auth.currentUser.uid, 'pastGoals', goalId);
      await deleteDoc(goalDocRef);
      
      setPastGoals(prev => prev.filter(g => g.id !== goalId));
      // Also remove associated activity from the view
      setActivity(prev => prev.filter(item => item.source !== goalId));
    } catch (error) {
      console.error('Error deleting past goal:', error);
      alert('Failed to delete past goal. Please try again.');
    }
  };

  const handleSearch = async () => {
    if (searchTerm.trim() === '') {
      setSearchResults([]);
      return;
    }

    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where('username', '>=', searchTerm), where('username', '<=', searchTerm + '\uf8ff'));
    const querySnapshot = await getDocs(q);
    const users = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as User));
    setSearchResults(users);
  };

  const sendFriendRequest = async (toUserId: string) => {
    if (!auth.currentUser) return;
    const fromUserId = auth.currentUser.uid;
    if (fromUserId === toUserId) {
      alert("You can't add yourself as a friend.");
      return;
    }
    const friendRequestsRef = collection(firestore, 'friendRequests');
    await addDoc(friendRequestsRef, {
      from: fromUserId,
      to: toUserId,
      status: 'pending',
    });
    alert('Friend request sent!');
  };

  const acceptFriendRequest = async (request: FriendRequest) => {
    if (!auth.currentUser) return;
    const fromUserId = request.from;
    const toUserId = auth.currentUser.uid;

    const user1FriendsRef = collection(firestore, 'users', fromUserId, 'friends');
    const user2FriendsRef = collection(firestore, 'users', toUserId, 'friends');

    await setDoc(doc(user1FriendsRef, toUserId), { friend: true });
    await setDoc(doc(user2FriendsRef, fromUserId), { friend: true });

    const requestRef = doc(firestore, 'friendRequests', request.id);
    await deleteDoc(requestRef);
  };

  const declineFriendRequest = async (requestId: string) => {
    const requestRef = doc(firestore, 'friendRequests', requestId);
    await deleteDoc(requestRef);
  };

  return (
    <div className="min-h-screen bg-transparent p-4 pt-24 bg-transparent">
      <div className="container mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold mb-6 text-[var(--color-text)]">Profile & Activity</h1>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200/50 mb-8 backdrop-blur-sm rounded-t-xl bg-white/30 overflow-x-auto">
          {['Activity', 'Memories', 'Past Goals', 'Friends'].map((tab) => (
            <button
              key={tab}
              className={`py-4 px-8 font-bold text-lg transition-all relative ${
                activeTab === tab 
                  ? 'text-[var(--color-primary)]' 
                  : 'text-[var(--color-text)] opacity-60 hover:opacity-100'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-[var(--color-primary)] rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {activeTab === 'Activity' && (
            <div>
              <h2 className="text-xl font-bold mb-6 text-[var(--color-text)]">Recent Activity</h2>
              {activity.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {activity.map((item, index) => (
                    <div key={index} className="glass-panel rounded-2xl p-4 hover-card relative group">
                      <button
                        onClick={() => deleteActivityItem(item)}
                        className="absolute top-2 right-2 p-2 rounded-full bg-red-500/80 text-white hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100 z-10"
                        title="Delete this activity"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      <div className="relative w-full h-48 mb-3 bg-white/50 rounded-xl overflow-hidden">
                         <Image 
                          src={item.url} 
                          alt={`Proof from ${new Date(item.date.seconds * 1000).toLocaleDateString()}`} 
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-[var(--color-text)] font-semibold">
                          {new Date(item.date.seconds * 1000).toLocaleDateString()}
                        </p>
                        <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                          Goal Completed
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 glass-panel rounded-2xl">
                  <p className="text-[var(--color-text)] opacity-50">No activity yet. Start completing your daily goals!</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'Memories' && (
            <div>
              <h2 className="text-xl font-bold mb-6 text-[var(--color-text)]">Saved Memories</h2>
              {loadingMemories ? (
                <div className="text-center py-12 glass-panel rounded-2xl">
                  <p className="text-[var(--color-text)] opacity-50">Loading memories...</p>
                </div>
              ) : (
                <>
                  {savedMotivations.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {savedMotivations.map((motivation) => (
                        <div key={motivation.id} className="glass-panel rounded-2xl overflow-hidden hover-card group relative">
                          <div className="relative w-full h-48 bg-gray-100">
                            <Image 
                              src={motivation.motivationImageUrl || motivation.congratsImageUrl || "/welcome_home_cat.png"} 
                              alt="Memory" 
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            <div className="absolute bottom-0 left-0 p-4">
                              <p className="text-white font-bold text-lg drop-shadow-md line-clamp-2">
                                "{motivation.motivationMessage || motivation.congratsMessage}"
                              </p>
                            </div>
                          </div>
                          <div className="p-4 bg-white/60 backdrop-blur-sm">
                            <div className="flex justify-between items-center">
                              <span className={`text-xs font-bold px-2 py-1 rounded-full ${motivation.type === 'congrats' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {motivation.type === 'congrats' ? '🎉 Congrats' : '☀️ Motivation'}
                              </span>
                              {motivation.createdAt && (
                                <span className="text-xs text-[var(--color-text)] opacity-50">
                                  {new Date(motivation.createdAt.seconds * 1000).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 glass-panel rounded-2xl">
                      <p className="text-[var(--color-text)] opacity-50">No saved memories yet. Save your favorite boosts!</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'Past Goals' && (
            <div>
              <h2 className="text-xl font-bold mb-6 text-[var(--color-text)]">Goal History</h2>
              <div className="space-y-4">
                {/* Current Goal */}
                {currentGoal && (
                  <div className="glass-panel p-6 rounded-2xl border-l-4 border-[var(--color-primary)] hover-card">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-xl text-[var(--color-text)]">{currentGoal.name}</h3>
                        <p className="text-[var(--color-text)] opacity-60 text-sm mt-1">Started: {new Date(currentGoal.createdAt.seconds * 1000).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${currentGoal.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-[var(--color-highlight)] text-[var(--color-text)]'}`}>
                        {currentGoal.status === 'completed' ? 'Completed' : 'Active'}
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Past Goals */}
                {pastGoals.map((goal) => (
                  <div key={goal.id} className="bg-white/60 p-6 rounded-2xl shadow-sm border border-white/50 hover-card opacity-80 hover:opacity-100 transition-all relative group">
                    <button
                      onClick={() => deletePastGoal(goal.id!)}
                      className="absolute top-4 right-4 p-2 rounded-full bg-red-500/80 text-white hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                      title="Delete this past goal"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-xl text-[var(--color-text)]">{goal.name}</h3>
                        <p className="text-[var(--color-text)] opacity-50 text-sm mt-1">
                          Completed: {goal.completedAt ? new Date(goal.completedAt.seconds * 1000).toLocaleDateString() : 'Unknown'}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-full">
                        Archived
                      </span>
                    </div>
                  </div>
                ))}

                {!currentGoal && pastGoals.length === 0 && (
                   <div className="text-center py-12 glass-panel rounded-2xl">
                    <p className="text-[var(--color-text)] opacity-50">No goals found.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'Friends' && (
            <div>
              <div className="grid md:grid-cols-2 gap-8">
                {/* Friends List */}
                <div>
                  <h2 className="text-xl font-bold mb-6 text-[var(--color-text)]">My Friends</h2>
                  <div className="space-y-3">
                    {friends.length > 0 ? (
                      friends.map((friend) => (
                        <div key={friend.id} className="flex items-center justify-between p-4 bg-white/80 rounded-2xl shadow-sm border border-white/50 hover-card">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-[var(--color-highlight)] flex items-center justify-center text-[var(--color-text)] font-bold mr-3 border border-[var(--color-primary)] border-opacity-30">
                              {friend.username ? friend.username.substring(0, 2).toUpperCase() : friend.id.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="font-medium text-[var(--color-text)]">{friend.username || friend.id}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-[var(--color-text)] opacity-50">No friends yet.</p>
                    )}
                  </div>

                  {friendRequests.length > 0 && (
                    <div className="mt-8">
                      <h2 className="text-xl font-bold mb-4 text-[var(--color-text)]">Friend Requests</h2>
                      <div className="space-y-3">
                        {friendRequests.map((request) => (
                          <div key={request.id} className="flex items-center justify-between p-4 bg-white/80 rounded-2xl shadow-sm border border-[var(--color-highlight)] hover-card">
                            <span className="font-medium text-[var(--color-text)]">Request from: {request.username || request.from}</span>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => acceptFriendRequest(request)}
                                className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-600 transition-colors shadow-sm"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => declineFriendRequest(request.id)}
                                className="bg-red-400 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-500 transition-colors shadow-sm"
                              >
                                Decline
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Find Friends */}
                <div>
                  <h2 className="text-xl font-bold mb-6 text-[var(--color-text)]">Find Friends</h2>
                  <div className="flex space-x-2 mb-6">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by username"
                      className="flex-1 border-gray-200 bg-white/80 p-3 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] outline-none shadow-sm"
                    />
                    <button onClick={handleSearch} className="bg-[var(--color-primary)] text-white px-6 py-3 rounded-xl font-bold hover:bg-[var(--color-accent)] transition-colors shadow-md">
                      Search
                    </button>
                  </div>
                  <div className="space-y-3">
                    {searchResults.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 bg-white/80 rounded-2xl shadow-sm border border-white/50 hover-card">
                        <span className="font-medium text-[var(--color-text)]">{user.username}</span>
                        <button
                          onClick={() => sendFriendRequest(user.id)}
                          className="bg-[var(--color-secondary)] text-[var(--color-primary)] border border-[var(--color-primary)] px-4 py-2 rounded-xl text-sm font-bold hover:bg-[var(--color-primary)] hover:text-white transition-all"
                        >
                          Add Friend
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default withAuth(ProfilePage);
