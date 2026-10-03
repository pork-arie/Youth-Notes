import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CalendarDays, Copy, LogOut } from "lucide-react";
import { useAuth } from "../context/auth";
import { useOnline } from "../hooks/useOnline";
import { db } from "../lib/supabase";
import { ACTIVITY_TYPES, formatDate, formatDateTime, friendlyError, isLeader } from "../lib/groups";
import PageHeader from "../components/PageHeader";
import OfflineNotice from "../components/OfflineNotice";
import NoteCard from "../components/NoteCard";

const TABS = [
  { id: "notes", label: "Notes" },
  { id: "activities", label: "Activities" },
  { id: "members", label: "Members" },
];

function GroupDetail() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const online = useOnline();
  const navigate = useNavigate();

  const [tab, setTab] = useState("notes");
  const [group, setGroup] = useState(null);
  const [role, setRole] = useState(null);
  const [notes, setNotes] = useState([]);
  const [activities, setActivities] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const [g, me, n, a, m] = await Promise.all([
      db.from("groups").select("id, name, description, invite_code").eq("id", groupId).maybeSingle(),
      db.from("group_members").select("role").eq("group_id", groupId).eq("user_id", user.id).maybeSingle(),
      db
        .from("notes")
        .select("id, title, speaker, main_verse, body, note_date, user_id, profiles(full_name)")
        .eq("group_id", groupId)
        .eq("is_shared", true)
        .eq("is_deleted", false)
        .order("updated_at", { ascending: false })
        .limit(100),
      db
        .from("activities")
        .select("id, title, type, starts_at, location")
        .eq("group_id", groupId)
        .order("starts_at", { ascending: false }),
      db.from("group_members").select("id, user_id, role, profiles(full_name)").eq("group_id", groupId),
    ]);

    const firstError = [g, me, n, a, m].find((r) => r.error)?.error;
    if (firstError) setError(friendlyError(firstError));

    setGroup(g.data ?? null);
    setRole(me.data?.role ?? null);
    setNotes(n.data ?? []);
    setActivities(a.data ?? []);
    setMembers(
      (m.data ?? []).sort((x, y) => {
        const order = { owner: 0, leader: 1, member: 2 };
        return order[x.role] - order[y.role] || (x.profiles?.full_name ?? "").localeCompare(y.profiles?.full_name ?? "");
      })
    );
    setLoading(false);
  }, [groupId, user.id]);

  useEffect(() => {
    if (online) load();
  }, [online, load]);

  if (!online) {
    return (
      <section className="screen">
        <PageHeader title="Group" back="/groups" />
        <OfflineNotice>Group notes and activities need internet. Your own notes still work offline.</OfflineNotice>
      </section>
    );
  }

  if (loading) return <section className="screen"><p className="muted">Loading group...</p></section>;

  if (!group) {
    return (
      <section className="screen">
        <PageHeader title="Group" back="/groups" />
        <div className="empty">
          <h2>Group not found</h2>
          <p>You may not be a member of this group anymore.</p>
        </div>
      </section>
    );
  }

  const leader = isLeader(role);
  const owner = role === "owner";

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(group.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: the code is visible anyway */
    }
  };

  const changeRole = async (memberId, newRole) => {
    const { error: updateError } = await db.from("group_members").update({ role: newRole }).eq("id", memberId);
    if (updateError) return setError(friendlyError(updateError));
    load();
  };

  const removeMember = async (memberId, memberName) => {
    if (!window.confirm(`Remove ${memberName || "this member"} from the group?`)) return;
    const { error: deleteError } = await db.from("group_members").delete().eq("id", memberId);
    if (deleteError) return setError(friendlyError(deleteError));
    load();
  };

  const leaveGroup = async () => {
    if (!window.confirm(`Leave ${group.name}?`)) return;
    const { error: deleteError } = await db
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", user.id);
    if (deleteError) return setError(friendlyError(deleteError));
    navigate("/groups", { replace: true });
  };

  return (
    <section className="screen">
      <PageHeader title={group.name} subtitle={`${members.length} ${members.length === 1 ? "member" : "members"}`} back="/groups" />
      {group.description && <p className="muted">{group.description}</p>}

      {leader && (
        <div className="invite">
          <div>
            <p className="small muted">Invite code</p>
            <p className="invite__code">{group.invite_code}</p>
          </div>
          <button className="btn btn--small" onClick={copyCode}>
            <Copy size={16} aria-hidden="true" /> {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}

      {error && <p className="form__error" role="alert">{error}</p>}

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={tab === t.id ? "is-active" : ""}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "notes" && (
        <>
          {notes.length === 0 && (
            <div className="empty">
              <h2>No shared notes yet</h2>
              <p>Open one of your notes and turn on "Share with a group" to post it here.</p>
            </div>
          )}
          <ul className="stack">
            {notes.map((n) => (
              <li key={n.id}>
                <details className="expand">
                  <summary>
                    <NoteCard
                      title={n.title}
                      speaker={n.speaker}
                      author={n.user_id === user.id ? "You" : n.profiles?.full_name ?? "Member"}
                      date={formatDate(n.note_date)}
                      verse={n.main_verse}
                    />
                  </summary>
                  <p className="expand__body">{n.body || "No notes written."}</p>
                </details>
              </li>
            ))}
          </ul>
        </>
      )}

      {tab === "activities" && (
        <>
          {leader && <NewActivity groupId={groupId} userId={user.id} onCreated={(id) => navigate(`/activities/${id}`)} />}
          {activities.length === 0 && (
            <p className="muted">{leader ? "Add your first activity above." : "No activities yet."}</p>
          )}
          <ul className="stack">
            {activities.map((a) => (
              <li key={a.id}>
                <Link to={`/activities/${a.id}`} className="card-link">
                  <article className="card activity-row">
                    <span className="activity-row__icon"><CalendarDays size={20} aria-hidden="true" /></span>
                    <div>
                      <h3>{a.title}</h3>
                      <p className="muted small">{formatDateTime(a.starts_at)}{a.location ? `, ${a.location}` : ""}</p>
                    </div>
                    <span className="chip chip--verse">{ACTIVITY_TYPES[a.type] ?? "Activity"}</span>
                  </article>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {tab === "members" && (
        <>
          <ul className="list card">
            {members.map((m) => {
              const memberName = m.profiles?.full_name || "Member";
              const isMe = m.user_id === user.id;
              return (
                <li key={m.id} className="member">
                  <span className="avatar">{memberName.charAt(0).toUpperCase()}</span>
                  <div className="member__text">
                    <p>{memberName}{isMe ? " (you)" : ""}</p>
                    <p className="small muted">{m.role === "owner" ? "Owner" : m.role === "leader" ? "Leader" : "Member"}</p>
                  </div>
                  {owner && !isMe && m.role !== "owner" && (
                    <div className="member__actions">
                      <button className="btn btn--small" onClick={() => changeRole(m.id, m.role === "leader" ? "member" : "leader")}>
                        {m.role === "leader" ? "Make member" : "Make leader"}
                      </button>
                      <button className="btn btn--small btn--ghost-danger" onClick={() => removeMember(m.id, memberName)}>
                        Remove
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {!owner && (
            <button className="btn btn--ghost-danger btn--block" onClick={leaveGroup}>
              <LogOut size={16} aria-hidden="true" /> Leave group
            </button>
          )}
        </>
      )}
    </section>
  );
}

function NewActivity({ groupId, userId, onCreated }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("sunday_service");
  const [startsAt, setStartsAt] = useState("");
  const [location, setLocation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (!open) {
    return (
      <button className="btn btn--primary btn--block" onClick={() => setOpen(true)}>
        Add activity
      </button>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return setError("Give the activity a title.");
    if (!startsAt) return setError("Pick a date and time.");
    setBusy(true);
    const { data, error: insertError } = await db
      .from("activities")
      .insert({
        group_id: groupId,
        title: title.trim(),
        type,
        starts_at: new Date(startsAt).toISOString(),
        location: location.trim() || null,
        created_by: userId,
      })
      .select("id")
      .single();
    setBusy(false);
    if (insertError) return setError(friendlyError(insertError));
    onCreated(data.id);
  };

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <label className="field">
        <span className="field__label">Title</span>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sunday youth service" />
      </label>
      <label className="field">
        <span className="field__label">Type</span>
        <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
          {Object.entries(ACTIVITY_TYPES).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span className="field__label">Starts</span>
        <input className="input" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
      </label>
      <label className="field">
        <span className="field__label">Location (optional)</span>
        <input className="input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Main hall" />
      </label>
      {error && <p className="form__error" role="alert">{error}</p>}
      <div className="row">
        <button type="button" className="btn" onClick={() => setOpen(false)}>Cancel</button>
        <button className="btn btn--primary" disabled={busy}>{busy ? "Saving..." : "Save activity"}</button>
      </div>
    </form>
  );
}

export default GroupDetail;
