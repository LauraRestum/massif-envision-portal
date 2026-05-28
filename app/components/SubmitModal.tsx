"use client";

import { useEffect, useId, useRef, useState } from "react";

interface SubmitModalProps {
  open: boolean;
  onClose: () => void;
}

type Org = "massif" | "envision";
type SubmitState = "idle" | "submitting" | "success";

const RECIPIENT_EMAIL = "Massif@envisionus.com";

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

  // Reset on open
  useEffect(() => {
    if (open) {
      setState("idle");
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || state === "submitting") return;
    setState("submitting");

    const subjectLine = est ? `[EST ${est}] ${subject}` : subject;
    const body = `From: ${name} (${email})\nOrg: ${org}\nEST: ${est || "—"}\n\n${message}`;

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
              Your mail client should have opened with the message ready to send
              to Massif@envisionus.com.
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
              Routes to Massif@envisionus.com. Opens in your mail client with the
              message ready to send.
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
