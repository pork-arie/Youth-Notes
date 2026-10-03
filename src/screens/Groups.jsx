import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, Plus, Users } from "lucide-react";
import { useAuth } from "../context/auth";
import { useOnline } from "../hooks/useOnline";
import { db } from "../lib/supabase";
import { fetchMyGroups, friendlyError } from "../lib/groups";
import PageHeader from "../components/PageHeader";
import OfflineNotice from "../components/OfflineNotice";

const ROLE_LABEL = { owner: "Owner", leader: "Leader", member: "Member" };

function Groups() {
  const { user } = useAuth();
  const online = useOnline();
  const navigate = useNavigate();

  const [groups, setGroups] = useState(null);
  const [mode, setMode] = useState(null); // "join" | "create" | null
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMyGroups(user.id).then(({ groups }) => setGroups(groups));
  }, [user.id, online]);

  const openMode = (next) => {
    setMode(mode === next ? null : next);
    setError(null);
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setError(null);
    if (!code.trim()) return setError("Enter the invite code from your leader.");
    setBusy(true);
    const { data, error: rpcError } = await db.rpc("join_group", { p_code: code.trim() });
    setBusy(false);
    if (rpcError) return setError(friendlyError(rpcError));
    navigate(`/groups/${data}`);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Give your group a name.");
    setBusy(true);
    const { data, error: rpcError } = await db.rpc("create_group", {
      p_name: name.trim(),
      p_description: description.trim() || null,
    });
    setBusy(false);
    if (rpcError) return setError(friendlyError(rpcError));
    navigate(`/groups/${data}`);
  };

  return (
    <section className="screen">
      <PageHeader title="Groups" subtitle="Your youth groups" />

      {!online && <OfflineNotice>You're offline. Showing your saved groups.</OfflineNotice>}

      <div className="segmented">
        <button className={mode === "join" ? "is-active" : ""} onClick={() => openMode("join")} disabled={!online}>
          Join with code
        </button>
        <button className={mode === "create" ? "is-active" : ""} onClick={() => openMode("create")} disabled={!online}>
          <Plus size={16} aria-hidden="true" /> Create group
        </button>
      </div>

      {mode === "join" && (
        <form className="card form" onSubmit={handleJoin}>
          <label className="field">
            <span className="field__label">Invite code</span>
            <input
              className="input input--code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="A1B2C3"
              maxLength={12}
              autoCapitalize="characters"
            />
          </label>
          {error && <p className="form__error" role="alert">{error}</p>}
          <button className="btn btn--primary btn--block" disabled={busy}>{busy ? "Joining..." : "Join group"}</button>
        </form>
      )}

      {mode === "create" && (
        <form className="card form" onSubmit={handleCreate}>
          <label className="field">
            <span className="field__label">Group name</span>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Youth Choir" />
          </label>
          <label className="field">
            <span className="field__label">Description (optional)</span>
            <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Sunday practice and worship team" />
          </label>
          {error && <p className="form__error" role="alert">{error}</p>}
          <button className="btn btn--primary btn--block" disabled={busy}>{busy ? "Creating..." : "Create group"}</button>
        </form>
      )}

      {groups === null && <p className="muted">Loading groups...</p>}

      {groups?.length === 0 && !mode && (
        <div className="empty">
          <h2>Join your youth group</h2>
          <p>Ask your leader for the invite code, or create a group if you're a leader.</p>
        </div>
      )}

      <ul className="stack">
        {groups?.map((g) => (
          <li key={g.id}>
            <Link to={`/groups/${g.id}`} className="card-link">
              <article className="card group-row">
                <span className="group-row__avatar"><Users size={20} aria-hidden="true" /></span>
                <div className="group-row__text">
                  <h3>{g.name}</h3>
                  {g.description && <p className="muted small">{g.description}</p>}
                </div>
                <span className={`chip ${g.role === "member" ? "chip--muted" : "chip--verse"}`}>{ROLE_LABEL[g.role]}</span>
                <ChevronRight size={18} className="muted" aria-hidden="true" />
              </article>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default Groups;
