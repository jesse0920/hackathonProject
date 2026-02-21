"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./login.module.css";

type Mode = "login" | "register";

export default function LoginForm({
  initial = "login",
  onSuccess,
}: {
  initial?: Mode;
  onSuccess?: (data: any) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>(initial);
  const [identifier, setIdentifier] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(searchParams.get("error"));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const submittedMode = (formData.get("authMode") as Mode) || mode;
    setMode(submittedMode);

    if (submittedMode === "login" && (!identifier.trim() || !password)) {
      setMessage("Please fill username or email, and password.");
      return;
    }

    if (submittedMode === "register" && (!email || !password)) {
      setMessage("Please fill email and password.");
      return;
    }

    if (submittedMode === "register" && !username.trim()) {
      setMessage("Please enter a username.");
      return;
    }

    if (submittedMode === "register" && password !== confirm) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: submittedMode,
          identifier: submittedMode === "login" ? identifier.trim() : undefined,
          email: submittedMode === "register" ? email : undefined,
          password,
          username: submittedMode === "register" ? username.trim() : undefined,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; message?: string; error?: string; redirectTo?: string }
        | null;

      if (!response.ok || !payload?.ok) {
        setMessage(payload?.error || "Authentication failed.");
        return;
      }

      setMessage(payload.message || "Success.");
      onSuccess?.(payload);
      router.push(payload.redirectTo || "/profile");
      router.refresh();
    } catch {
      setMessage("An error occurred. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.brand}>Potzi</div>
      <div className={styles.sub}>Choose a mode, then continue.</div>

      <form onSubmit={handleSubmit}>
        {mode === "login" ? (
          <div className={styles.field}>
            <label className={styles.label}>Username or Email</label>
            <input
              className={styles.input}
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              placeholder="your username or your.email@example.com"
            />
          </div>
        ) : (
          <>
            <div className={styles.field}>
              <label className={styles.label}>Username</label>
              <input
                className={styles.input}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your display name"
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <input
                className={styles.input}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your.email@example.com"
              />
            </div>
          </>
        )}

        <div className={styles.field}>
          <label className={styles.label}>Password</label>
          <input
            className={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Password..."
          />
        </div>

        {mode === "register" && (
          <div className={styles.field}>
            <label className={styles.label}>Confirm password</label>
            <input
              className={styles.input}
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              placeholder="Confirm password..."
            />
          </div>
        )}

        <div className={styles.actions}>
          <button
            className={`${styles.btn} ${mode === "login" ? styles.activeCta : styles.secondaryCta}`}
            type="submit"
            name="authMode"
            value="login"
            onClick={() => setMode("login")}
            disabled={loading}
          >
            {loading && mode === "login" ? "Please wait..." : "Sign in"}
          </button>
          <button
            className={`${styles.btn} ${mode === "register" ? styles.activeCta : styles.secondaryCta}`}
            type="submit"
            name="authMode"
            value="register"
            onClick={() => setMode("register")}
            disabled={loading}
          >
            {loading && mode === "register" ? "Please wait..." : "Register"}
          </button>
        </div>

        {message && <div className={styles.note}>{message}</div>}
      </form>
    </div>
  );
}
