import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2, MapPin, ScanLine, Trash2 } from "lucide-react";
import { useAuth } from "../context/auth";
import { useOnline } from "../hooks/useOnline";
import { db } from "../lib/supabase";
import { ACTIVITY_TYPES, formatDateTime, friendlyError, isLeader } from "../lib/groups";
import PageHeader from "../components/PageHeader";
import OfflineNotice from "../components/OfflineNotice";

function ActivityDetail() {
  const { activityId } = useParams();
  const { user } = useAuth();
  const online = useOnline();
  const navigate = useNavigate();

  const [activity, setActivity] = useState(null);
  const [role, setRole] = useState(null);
  const [code, setCode] = useState(null);
  const [members, setMembers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQr, setShowQr] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    const { data: a, error: aError } = await db
      .from("activities")
      .select("id, group_id, title, type, starts_at, ends_at, location, description, groups(name)")
      .eq("id", activityId)
      .maybeSingle();

    if (aError) setError(friendlyError(aError));
    setActivity(a ?? null);
    if (!a) return setLoading(false);

    const { data: me } = await db
      .from("group_members")
      .select("role")
      .eq("group_id", a.group_id)
      .eq("user_id", user.id)
      .maybeSingle();
    const myRole = me?.role ?? null;
    setRole(myRole);

    // RLS returns everyone's attendance to leaders, and only your own to members
    const { data: att } = await db
      .from("attendance")
      .select("id, user_id, method, checked_in_at")
      .eq("activity_id", activityId);
    setAttendance(att ?? []);

    if (isLeader(myRole)) {
      const [{ data: c }, { data: m }] = await Promise.all([
        db.from("activity_checkin_codes").select("code").eq("activity_id", activityId).maybeSingle(),
        db.from("group_members").select("user_id, profiles(full_name)").eq("group_id", a.group_id),
      ]);
      setCode(c?.code ?? null);
      setMembers(
        (m ?? []).sort((x, y) => (x.profiles?.full_name ?? "").localeCompare(y.profiles?.full_name ?? ""))
      );
    }
    setLoading(false);
  }, [activityId, user.id]);

  useEffect(() => {
    if (online) load();
  }, [online, load]);

  if (!online) {
    return (
      <section className="screen">
        <PageHeader title="Activity" back="/" />
        <OfflineNotice />
      </section>
    );
  }

  if (loading) return <section className="screen"><p className="muted">Loading activity...</p></section>;

  if (!activity) {
    return (
      <section className="screen">
        <PageHeader title="Activity" back="/" />
        <div className="empty"><h2>Activity not found</h2><p>It may have been removed.</p></div>
      </section>
    );
  }

  const leader = isLeader(role);
  const present = new Map(attendance.map((r) => [r.user_id, r]));
  const myRecord = present.get(user.id);

  const toggle = async (memberId) => {
    setError(null);
    const record = present.get(memberId);
    const result = record
      ? await db.from("attendance").delete().eq("id", record.id)
      : await db.from("attendance").insert({
          id: crypto.randomUUID(),
          activity_id: activityId,
          user_id: memberId,
          method: "manual",
          checked_in_at: new Date().toISOString(),
        });
    if (result.error) return setError(friendlyError(result.error));
    load();
  };

  const deleteActivity = async () => {
    if (!window.confirm("Delete this activity and its attendance?")) return;
    const { error: deleteError } = await db.from("activities").delete().eq("id", activityId);
    if (deleteError) return setError(friendlyError(deleteError));
    navigate(`/groups/${activity.group_id}`, { replace: true });
  };

  return (
    <section className="screen">
      <PageHeader
        title={activity.title}
        subtitle={activity.groups?.name}
        back={`/groups/${activity.group_id}`}
        action={
          leader && (
            <button className="icon-btn icon-btn--danger" onClick={deleteActivity} aria-label="Delete activity">
              <Trash2 size={18} aria-hidden="true" />
            </button>
          )
        }
      />

      <div className="card activity-info">
        <span className="chip chip--verse">{ACTIVITY_TYPES[activity.type] ?? "Activity"}</span>
        <p className="activity-info__when">{formatDateTime(activity.starts_at)}</p>
        {activity.location && (
          <p className="muted small"><MapPin size={14} aria-hidden="true" /> {activity.location}</p>
        )}
      </div>

      {error && <p className="form__error" role="alert">{error}</p>}

      {!leader && (
        myRecord ? (
          <div className="checked-in">
            <CheckCircle2 size={28} aria-hidden="true" />
            <div>
              <p className="checked-in__title">You're checked in</p>
              <p className="small">{new Date(myRecord.checked_in_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p>
            </div>
          </div>
        ) : (
          <Link to="/scan" className="btn btn--primary btn--block">
            <ScanLine size={18} aria-hidden="true" /> Scan QR to check in
          </Link>
        )
      )}

      {leader && (
        <>
          <button className="btn btn--dark btn--block" onClick={() => setShowQr((v) => !v)}>
            <ScanLine size={18} aria-hidden="true" /> {showQr ? "Hide check-in QR" : "Show check-in QR"}
          </button>

          {showQr && code && (
            <div className="qr-card">
              <QRCodeSVG value={`yn:${activity.id}:${code}`} size={232} level="M" marginSize={2} />
              <p className="small muted">Members scan this from Home, then Check in. It works from 2 hours before the start until 6 hours after.</p>
            </div>
          )}

          <div className="section-head">
            <h2 className="section-title">Attendance</h2>
            <span className="chip chip--ok">{attendance.length} of {members.length} present</span>
          </div>

          <ul className="list card">
            {members.map((m) => {
              const memberName = m.profiles?.full_name || "Member";
              const record = present.get(m.user_id);
              return (
                <li key={m.user_id} className="member">
                  <span className="avatar">{memberName.charAt(0).toUpperCase()}</span>
                  <div className="member__text">
                    <p>{memberName}</p>
                    <p className="small muted">
                      {record ? `${record.method === "qr" ? "Scanned" : "Marked by leader"}, ${new Date(record.checked_in_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : "Not checked in"}
                    </p>
                  </div>
                  <label className="check">
                    <input type="checkbox" checked={Boolean(record)} onChange={() => toggle(m.user_id)} />
                    <span className="sr-only">Present</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}

export default ActivityDetail;
