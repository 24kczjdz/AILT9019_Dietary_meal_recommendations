import { EMPTY_PROFILE } from "@/lib/profile";
import type { Profile, ShoppingLine } from "@/lib/types";

const PROFILE_KEY = "mise.profile";
const FAVORITES_KEY = "mise.favorites";
const KITCHEN_KEY = "mise.kitchen";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function loadProfile(): Profile {
  const stored = read<Partial<Profile>>(PROFILE_KEY, {});
  return {
    ...EMPTY_PROFILE,
    ...stored,
    allergies: Array.isArray(stored.allergies) ? stored.allergies : [],
    diets: Array.isArray(stored.diets) ? stored.diets : [],
  };
}

export function saveProfile(profile: Profile) {
  write(PROFILE_KEY, profile);
}

export function loadFavorites(): string[] {
  const stored = read<string[]>(FAVORITES_KEY, []);
  return Array.isArray(stored) ? stored : [];
}

export function saveFavorites(ids: string[]) {
  write(FAVORITES_KEY, ids);
}

export function loadKitchen(): ShoppingLine[] {
  const stored = read<ShoppingLine[]>(KITCHEN_KEY, []);
  return Array.isArray(stored) ? stored : [];
}

export function saveKitchen(lines: ShoppingLine[]) {
  write(KITCHEN_KEY, lines);
}
