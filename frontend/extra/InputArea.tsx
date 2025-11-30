// src/components/InputArea.tsx
import React from "react";
import { Message } from "../src/types/types";

interface InputAreaProps {
  fileName: string | null;
  messages: Message[];
  question: string;
  setQuestion: (question: string) => void;
  loading: boolean;
  uploading: boolean;
  isStreaming: boolean;
  setShowNewChatModal: (show: boolean) => void;
  handleAsk: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileSelect: (file: File | null) => void;
  stopStreamingRef: React.MutableRefObject<boolean>;
}

const InputArea: React.FC<InputAreaProps> = ({
  fileName,
  messages,
  question,
  setQuestion,
  loading,
  uploading,
  isStreaming,
  setShowNewChatModal,
  handleAsk,
  fileInputRef,
  handleFileSelect,
  stopStreamingRef,
}) => {
  return (
    <div>
      {!fileName && messages.length === 0 ? (
        <div className="input-placeholder">
          Upload a document to start chatting...
        </div>
      ) : (
        <>
          <div className="input-wrapper">
            <button
              className="attach-btn"
              onClick={() => setShowNewChatModal(true)}
              type="button"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>
            </button>

            <textarea
              className="chat-input"
              placeholder="Type your question here..."
              value={question}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setQuestion(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAsk();
                }
              }}
              rows={1}
              style={{ resize: "none" }}
            />

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const f = e.target.files?.[0] || null;
                if (f) handleFileSelect(f);
              }}
              style={{ display: "none" }}
            />

            <div className="send-wrapper">
              <button
                className="send-btn"
                onClick={() => {
                  if (isStreaming) {
                    stopStreamingRef.current = true;
                    return;
                  }
                  handleAsk();
                }}
                disabled={
                  loading ||
                  (!question.trim() && !isStreaming) ||
                  !fileName ||
                  uploading
                }
                type="button"
              >
                {isStreaming ? (
                  // STOP ICON
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                ) : (
                  // SEND ICON
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default InputArea;