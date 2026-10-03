import { useLiveQuery } from "dexie-react-hooks";
import { CloudOff, CloudUpload, Check } from "lucide-react";
import { useAuth } from "../context/auth";
import { useOnline } from "../hooks/useOnline";
import { countUnsynced } from "../lib/sync";

function SyncBadge() {
  const { user } = useAuth();
  const online = useOnline();
  const pending = useLiveQuery(() => (user ? countUnsynced(user.id) : 0), [user?.id]);

  if (pending === undefined) return null;

  if (!online) {
    return (
      <span className="chip chip--muted">
        <CloudOff size={14} aria-hidden="true" />
        Offline{pending > 0 ? `, ${pending} waiting to sync` : ""}
      </span>
    );
  }

  if (pending > 0) {
    return (
      <span className="chip chip--warn">
        <CloudUpload size={14} aria-hidden="true" />
        {pending} {pending === 1 ? "note" : "notes"} waiting to sync
      </span>
    );
  }

  return (
    <span className="chip chip--ok">
      <Check size={14} aria-hidden="true" />
      All synced
    </span>
  );
}

export default SyncBadge;
