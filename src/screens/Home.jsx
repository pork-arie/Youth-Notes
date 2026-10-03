import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { CalendarDays, NotebookPen, ScanLine } from "lucide-react";
import { useAuth } from "../context/auth";
import { useOnline } from "../hooks/useOnline";
import { db } from "../lib/supabase";
import { localdb, newNote } from "../lib/localdb";
import { ACTIVITY_TYPES, formatDate, formatDateTime } from "../lib/groups";
import SyncBadge from "../components/SyncBadge";
import NoteCard from "../components/NoteCard";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function Home() {
  const { user } = useAuth();
  const online = useOnline();
  const navigate = useNavigate();
  const firstName = (user.user_metadata?.full_name ?? "").split(" ")[0];
  const [activities, setActivities] = useState(null);

  const recent = useLiveQuery(
    () =>
      localdb.notes
        .where("[user_id+is_deleted]")
        .equals([user.id, 0])
        .reverse()
        .sortBy("updated_at")
        .then((list) => list.slice(0, 2)),
    [user.id]
  );

  // Upcoming activities from all my groups (RLS only returns my groups' activities)
  useEffect(() => {
    if (!online) return;
    const since = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    db.from("activities")
      .select("id, title, type, starts_at, location, groups(name)")
      .gte("starts_at", since)
      .order("starts_at", { ascending: true })
      .limit(3)
      .then(({ data }) => setActivities(data ?? []));
  }, [online]);

  const createNote = async () => {
    const note = newNote(user.id);
    await localdb.notes.add(note);
    navigate(`/notes/${note.id}`);
  };

  return (
    <section className="screen">
      <header className="home-hero">
        <p className="home-hero__sub">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
        <h1>{greeting()}{firstName ? `, ${firstName}` : ""}</h1>
        <SyncBadge />
      </header>

      <div className="quick-actions">
        <button className="quick" onClick={createNote}>
          <NotebookPen size={22} aria-hidden="true" />
          <span>New note</span>
        </button>
        <Link to="/scan" className="quick quick--dark">
          <ScanLine size={22} aria-hidden="true" />
          <span>Check in</span>
        </Link>
      </div>

      <h2 className="section-title">Coming up</h2>
      {!online && <p className="muted">Connect to the internet to see activities.</p>}
      {online && activities === null && <p className="muted">Loading...</p>}
      {online && activities?.length === 0 && (
        <p className="muted">No activities scheduled. Your leaders will add them in your group.</p>
      )}
      <ul className="stack">
        {activities?.map((a) => (
          <li key={a.id}>
            <Link to={`/activities/${a.id}`} className="card-link">
              <article className="card activity-row">
                <span className="activity-row__icon"><CalendarDays size={20} aria-hidden="true" /></span>
                <div>
                  <h3>{a.title}</h3>
                  <p className="muted small">{formatDateTime(a.starts_at)}{a.groups?.name ? `, ${a.groups.name}` : ""}</p>
                </div>
                <span className="chip chip--verse">{ACTIVITY_TYPES[a.type] ?? "Activity"}</span>
              </article>
            </Link>
          </li>
        ))}
      </ul>

      <div className="section-head">
        <h2 className="section-title">Recent notes</h2>
        <Link to="/notes" className="link-btn">See all</Link>
      </div>
      {recent?.length === 0 && <p className="muted">Your notes will show up here.</p>}
      <ul className="stack">
        {recent?.map((n) => (
          <li key={n.id}>
            <Link to={`/notes/${n.id}`} className="card-link">
              <NoteCard title={n.title} speaker={n.speaker} date={formatDate(n.note_date)} verse={n.main_verse} shared={n.is_shared && n.group_id} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default Home;
