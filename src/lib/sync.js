import { db } from "./supabase";
import { localdb } from "./localdb";

/*
  How sync works
  - PUSH: upload local notes with synced = 0, then mark them synced.
  - PULL: download notes that changed on the server since the last pull.
  - Conflicts: the version with the newer updated_at wins ("last write wins").
  - The server stamps every write with server_updated_at. Pull uses that
    (not updated_at) so notes written offline on another phone are never missed.
*/

let running = false;

const cursorKey = (userId) => `yn:lastPull:${userId}`;

function readCursor(userId) {
  try {
    return localStorage.getItem(cursorKey(userId));
  } catch {
    return null;
  }
}

function writeCursor(userId, value) {
  try {
    localStorage.setItem(cursorKey(userId), value);
  } catch {
    /* storage unavailable: the next pull just downloads more */
  }
}

// Local shape -> Supabase shape (drop local-only fields, 0/1 -> boolean)
function toServer(note) {
  // eslint-disable-next-line no-unused-vars
  const { synced, server_updated_at, ...rest } = note;
  return { ...rest, is_deleted: note.is_deleted === 1 };
}

// Supabase shape -> local shape
function toLocal(row) {
  return { ...row, is_deleted: row.is_deleted ? 1 : 0, synced: 1 };
}

const isNewer = (a, b) => new Date(a).getTime() > new Date(b).getTime();

export async function pushNotes(userId) {
  if (!userId || !navigator.onLine) return;

  const unsynced = await localdb.notes
    .where("synced")
    .equals(0)
    .filter((n) => n.user_id === userId)
    .toArray();

  if (unsynced.length === 0) return;

  // One request for all notes. upsert = insert new ids, update existing ones.
  let uploaded = unsynced;
  const { error } = await db.from("notes").upsert(unsynced.map(toServer));

  if (error) {
    // One bad note (e.g. shared to a group you left) would block the whole batch,
    // so retry one by one and keep the ones that work.
    console.warn("Batch push failed, retrying one by one:", error.message);
    uploaded = [];
    for (const note of unsynced) {
      const { error: oneError } = await db.from("notes").upsert(toServer(note));
      if (oneError) console.error(`Note ${note.id} failed:`, oneError.message);
      else uploaded.push(note);
    }
  }

  // Only mark synced if the note wasn't edited while it was uploading
  await localdb.transaction("rw", localdb.notes, async () => {
    for (const sent of uploaded) {
      const current = await localdb.notes.get(sent.id);
      if (current && current.updated_at === sent.updated_at) {
        await localdb.notes.update(sent.id, { synced: 1 });
      }
    }
  });
}

export async function pullNotes(userId) {
  if (!userId || !navigator.onLine) return;

  let cursor = readCursor(userId);
  const pageSize = 500;

  while (true) {
    let query = db
      .from("notes")
      .select("*")
      .eq("user_id", userId)
      .order("server_updated_at", { ascending: true })
      .limit(pageSize);
    if (cursor) query = query.gt("server_updated_at", cursor);

    const { data, error } = await query;
    if (error) {
      console.error("Pull failed:", error.message);
      return;
    }
    if (!data || data.length === 0) return;

    await localdb.transaction("rw", localdb.notes, async () => {
      for (const row of data) {
        const local = await localdb.notes.get(row.id);
        // Keep the local copy only if it's newer than the server's
        if (!local || !isNewer(local.updated_at, row.updated_at)) {
          await localdb.notes.put(toLocal(row));
        }
      }
    });

    cursor = data[data.length - 1].server_updated_at;
    writeCursor(userId, cursor);
    if (data.length < pageSize) return;
  }
}

// Pull first (so newer edits from other devices win), then push local changes
export async function syncNotes(userId) {
  if (running || !userId || !navigator.onLine) return;
  running = true;
  try {
    await pullNotes(userId);
    await pushNotes(userId);
  } finally {
    running = false;
  }
}

export function countUnsynced(userId) {
  return localdb.notes
    .where("synced")
    .equals(0)
    .filter((n) => n.user_id === userId)
    .count();
}

// Remove this user's data from the device (used on logout)
export async function clearLocalData(userId) {
  await localdb.notes.where("user_id").equals(userId).delete();
  try {
    localStorage.removeItem(cursorKey(userId));
    localStorage.removeItem(`yn:groups:${userId}`);
  } catch {
    /* ignore */
  }
}
