"use client";
import { useAuth } from "../context/AuthContext";
"use client";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function withAuth(Component: any) {
  return function ProtectedRoute(props: any) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      // Only redirect if Auth check is DONE (loading=false) and NO USER found.
      if (!loading && !user) {
        router.replace("/"); // Use replace to stop Back-button loops
      }
    }, [user, loading]);

    // If still checking Auth, return nothing (The AuthProvider spinner handles visuals)
    if (loading) return null;

    // If check done but no user, return null (useEffect will redirect)
    if (!user) return null;

    // User is logged in! Render the page.
    return <Component {...props} />;
  };
}