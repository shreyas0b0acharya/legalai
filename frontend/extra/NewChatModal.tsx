// src/components/NewChatModal.tsx
import React from "react";

interface NewChatModalProps {
  fileName: string | null;
  setShowNewChatModal: (show: boolean) => void;
  handleNewChat: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

const NewChatModal: React.FC<NewChatModalProps> = ({
  fileName,
  setShowNewChatModal,
  handleNewChat,
  fileInputRef,
}) => {
  return (
    <div className="modal-overlay" onClick={() => setShowNewChatModal(false)}>
      <div className="modal-content" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div className="modal-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3>Start New Chat?</h3>
        <p>
          You're currently chatting with <strong>{fileName}</strong>. Do you
          want to start a new conversation with the new document?
        </p>

        <div className="modal-actions">
          {/* CONTINUE SAME CHAT */}
          <button
            className="modal-btn modal-btn-secondary"
            onClick={() => {
              setShowNewChatModal(false);
              fileInputRef.current?.click();
            }}
            type="button"
          >
            Continue Current Chat
          </button>

          {/* START NEW CHAT */}
          <button
            className="modal-btn modal-btn-primary"
            onClick={() => {
              setShowNewChatModal(false);
              handleNewChat();
              setTimeout(() => {
                fileInputRef.current?.click();
              }, 50);
            }}
            type="button"
          >
            Start New Chat
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;