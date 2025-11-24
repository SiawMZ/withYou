"use client";
import withAuth from '../../components/withAuth';
import { auth, firestore } from '../../lib/firebase';
import { doc, updateDoc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { logOut } from '../../lib/auth';

function SettingsPage() {
  const [username, setUsername] = useState('');
  const [currentGoalName, setCurrentGoalName] = useState<string | null>(null);
  const [shareMilestones, setShareMilestones] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) return;
      
      // Fetch User Data & Settings
      const userRef = doc(firestore, 'users', auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setUsername(data.username || '');
        // Default to true if not set
        if (data.settings && data.settings.shareMilestones !== undefined) {
          setShareMilestones(data.settings.shareMilestones);
        }
      }

      // Fetch Goal
      const goalRef = doc(firestore, 'goals', auth.currentUser.uid);
      const goalSnap = await getDoc(goalRef);
      if (goalSnap.exists()) {
        setCurrentGoalName(goalSnap.data().name);
      }
    };
    fetchUserData();
  }, []);

  const handleUpdateUsername = async () => {
    if (username.trim() === '') {
      alert('Username cannot be empty.');
      return;
    }
    if (!auth.currentUser) return;
    const userRef = doc(firestore, 'users', auth.currentUser.uid);
    await updateDoc(userRef, {
      username: username,
    });
    alert('Username updated successfully!');
  };

  const handleTogglePrivacy = async () => {
    if (!auth.currentUser) return;
    const newValue = !shareMilestones;
    setShareMilestones(newValue);
    
    const userRef = doc(firestore, 'users', auth.currentUser.uid);
    // Use setDoc with merge to ensure settings object exists
    await setDoc(userRef, {
      settings: {
        shareMilestones: newValue
      }
    }, { merge: true });
  };

  const handleDeleteGoal = async () => {
    if (window.confirm('Are you sure you want to delete your current goal? All progress will be lost.')) {
      if (!auth.currentUser) return;
      const goalRef = doc(firestore, 'goals', auth.currentUser.uid);
      await deleteDoc(goalRef);
      setCurrentGoalName(null);
      alert('Goal deleted successfully!');
    }
  };

  return (
    <div className="min-h-screen bg-transparent p-4 pt-24 bg-transparent">
      <div className="container mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold mb-8 text-[var(--color-text)]">Settings</h1>
        <div className="space-y-8">
          
          {/* Edit Profile */}
          <div className="glass-panel p-8 rounded-3xl hover-card">
            <h2 className="text-xl font-bold mb-6 text-[var(--color-primary)]">Edit Profile</h2>
            <div>
              <label htmlFor="username" className="block text-xs font-bold text-[var(--color-text)] uppercase tracking-wide mb-2">
                Username
              </label>
              <div className="mt-1 flex space-x-4">
                <input
                  type="text"
                  name="username"
                  id="username"
                  className="flex-1 shadow-sm focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] block w-full sm:text-sm border-gray-200 rounded-xl p-3 bg-white/50 outline-none transition-colors"
                  placeholder="your_username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <button
                  onClick={handleUpdateUsername}
                  className="inline-flex justify-center py-3 px-6 border border-transparent shadow-md text-sm font-bold rounded-xl text-white bg-[var(--color-primary)] hover:bg-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] transition-all transform active:scale-95"
                >
                  Save
                </button>
              </div>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="glass-panel p-8 rounded-3xl hover-card">
            <h2 className="text-xl font-bold mb-6 text-[var(--color-primary)]">Privacy Settings</h2>
            <div className="flex items-center justify-between">
              <div className="pr-4">
                <h3 className="text-lg font-bold text-[var(--color-text)]">Share Milestone Descriptions</h3>
                <p className="text-sm text-[var(--color-text)] opacity-60 mt-1">
                  Allow your Motivators to see the specific details of your milestones. 
                  If disabled, they will only see "Milestone X".
                </p>
              </div>
              <button
                onClick={handleTogglePrivacy}
                className={`${
                  shareMilestones ? 'bg-[var(--color-primary)]' : 'bg-gray-300'
                } relative inline-flex flex-shrink-0 h-8 w-14 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)]`}
              >
                <span className="sr-only">Use setting</span>
                <span
                  aria-hidden="true"
                  className={`${
                    shareMilestones ? 'translate-x-6' : 'translate-x-0'
                  } pointer-events-none inline-block h-7 w-7 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                />
              </button>
            </div>
          </div>

          {/* Manage Goal */}
          <div className="glass-panel p-8 rounded-3xl hover-card">
            <h2 className="text-xl font-bold mb-6 text-[var(--color-primary)]">Manage Goal</h2>
            <div>
              {currentGoalName ? (
                <div className="bg-white/40 rounded-xl p-4 border border-white/50">
                  <p className="mb-4 text-[var(--color-text)]">
                    Your current goal: <span className="font-bold text-[var(--color-primary)] text-lg block mt-1">{currentGoalName}</span>
                  </p>
                  <button
                    onClick={handleDeleteGoal}
                    type="button"
                    className="w-full inline-flex justify-center py-3 px-4 border border-transparent shadow-sm text-sm font-bold rounded-xl text-white bg-red-400 hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400 transition-colors"
                  >
                    Delete Current Goal
                  </button>
                </div>
              ) : (
                <p className="text-[var(--color-text)] opacity-50 italic text-center py-4">You do not have an active goal.</p>
              )}
            </div>
          </div>

          {/* Account */}
          <div className="glass-panel p-8 rounded-3xl hover-card">
            <h2 className="text-xl font-bold mb-6 text-[var(--color-primary)]">Account</h2>
            <div>
              <button
                onClick={logOut}
                type="button"
                className="w-full inline-flex justify-center py-3 px-4 border-2 border-gray-300 shadow-sm text-sm font-bold rounded-xl text-gray-500 bg-transparent hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(SettingsPage);
