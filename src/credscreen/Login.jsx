import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Lock, Mail } from "lucide-react";
import { db } from "../lib/supabase";
import { useAuth } from "../context/auth";
import AuthLayout from "./AuthLayout";

function Login() {
  const { user, recovering } = useAuth();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  if (user && recovering) return <Navigate to="/reset-password" replace />;
  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);
    try {
      const { error: loginError } = await db.auth.signInWithPassword({
        email: email.trim(),
        password: pass,
      });
      if (loginError) setError(loginError.message);
    } catch {
      setError("You're offline. Connect to the internet to log in.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgot = async () => {
    setError(null);
    setInfo(null);
    if (!email.trim()) {
      setError("Enter your email first, then tap Forgot password.");
      return;
    }
    const { error: resetError } = await db.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (resetError) setError(resetError.message);
    else setInfo("Check your email for a link to reset your password.");
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to your sermon notes."
      footer={
        <>
          No account yet? <Link to="/signup">Create one</Link>
        </>
      }
    >
      <form className="form" onSubmit={handleSubmit} noValidate>
        <label className="field">
          <span className="field__label">Email</span>
          <span className="input-wrap">
            <Mail size={18} aria-hidden="true" />
            <input
              type="email"
              autoComplete="email"
              placeholder="juan@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </span>
        </label>

        <label className="field">
          <span className="field__label">Password</span>
          <span className="input-wrap">
            <Lock size={18} aria-hidden="true" />
            <input
              type="password"
              autoComplete="current-password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              required
            />
          </span>
        </label>

        <button type="button" className="link-btn" onClick={handleForgot}>
          Forgot password?
        </button>

        {error && <p className="form__error" role="alert">{error}</p>}
        {info && <p className="form__info" role="status">{info}</p>}

        <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
          {submitting ? "Logging in..." : "Log in"}
        </button>
      </form>
    </AuthLayout>
  );
}

export default Login;
