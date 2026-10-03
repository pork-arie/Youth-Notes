import { useEffect } from "react";
import { useAuth } from "../context/auth";
import { syncNotes } from "../lib/sync";

// Sync when the app opens, when internet returns, and when the app comes back to the screen
export function useSync() {
  const { user } = useAuth();
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;

    const run = () => syncNotes(userId);
    const onVisible = () => {
      if (document.visibilityState === "visible") run();
    };

    run();
    window.addEventListener("online", run);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("online", run);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [userId]);
}
