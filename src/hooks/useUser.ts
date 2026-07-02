"use client";

import { db } from "@/lib/instant/client";
import type { Profile } from "@/types";

export function useUser() {
  const { isLoading: authLoading, user, error } = db.useAuth();

  const { data, isLoading: profileLoading } = db.useQuery(
    user ? { profiles: { $: { where: { "$user.id": user.id } } } } : null,
  );

  const profile = (data?.profiles?.[0] as Profile | undefined) ?? null;

  return {
    user,
    profile,
    loading: authLoading || (!!user && profileLoading),
    isAdmin: profile?.role === "admin",
    isLoggedIn: !!user && !error,
  };
}
