"use client";
import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { auth, firestore } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  userData: DocumentData | null;
  loading: boolean;      // Status of Authentication (Identity)
  dataLoading: boolean;  // Status of Firestore Data (Profile)
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  dataLoading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    // 1. Wait for Firebase to read LocalStorage (Prevents "Flash of Guest")
    auth.authStateReady().finally(() => {
       // We don't set loading false here, we let onAuthStateChanged do it
    });

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // As soon as we know WHO they are (or aren't), we stop the main loading
      setLoading(false); 
    });

    return () => unsubscribeAuth();
  }, []);

  // 2. Fetch Profile Data (Runs separately)
useEffect(() => {
  let unsubscribeFirestore: (() => void) | null = null;

  if (user) {
    setDataLoading(true);
    const userRef = doc(firestore, 'users', user.uid);
    
    unsubscribeFirestore = onSnapshot(userRef, 
      (docSnapshot) => {
        const newData = docSnapshot.exists() ? docSnapshot.data() : null;
        
        // Only update state if data actually changed (prevents unnecessary re-renders)
        setUserData(prevData => {
          if (JSON.stringify(prevData) === JSON.stringify(newData)) {
            return prevData; // Keep same reference
          }
          return newData; // Update with new data
        });
        setDataLoading(false);
      }, 
      (error) => {
        console.error("Firestore Error:", error);
        setDataLoading(false);
      }
    );
  } else {
    setUserData(null);
    setDataLoading(false);
  }

  return () => {
    if (unsubscribeFirestore) unsubscribeFirestore();
  };
}, [user]);

  // 3. Memoize values to prevent re-renders
  const value = useMemo(() => ({
    user,
    userData,
    loading,
    dataLoading
  }), [user, userData, loading, dataLoading]);

  return (
    <AuthContext.Provider value={value}>
      {/* GLOBAL LOADING BLOCKER: Prevents any page from loading until Auth is checked */}
      {loading ? (
         <div className="min-h-screen flex items-center justify-center bg-white">
           <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-blue-500"></div>
         </div>
      ) : (
         children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);