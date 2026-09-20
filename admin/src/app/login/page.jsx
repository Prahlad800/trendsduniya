"use client";
import { useState } from "react";
import {
  ArrowRight,
  Globe2,
  Eye,
  EyeOff,
  LockKeyhole,
  Loader2,
} from "lucide-react";
import { useAuth } from "../../components/auth-provider";
import { Field, Notice } from "../../components/ui";
import { siteUrl } from "../../lib/api";
export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [show, setShow] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login({ email, password });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="login-page">
      <section className="login-art">
        <a href={siteUrl} className="brand">
          <span className="brand-mark">
            <Globe2 />
          </span>
          <span>
            Trends<span className="brand-accent">Duniya</span>
          </span>
        </a>
        <div className="login-orbit">
          <div />
          <div />
          <div />
          <Globe2 size={112} strokeWidth={0.7} />
        </div>
        <div className="login-statement">
          <span className="eyebrow">THE EDITORIAL STUDIO</span>
          <h1>
            Great stories
            <br />
            start <em>here.</em>
          </h1>
          <p>
            A thoughtful space to create, refine, and share what matters with
            the world.
          </p>
        </div>
        <span className="login-art-footer">
          Independent thinking. Meaningful stories.
        </span>
      </section>
      <section className="login-form-wrap">
        <div className="login-form">
          <span className="login-lock">
            <LockKeyhole size={24} />
          </span>
          <p className="eyebrow">WELCOME BACK</p>
          <h2>Make your next move.</h2>
          <p className="muted">Sign in to your TrendsDuniya workspace.</p>
          <Notice>{error}</Notice>
          <form onSubmit={submit}>
            <Field label="Email address">
              <input
                type="email"
                autoComplete="username"
                placeholder="you@trendsduniya.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>
            <Field label="Password">
              <div className="password-field">
                <input
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => setShow(!show)}
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Field>
            <button className="btn primary login-submit" disabled={busy}>
              {busy ? (
                <Loader2 className="spin" size={18} />
              ) : (
                "Sign in to Studio"
              )}
              <ArrowRight size={18} />
            </button>
          </form>
          <p className="login-help">
            Need access? Contact your workspace administrator.
          </p>
          <a href={siteUrl} className="back-site">
            ← Back to TrendsDuniya
          </a>
        </div>
        <span className="login-copyright">
          © {new Date().getFullYear()} TrendsDuniya. All rights reserved.
        </span>
      </section>
    </main>
  );
}
