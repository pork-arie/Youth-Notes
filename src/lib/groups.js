import { db } from "./supabase";

const cacheKey = (userId) => `yn:groups:${userId}`;

// The user's groups, cached so the editor can still offer groups offline
export async function fetchMyGroups(userId) {
  if (navigator.onLine) {
    const { data, error } = await db
      .from("group_members")
      .select("role, groups(id, name, description, invite_code)")
      .eq("user_id", userId);

    if (!error) {
      const groups = (data ?? [])
        .filter((m) => m.groups)
        .map((m) => ({ ...m.groups, role: m.role }))
        .sort((a, b) => a.name.localeCompare(b.name));
      try {
        localStorage.setItem(cacheKey(userId), JSON.stringify(groups));
      } catch {
        /* ignore */
      }
      return { groups, offline: false, error: null };
    }
    return { groups: readCache(userId), offline: false, error: error.message };
  }
  return { groups: readCache(userId), offline: true, error: null };
}

function readCache(userId) {
  try {
    return JSON.parse(localStorage.getItem(cacheKey(userId)) ?? "[]");
  } catch {
    return [];
  }
}

export const ACTIVITY_TYPES = {
  sunday_service: "Sunday service",
  bible_study: "Bible study",
  outreach: "Outreach",
  fellowship: "Fellowship",
  practice: "Practice",
};

export const isLeader = (role) => role === "owner" || role === "leader";

export function formatDateTime(value) {
  return new Date(value).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDate(value) {
  if (!value) return "";
  // note_date is YYYY-MM-DD; noon avoids time zone shifts
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

// Turn Supabase/Postgres errors into something a user understands
export function friendlyError(error) {
  const msg = error?.message ?? String(error ?? "");
  if (/Failed to fetch|NetworkError/i.test(msg)) return "You're offline. Connect to the internet and try again.";
  return msg || "Something went wrong. Try again.";
}
