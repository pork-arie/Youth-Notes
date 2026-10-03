import { useState } from "react";
import { LogOut, RefreshCw } from "lucide-react";
import { useAuth } from "../context/auth";
import { useOnline } from "../hooks/useOnline";
import { db } from "../lib/supabase";
import { clearLocalData, countUnsynced, syncNotes } from "../lib/sync";
import { friendlyError } from "../lib/groups";
import PageHeader from "../components/PageHeader";
import SyncBadge from "../components/SyncBadge";

function Profile() {
  const { user } = useAuth();
  const online = useOnline();
  const [name, setName] = useState(user.user_metadata?.full_name ?? "");
  const [savingName, setSavingName] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const initial = (name || user.email || "?").charAt(0).toUpperCase();

  const saveName = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!name.trim()) return setError("Enter your name.");
    setSavingName(true);
    const [{ error: authError }, { error: profileError }] = await Promise.all([
      db.auth.updateUser({ data: { full_name: name.trim() } }),
      db.from("profiles").update({ full_name: name.trim() }).eq("id", user.id),
    ]);
    setSavingName(false);
    if (authError || profileError) return setError(friendlyError(authError || profileError));
    setMessage("Name updated.");
  };

  const syncNow = async () => {
    setSyncing(true);
    await syncNotes(user.id);
    setSyncing(false);
  };

  const logOut = async () => {
    setError(null);
    if (online) await syncNotes(user.id);

    const pending = await countUnsynced(user.id);
    if (pending > 0) {
      const ok = window.confirm(
        `${pending} ${pending === 1 ? "note hasn't" : "notes haven't"} been uploaded yet. ` +
          "If you log out now, they'll be lost. Log out anyway?"
      );
      if (!ok) return;
    }

    await clearLocalData(user.id);
    // scope "local" signs out on this device even without internet
    await db.auth.signOut({ scope: "local" });
  };

  return (
    <section className="screen">
      <PageHeader title="Profile" />

      <div className="profile-card">
        <span className="avatar avatar--lg">{initial}</span>
        <div>
          <p className="profile-card__name">{name || "Your name"}</p>
          <p className="small muted">{user.email}</p>
        </div>
      </div>

      <form className="card form" onSubmit={saveName}>
        <label className="field">
          <span className="field__label">Full name</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        {error && <p className="form__error" role="alert">{error}</p>}
        {message && <p className="form__info" role="status">{message}</p>}
        <button className="btn btn--block" disabled={savingName || !online}>
          {savingName ? "Saving..." : "Save name"}
        </button>
      </form>

      <div className="card sync-card">
        <div>
          <p className="sync-card__title">Notes sync</p>
          <SyncBadge />
        </div>
        <button className="btn btn--small" onClick={syncNow} disabled={!online || syncing}>
          <RefreshCw size={16} aria-hidden="true" className={syncing ? "spin" : ""} /> {syncing ? "Syncing" : "Sync now"}
        </button>
      </div>

      <button className="btn btn--ghost-danger btn--block" onClick={logOut}>
        <LogOut size={16} aria-hidden="true" /> Log out
      </button>
    </section>
  );
}

export default Profile;
