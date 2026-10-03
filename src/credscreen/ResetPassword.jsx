import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { db } from "../lib/supabase";
import { useAuth } from "../context/auth";
import AuthLayout from "./AuthLayout";
import Splash from "../components/Splash";

function ResetPassword() {
  const { user, loading, setRecovering } = useAuth();
  const navigate = useNavigate();
  const [pass, setPass] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (loading) return <Splash />;

  if (!user) {
    return (
      <AuthLayout
        title="Reset password"
        subtitle="Open the reset link from your email on this device."
        footer={<Link to="/login">Back to log in</Link>}
      />
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (pass.length < 6) return setError("Use a password with at least 6 characters.");
    setSubmitting(true);
    const { error: updateError } = await db.auth.updateUser({ password: pass });
    setSubmitting(false);
    if (updateError) return setError(updateError.message);
    setRecovering(false);
    navigate("/", { replace: true });
  };

  return (
    <AuthLayout title="Set a new password" subtitle={user.email}>
      <form className="form" onSubmit={handleSubmit} noValidate>
        <label className="field">
          <span className="field__label">New password</span>
          <span className="input-wrap">
            <Lock size={18} aria-hidden="true" />
            <input
              type="password"
              autoComplete="new-password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
            />
          </span>
        </label>
        {error && <p className="form__error" role="alert">{error}</p>}
        <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
          {submitting ? "Saving..." : "Save password"}
        </button>
      </form>
    </AuthLayout>
  );
}

export default ResetPassword;
