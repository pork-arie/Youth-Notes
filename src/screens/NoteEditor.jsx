import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useAuth } from "../context/auth";
import { localdb } from "../lib/localdb";
import { pushNotes } from "../lib/sync";
import { fetchMyGroups } from "../lib/groups";

// Save to the phone first, then try to upload (doesn't wait for internet)
async function saveNote(id, data, userId) {
  await localdb.notes.update(id, {
    ...data,
    updated_at: new Date().toISOString(),
    synced: 0,
  });
  pushNotes(userId);
}

function NoteEditor() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = user.id;

  const [form, setForm] = useState(null); // null = not loaded yet
  const [notFound, setNotFound] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState("");
  const [groups, setGroups] = useState([]);

  const latestForm = useRef(null);
  const pending = useRef(false);

  // 1. Load the note once
  useEffect(() => {
    let cancelled = false;
    localdb.notes.get(id).then((note) => {
      if (cancelled) return;
      if (!note || note.is_deleted || note.user_id !== userId) {
        setNotFound(true);
        return;
      }
      setForm({
        note_date: note.note_date ?? "",
        speaker: note.speaker ?? "",
        title: note.title ?? "",
        main_verse: note.main_verse ?? "",
        body: note.body ?? "",
        is_shared: Boolean(note.is_shared),
        group_id: note.group_id ?? null,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [id, userId]);

  // Groups for the share picker (cached, so this works offline too)
  useEffect(() => {
    fetchMyGroups(userId).then(({ groups }) => setGroups(groups));
  }, [userId]);

  // 2. Debounced autosave
  useEffect(() => {
    if (!form || !dirty) return;
    latestForm.current = form;
    const timer = setTimeout(async () => {
      await saveNote(id, form, userId);
      pending.current = false;
      setStatus("Saved");
    }, 500);
    return () => clearTimeout(timer);
  }, [form, dirty, id, userId]);

  // 3. Save right away if the user leaves before the timer finishes
  useEffect(() => {
    return () => {
      if (pending.current && latestForm.current) {
        saveNote(id, latestForm.current, userId);
      }
    };
  }, [id, userId]);

  const update = (changes) => {
    setForm((prev) => ({ ...prev, ...changes }));
    setDirty(true);
    pending.current = true;
    setStatus("Saving...");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    update({ [name]: value });
  };

  const handleShareToggle = (e) => {
    const on = e.target.checked;
    update({
      is_shared: on,
      group_id: on ? form.group_id ?? groups[0]?.id ?? null : form.group_id,
    });
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this note? This can't be undone.")) return;
    pending.current = false;
    await localdb.notes.update(id, {
      is_deleted: 1,
      updated_at: new Date().toISOString(),
      synced: 0,
    });
    pushNotes(userId);
    navigate("/notes", { replace: true });
  };

  if (notFound) {
    return (
      <section className="screen">
        <div className="empty">
          <h2>Note not found</h2>
          <p>It may have been deleted.</p>
          <Link to="/notes" className="btn">Back to notes</Link>
        </div>
      </section>
    );
  }

  if (!form) return <section className="screen"><p className="muted">Loading...</p></section>;

  return (
    <section className="screen editor">
      <header className="editor__bar">
        <Link to="/notes" className="icon-btn" aria-label="Back to notes">
          <ArrowLeft size={20} aria-hidden="true" />
        </Link>
        <span className="editor__status" aria-live="polite">{status}</span>
        <button className="icon-btn icon-btn--danger" onClick={handleDelete} aria-label="Delete note">
          <Trash2 size={18} aria-hidden="true" />
        </button>
      </header>

      <input
        className="editor__title"
        name="title"
        value={form.title}
        onChange={handleChange}
        placeholder="Sermon title"
        aria-label="Sermon title"
      />

      <div className="editor__meta">
        <label className="field">
          <span className="field__label">Speaker</span>
          <input className="input" name="speaker" value={form.speaker} onChange={handleChange} placeholder="Ps. David" />
        </label>
        <label className="field">
          <span className="field__label">Date</span>
          <input className="input" type="date" name="note_date" value={form.note_date} onChange={handleChange} />
        </label>
      </div>

      <label className="field">
        <span className="field__label">Main verse</span>
        <input className="input" name="main_verse" value={form.main_verse} onChange={handleChange} placeholder="John 3:16" />
      </label>

      <label className="field">
        <span className="field__label">Notes</span>
        <textarea
          className="input editor__body"
          name="body"
          value={form.body}
          onChange={handleChange}
          placeholder="What stood out to you today?"
          rows={12}
        />
      </label>

      <div className="card share">
        <label className="switch">
          <input
            type="checkbox"
            checked={form.is_shared}
            onChange={handleShareToggle}
            disabled={groups.length === 0}
          />
          <span className="switch__track" aria-hidden="true" />
          <span>Share with a group</span>
        </label>

        {groups.length === 0 && (
          <p className="muted small">Join a group to share your notes.</p>
        )}

        {form.is_shared && groups.length > 0 && (
          <select
            className="input"
            value={form.group_id ?? ""}
            onChange={(e) => update({ group_id: e.target.value || null })}
            aria-label="Group to share with"
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        )}
      </div>
    </section>
  );
}

export default NoteEditor;
