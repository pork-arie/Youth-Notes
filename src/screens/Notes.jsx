import { Link, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus } from "lucide-react";
import { useAuth } from "../context/auth";
import { localdb, newNote } from "../lib/localdb";
import { formatDate } from "../lib/groups";
import PageHeader from "../components/PageHeader";
import SyncBadge from "../components/SyncBadge";
import NoteCard from "../components/NoteCard";

function Notes() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const notes = useLiveQuery(
    () =>
      user
        ? localdb.notes
            .where("[user_id+is_deleted]")
            .equals([user.id, 0])
            .reverse()
            .sortBy("updated_at")
        : [],
    [user?.id]
  );

  const createNote = async () => {
    const note = newNote(user.id);
    await localdb.notes.add(note);
    navigate(`/notes/${note.id}`);
  };

  return (
    <section className="screen">
      <PageHeader
        title="My notes"
        subtitle={notes ? `${notes.length} ${notes.length === 1 ? "note" : "notes"}` : " "}
        action={
          <button className="icon-btn icon-btn--primary" onClick={createNote} aria-label="New note">
            <Plus size={22} aria-hidden="true" />
          </button>
        }
      />

      <SyncBadge />

      {notes === undefined && <p className="muted">Loading notes...</p>}

      {notes?.length === 0 && (
        <div className="empty">
          <h2>Start your first note</h2>
          <p>Write down the sermon title, verse, and what stood out to you. It saves on your phone, even without internet.</p>
          <button className="btn btn--primary" onClick={createNote}>
            New note
          </button>
        </div>
      )}

      <ul className="stack">
        {notes?.map((n) => (
          <li key={n.id}>
            <Link to={`/notes/${n.id}`} className="card-link">
              <NoteCard
                title={n.title}
                speaker={n.speaker}
                date={formatDate(n.note_date)}
                verse={n.main_verse}
                shared={n.is_shared && n.group_id}
                preview={n.body}
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default Notes;
