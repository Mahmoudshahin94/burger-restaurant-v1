"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types";

// Shared state to handle React Strict Mode and multiple hook instances
let globalUser: User | null = null;
let globalProfile: Profile | null = null;
let globalLoading = true;
let loadStarted = false;
let listeners: Set<() => void> = new Set();

function notifyListeners() {
  listeners.forEach(fn => fn());
}

export function useUser() {
  const supabase = useMemo(() => createClient(), []);
  const [, forceUpdate] = useState({});

  // Subscribe to global state changes
  useEffect(() => {
    const listener = () => forceUpdate({});
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  useEffect(() => {
    // Only start loading once across all instances
    if (loadStarted) return;
    loadStarted = true;

    async function fetchProfile(userId: string): Promise<Profile | null> {
      console.log("[useUser] Fetching profile for userId:", userId);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();
        
        if (error) {
          console.error("[useUser] Profile fetch error:", error.message, error.code);
          return null;
        }
        console.log("[useUser] Profile fetched successfully:", data);
        console.log("[useUser] Role:", data?.role, "isAdmin:", data?.role === "admin");
        return data as Profile;
      } catch (err) {
        console.error("[useUser] Profile fetch exception:", err);
        return null;
      }
    }

    async function loadUser() {
      console.log("[useUser] loadUser starting...");
      
      try {
        const { data: { user: currentUser }, error } = await supabase.auth.getUser();
        
        console.log("[useUser] getUser result:", { 
          hasUser: !!currentUser, 
          email: currentUser?.email,
          error: error?.message 
        });
        
        if (error || !currentUser) {
          console.log("[useUser] No authenticated user");
          globalUser = null;
          globalProfile = null;
          globalLoading = false;
          notifyListeners();
          return;
        }
        
        globalUser = currentUser;
        notifyListeners();
        
        const profileData = await fetchProfile(currentUser.id);
        globalProfile = profileData;
        globalLoading = false;
        notifyListeners();
        
      } catch (err) {
        console.error("[useUser] Auth check failed:", err);
        globalUser = null;
        globalProfile = null;
        globalLoading = false;
        notifyListeners();
      }
    }

    loadUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("[useUser] Auth state changed:", event);
        
        if (event === "SIGNED_OUT") {
          globalUser = null;
          globalProfile = null;
          globalLoading = false;
          loadStarted = false; // Allow reload on next sign in
          notifyListeners();
          return;
        }
        
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          const currentUser = session?.user ?? null;
          globalUser = currentUser;
          notifyListeners();
          
          if (currentUser) {
            const profileData = await fetchProfile(currentUser.id);
            globalProfile = profileData;
          } else {
            globalProfile = null;
          }
          globalLoading = false;
          notifyListeners();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const isAdmin = globalProfile?.role === "admin";

  return { 
    user: globalUser, 
    profile: globalProfile, 
    loading: globalLoading, 
    isAdmin,
    isLoggedIn: !!globalUser 
  };
}

// Reset function for testing/development - call from browser console if needed
if (typeof window !== 'undefined') {
  (window as unknown as { resetUserState: () => void }).resetUserState = () => {
    globalUser = null;
    globalProfile = null;
    globalLoading = true;
    loadStarted = false;
    notifyListeners();
    console.log("[useUser] State reset");
  };
}
