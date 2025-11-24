"use client";
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, ComponentType } from 'react';
import { auth } from '../lib/firebase';

const withAuth = <P extends object>(Component: ComponentType<P>) => {
  return function WithAuth(props: P) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user) {
        // Double check with auth.currentUser to avoid race conditions
        // Sometimes context might be slightly behind or in a weird state
        if (!auth.currentUser) {
          router.push('/');
        }
      }
    }, [user, loading, router]);

    if (loading || !user) {
      return <div>Loading...</div>;
    }

    return <Component {...props} />;
  };
};

export default withAuth;
