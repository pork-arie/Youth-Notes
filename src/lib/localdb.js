import Dexie from "dexie";

// Database inside the phone/browser (works offline)
export const localdb = new Dexie("youthNotes");

// First value = primary key, the rest are indexes (searchable fields).
// is_deleted and synced are 0/1 because IndexedDB can't index booleans.
localdb.version(1).stores({
  notes: "id, user_id, updated_at, synced, is_deleted, [user_id+is_deleted]",
});

export function today() {
  // Local date as YYYY-MM-DD (toISOString would use UTC)
  return new Date().toLocaleDateString("en-CA");
}

export function newNote(userId) {
  return {
    id: crypto.randomUUID(),
    user_id: userId,
    group_id: null,
    activity_id: null,
    note_date: today(),
    speaker: "",
    title: "",
    main_verse: "",
    body: "",
    is_shared: false,
    is_deleted: 0,
    updated_at: new Date().toISOString(),
    synced: 0,
  };
}
