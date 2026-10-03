import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { CheckCircle2 } from "lucide-react";
import { useOnline } from "../hooks/useOnline";
import { db } from "../lib/supabase";
import { friendlyError } from "../lib/groups";
import PageHeader from "../components/PageHeader";
import OfflineNotice from "../components/OfflineNotice";

// QR format made by ActivityDetail: yn:<activity id>:<check-in code>
const QR_PATTERN = /^yn:([0-9a-f-]{36}):([0-9a-z]+)$/i;

function Scan() {
  const online = useOnline();
  const [result, setResult] = useState(null); // { ok, message, activityId }
  const [cameraError, setCameraError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const handled = useRef(false);

  useEffect(() => {
    if (!online || result) return;
    handled.current = false;

    let scanner = null;
    let started = null;

    // Small delay so React StrictMode's quick mount/unmount doesn't start the camera twice
    const timer = setTimeout(() => {
      scanner = new Html5Qrcode("qr-reader");
      started = scanner
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 230, height: 230 } },
          async (text) => {
            if (handled.current) return;
            handled.current = true;

            const match = text.match(QR_PATTERN);
            if (!match) {
              setResult({ ok: false, message: "This isn't a Youth Notes check-in code." });
              return;
            }
            const [, activityId, code] = match;
            const { error } = await db.rpc("check_in", { p_activity_id: activityId, p_code: code });
            setResult(
              error
                ? { ok: false, message: friendlyError(error), activityId }
                : { ok: true, message: "You're checked in.", activityId }
            );
          },
          () => {} // ignore "no QR found" on each frame
        )
        .catch(() => setCameraError("Allow camera access in your browser settings, then try again."));
    }, 150);

    return () => {
      clearTimeout(timer);
      if (scanner && started) {
        started
          .then(() => scanner.stop())
          .then(() => scanner.clear())
          .catch(() => {});
      }
    };
  }, [online, result, attempt]);

  const tryAgain = () => {
    setResult(null);
    setCameraError(null);
    setAttempt((n) => n + 1);
  };

  return (
    <section className="screen">
      <PageHeader title="Check in" subtitle="Scan the QR your leader shows" back="/" />

      {!online && <OfflineNotice>Checking in needs internet. Connect, then scan again.</OfflineNotice>}

      {online && !result && (
        <>
          <div id="qr-reader" className="scanner" />
          {cameraError && (
            <>
              <p className="form__error" role="alert">{cameraError}</p>
              <button className="btn btn--block" onClick={tryAgain}>Try again</button>
            </>
          )}
        </>
      )}

      {result && (
        <div className={`scan-result ${result.ok ? "scan-result--ok" : "scan-result--error"}`} role="status">
          {result.ok && <CheckCircle2 size={40} aria-hidden="true" />}
          <p className="scan-result__msg">{result.message}</p>
          <div className="row">
            {!result.ok && <button className="btn" onClick={tryAgain}>Scan again</button>}
            {result.activityId && (
              <Link to={`/activities/${result.activityId}`} className="btn btn--primary">View activity</Link>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default Scan;
