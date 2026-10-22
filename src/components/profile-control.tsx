"use client";

import { useEffect, useRef, useState } from "react";
import { ProfileSheet } from "@/components/profile-sheet";
import { EMPTY_PROFILE } from "@/lib/profile";
import { loadProfile, saveProfile } from "@/lib/storage";
import type { Profile } from "@/lib/types";

export function ProfileControl({ onChange }: { onChange?: (profile: Profile) => void }) {
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const stored = loadProfile();
    setProfile(stored);
    onChangeRef.current?.(stored);
  }, []);

  function update(next: Profile) {
    setProfile(next);
    saveProfile(next);
    onChangeRef.current?.(next);
  }

  return <ProfileSheet profile={profile} onChange={update} />;
}
