function NoteCard({ title, speaker, date, verse, shared, preview, author }) {
  return (
    <article className="card note-card">
      <div className="note-card__meta">
        <span>{author ?? speaker ?? ""}</span>
        <span>{date}</span>
      </div>
      <h3 className="note-card__title">{title || "Untitled"}</h3>
      {author && speaker && <p className="note-card__speaker">{speaker}</p>}
      {preview && <p className="note-card__preview">{preview}</p>}
      {(verse || shared) && (
        <div className="chips">
          {verse && <span className="chip chip--verse">{verse}</span>}
          {shared && <span className="chip chip--shared">Shared</span>}
        </div>
      )}
    </article>
  );
}

export default NoteCard;
