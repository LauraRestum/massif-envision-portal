"use client";

interface SubmitModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SubmitModal({ open, onClose }: SubmitModalProps) {
  return (
    <div
      className={`modal-backdrop${open ? " open" : ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal">
        <h3>Submit Update</h3>
        <p>
          Submission form to be wired up here. Will route to Mia at Envision
          Pricing &amp; Estimating via Web3Forms for Massif users, or via mailto
          for internal Envision users.
        </p>
        <div className="modal-actions">
          <button className="action" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
