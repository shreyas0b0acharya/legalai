// src/components/MessageBubble.tsx
import React from "react";
import { Message } from "../src/types/types";

interface MessageBubbleProps {
  msg: Message;
  idx: number;
  editingIndex: number | null;
  editingText: string;
  setEditingIndex: (index: number | null) => void;
  setEditingText: (text: string) => void;
  handleSaveEdit: (index: number) => void;
  handleCopy: (text: string, isAi: boolean) => void;
  handleRegenerate: (index: number) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  msg,
  idx,
  editingIndex,
  editingText,
  setEditingIndex,
  setEditingText,
  handleSaveEdit,
  handleCopy,
  handleRegenerate,
}) => {
  return (
    <div
      className={`message ${
        msg.sender === "user" ? "message-user" : "message-ai"
      }`}
    >
      <div className="message-avatar">
        {msg.sender === "user" ? (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
            />
          </svg>
        )}
      </div>

      <div
        className="user-message-wrapper"
        style={{ position: "relative", width: "100%" }}
      >
        {/* 🚀 If editing this message */}
        {editingIndex === idx ? (
          <div className="edit-box">
            <textarea
              className="edit-textarea"
              value={editingText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditingText(e.target.value)}
            />

            <div className="edit-actions">
              <button
                className="cancel-edit"
                onClick={() => {
                  setEditingIndex(null);
                  setEditingText("");
                }}
                type="button"
              >
                Cancel
              </button>

              <button
                className="save-edit"
                onClick={() => handleSaveEdit(idx)}
                type="button"
              >
                Save & Regenerate
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Normal message bubble */}
            <div
              className={`message-bubble ${
                msg.sender === "user" ? "user-bubble" : "ai-bubble"
              }`}
            >
              {msg.sender === "ai" ? (
                <div dangerouslySetInnerHTML={{ __html: msg.text }} />
              ) : (
                <p>{msg.text}</p>
              )}
            </div>

            <div className="message-actions">
              {/* ✏️ EDIT only for user messages */}
              {msg.sender === "user" && (
                <button
                  className="edit-icon-btn"
                  onClick={() => {
                    setEditingIndex(idx);
                    setEditingText(msg.text);
                  }}
                  type="button"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    stroke="currentColor"
                    fill="none"
                    strokeWidth="2"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z" />
                  </svg>
                </button>
              )}

              {/* 📋 COPY icon — for both user + AI */}
              <button
                className="copy-icon-btn"
                onClick={() => handleCopy(msg.text, msg.sender === "ai")}
                title="Copy message"
                type="button"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  stroke="currentColor"
                  fill="none"
                  strokeWidth="2"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
              </button>

              {/* 🔄 Regenerate AI response */}
              {msg.sender === "ai" && (
                <button
                  className="regen-icon-btn"
                  onClick={() => handleRegenerate(idx)}
                  title="Regenerate"
                  type="button"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 12a9 9 0 1 1-3-7" />
                    <polyline points="21 3 21 9 15 9" />
                  </svg>
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;