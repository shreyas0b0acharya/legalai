import React, { useCallback, useRef } from "react";
import "./messagebubble.css";

function MessageBubble({
  msg,
  idx,
  editingIndex,
  editingText,
  setEditingIndex,
  setEditingText,
  handleSaveEdit,
  handleCopy,
  handleRegenerate,
}) {
  const editRef = useRef(null);
  const bubbleRef = useRef(null);

  const handleEditStart = useCallback(() => {
    setEditingIndex(idx);
    setEditingText(msg.text);
    // Focus and auto-resize
    setTimeout(() => {
      if (editRef.current) {
        editRef.current.focus();
        editRef.current.style.height = "auto";
        editRef.current.style.height = `${editRef.current.scrollHeight}px`;
      }
    }, 0);
  }, [idx, msg.text, setEditingIndex, setEditingText]);

  const handleEditCancel = useCallback(() => {
    setEditingIndex(null);
    setEditingText("");
  }, [setEditingIndex, setEditingText]);

  const handleActionsClick = useCallback((e) => {
    e.stopPropagation();
  }, []);

  const handleBubbleClick = useCallback((e) => {
    if (msg.sender === "ai" && bubbleRef.current) {
      // Optional: Select text for copying on click
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(bubbleRef.current);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }, [msg.sender]);

  return (
    <div
      className={`message ${msg.sender === "user" ? "message-user" : "message-ai"}`}
      role="log"
      aria-live="polite"
      aria-label={`${msg.sender === "user" ? "User" : "Assistant"}: ${msg.text.substring(0, 100)}...`}
    >
      <div className="message-avatar" aria-hidden="true">
        {msg.sender === "user" ? (
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
            />
          </svg>
        )}
      </div>

      <div className="user-message-wrapper">
        {/* Editing Mode */}
        {editingIndex === idx ? (
          <div className="edit-box">
            <textarea
              ref={editRef}
              className="edit-textarea"
              value={editingText}
              onChange={(e) => {
                setEditingText(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              placeholder="Edit your message..."
              aria-label="Edit message"
            />
            <div className="edit-actions">
              <button
                className="cancel-edit"
                onClick={handleEditCancel}
                aria-label="Cancel edit"
              >
                Cancel
              </button>
              <button
                className="save-edit"
                onClick={() => handleSaveEdit(idx)}
                aria-label="Save and regenerate"
              >
                Save & Regenerate
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Normal Message */}
            <div
              ref={bubbleRef}
              className={`message-bubble ${msg.sender === "user" ? "user-bubble" : "ai-bubble"}`}
              onClick={handleBubbleClick}
              role="article"
              tabIndex={0}
              aria-label={`Message: ${msg.text.substring(0, 100)}...`}
            >
              {msg.sender === "ai" ? (
                <div dangerouslySetInnerHTML={{ __html: msg.text }} />
              ) : (
                <p>{msg.text}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div 
              className="message-actions" 
              onClick={handleActionsClick}
              role="group"
              aria-label="Message actions"
            >
              {/* Edit user messages */}
              {msg.sender === "user" && (
                <button
                  className="edit-icon-btn"
                  onClick={handleEditStart}
                  aria-label="Edit message"
                  title="Edit"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z" />
                  </svg>
                </button>
              )}

              {/* Copy */}
              <button
                className="copy-icon-btn"
                onClick={() => handleCopy(msg.text, msg.sender === "ai")}
                aria-label="Copy message"
                title="Copy"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
              </button>

              {/* Regenerate AI messages */}
              {msg.sender === "ai" && (
                <button
                  className="regen-icon-btn"
                  onClick={() => handleRegenerate(idx)}
                  aria-label="Regenerate response"
                  title="Regenerate"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
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
}

export default React.memo(MessageBubble);