"use client";

import { useEffect, useId, useRef, useState } from "react";

interface SubmitModalProps {
  open: boolean;
  onClose: () => void;
}

type Org = "massif" | "envision";
type SubmitState = "idle" | "submitting" | "success" | "error";

const RECIPIENT_EMAIL = "mia@envisioninc.example";
const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";

export default function SubmitModal({ open, onClose }: SubmitModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const titleId = useId();

  const [org, setOrg] = useState<Org>("massif");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [est, setEst] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [error, setError] = useState<string | null>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setState("idle");
      setError(null);
      const t = window.setTimeout(() => firstFieldRef.current?.focus(), 30);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const valid = name.trim() && email.trim() && subject.trim() && message.trim();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || state === "submitting") return;
    setState("submitting");
    setError(null);

    const web3Key = process.env.NEXT_PUBLIC_WEB3FORMS_KEY;
    const subjectLine = est ? `[EST ${est}] ${subject}` : subject;
    const body = `From: ${name} (${email})\nOrg: ${org}\nEST: ${est || "—"}\n\n${message}`;

    if (org === "massif" && web3Key) {
      try {
        const res = await fetch(WEB3FORMS_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            access_key: web3Key,
            from_name: name,
            replyto: email,
            subject: subjectLine,
            message: body,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { success?: boolean; message?: string };
        if (!data.success) throw new Error(data.message ?? "Submission failed");
        setState("success");
      } catch (err) {
        setState("error");
        setError(err instanceof Error ? err.message : "Submission failed");
      }
      return;
    }

    // Envision users (or no Web3Forms key configured): open mailto.
    const mailto = `mailto:${RECIPIENT_EMAIL}?subject=${encodeURIComponent(
      subjectLine
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    setState("success");
  }

  return (
    <div
      className={`modal-backdrop${open ? " open" : ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-hidden={!open}
    >
      <div
        className="modal modal-submit"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={dialogRef}
      >
        <div className="modal-head">
          <h3 id={titleId}>Submit Update</h3>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close submit form"
          >
            ✕
          </button>
        </div>

        {state === "success" ? (
          <div className="modal-success">
            <div className="modal-success-icon" aria-hidden="true">
              ✓
            </div>
            <p className="modal-success-title">Update sent</p>
            <p className="modal-success-msg">
              {org === "massif"
                ? "Mia at Envision Pricing & Estimating has been notified."
                : "Your mail client should have opened with the message ready to send."}
            </p>
            <div className="modal-actions">
              <button type="button" className="action primary" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        ) : (
          <form className="submit-form" onSubmit={handleSubmit} noValidate>
            <p className="form-intro">
              Routes to Mia at Envision Pricing &amp; Estimating. Massif users
              submit via secure form; Envision users open in their mail client.
            </p>

            <fieldset className="field-group">
              <legend className="visually-hidden">Your organization</legend>
              <label className={`org-pill ${org === "massif" ? "checked" : ""}`}>
                <input
                  type="radio"
                  name="org"
                  value="massif"
                  checked={org === "massif"}
                  onChange={() => setOrg("massif")}
                />
                Massif
              </label>
              <label className={`org-pill ${org === "envision" ? "checked" : ""}`}>
                <input
                  type="radio"
                  name="org"
                  value="envision"
                  checked={org === "envision"}
                  onChange={() => setOrg("envision")}
                />
                Envision
              </label>
            </fieldset>

            <div className="field-row">
              <div className="field">
                <label htmlFor="sf-name">Name</label>
                <input
                  ref={firstFieldRef}
                  id="sf-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>
              <div className="field">
                <label htmlFor="sf-email">Email</label>
                <input
                  id="sf-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="field-row">
              <div className="field field-est">
                <label htmlFor="sf-est">EST # (optional)</label>
                <input
                  id="sf-est"
                  type="text"
                  value={est}
                  onChange={(e) => setEst(e.target.value)}
                  placeholder="e.g. 1054"
                />
              </div>
              <div className="field">
                <label htmlFor="sf-subject">Subject</label>
                <input
                  id="sf-subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="sf-message">Message</label>
              <textarea
                id="sf-message"
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>

            {state === "error" && (
              <div className="form-error" role="alert">
                Couldn&rsquo;t send: {error}
              </div>
            )}

            <div className="modal-actions">
              <button type="button" className="action" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="action primary"
                disabled={!valid || state === "submitting"}
              >
                {state === "submitting" ? "Sending..." : "Send Update"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
