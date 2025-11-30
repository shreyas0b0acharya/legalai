// src/components/ChatArea.tsx
import React from "react";
import MessageBubble from "../src/components/MessageBubble";
import { Message } from "../src/types/types";

interface ChatAreaProps {
  chatContainerRef: React.RefObject<HTMLDivElement>;
  messages: Message[];
  loading: boolean;
  uploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileSelect: (file: File | null) => void;
  editingIndex: number | null;
  editingText: string;
  setEditingIndex: (index: number | null) => void;
  setEditingText: (text: string) => void;
  handleSaveEdit: (index: number) => void;
  handleCopy: (text: string, isAi: boolean) => void;
  handleRegenerate: (index: number) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const ChatArea: React.FC<ChatAreaProps> = ({
  chatContainerRef,
  messages,
  loading,
  uploading,
  fileInputRef,
  handleFileSelect,
  editingIndex,
  editingText,
  setEditingIndex,
  setEditingText,
  handleSaveEdit,
  handleCopy,
  handleRegenerate,
  messagesEndRef,
}) => {
  return (
    <div ref={chatContainerRef} className="tidio-chat-area">
      {messages.length === 0 ? (
        <div className="welcome-screen">
          <div className="welcome-icon">⚖️</div>
          <h2>Welcome to LegalAI Assistant</h2>
          <p>Upload a legal document to get started, or ask me anything!</p>

          <div className="welcome-upload">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileSelect(e.target.files?.[0] || null)}
              style={{ display: "none" }}
            />
            <button
              className="upload-btn-large"
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              Choose PDF Document
            </button>
            {uploading && (
              <div className="uploading-indicator">
                <div className="spinner"></div>
                <span>Processing document...</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="messages-container">
          {messages.map((msg, idx) => (
            <MessageBubble
              key={idx}
              msg={msg}
              idx={idx}
              editingIndex={editingIndex}
              editingText={editingText}
              setEditingIndex={setEditingIndex}
              setEditingText={setEditingText}
              handleSaveEdit={handleSaveEdit}
              handleCopy={handleCopy}
              handleRegenerate={handleRegenerate}
            />
          ))}
          {loading && (
            <div className="message message-ai">
              <div className="message-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                  />
                </svg>
              </div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          {uploading && (
            <div className="message message-ai">
              <div className="message-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                  />
                </svg>
              </div>
              <div className="message-content">
                <div className="message-bubble">
                  <div className="uploading-indicator-inline">
                    <div className="spinner-small"></div>
                    <span>Processing your document...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
};

export default ChatArea;