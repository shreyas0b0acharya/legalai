import React, { useEffect, useCallback } from "react";
import useChatLogic from "./hooks/useChatLogic";
import ChatArea from "./components/ChatArea.jsx";
import InputArea from "./components/InputArea.jsx";
import NewChatModal from "./components/NewChatModal.jsx";
import Dashboard from "./components/Dashboard.jsx";
import "./App.css";
import Sidebar from "./components/Sidebar.jsx";
import { Menu } from "lucide-react";

function App() {
  const {
    theme,
    toggleTheme,
    fileName,
    messages,
    question,
    setQuestion,
    loading,
    uploading,
    showNewChatModal,
    setShowNewChatModal,
    isStreaming,
    editingIndex,
    setEditingIndex,
    editingText,
    setEditingText,
    toastMessage,
    fileInputRef,
    chatContainerRef,
    messagesEndRef,
    handleFileSelect,
    handleNewChat,
    handleSaveEdit,
    handleRegenerate,
    handleCopy,
    handleAsk,
    stopStreamingRef,
    files,
    handleFileSelectFromDB,
    handleDelete,
    messageLoading,
    filesLoading,
    displayFileName,
    setDisplayFileName,
    displayFileId,
    setDisplayFileId,
    currentFileIdRef,
    setFileName,
    setMessages
  } = useChatLogic();

  const [currentView, setCurrentView] = React.useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const handlePopState = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get("view") || "dashboard";
    const fileId = params.get("file") || null;

    setCurrentView(view);

    if (fileId) {
      const fileData = files.find(f => f.id === fileId);
      if (fileData) {
        setDisplayFileId(fileId);
        handleFileSelectFromDB(fileData);
      }
    } else {
      setDisplayFileId(null);
      setDisplayFileName(null);
      setMessages([]);
      currentFileIdRef.current = null;
      setFileName(null);
    }
  }, [files, setCurrentView, setDisplayFileId, handleFileSelectFromDB, setDisplayFileName, setMessages, currentFileIdRef, setFileName]);

  useEffect(() => {
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [handlePopState]);

  const handleOpenDoc = useCallback((doc) => {
    handleFileSelectFromDB(doc);
    setCurrentView("chat");
  }, [handleFileSelectFromDB]);

  const handleFileUpload = useCallback((file) => {
    handleFileSelect(file);
    setCurrentView("chat");
  }, [handleFileSelect]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  return (
    <div className="app-layout">
      {/* SIDEBAR */}
      <Sidebar
        theme={theme}
        toggleTheme={toggleTheme}
        currentView={currentView}
        setCurrentView={setCurrentView}
        fileName={displayFileName}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        fileInputRef={fileInputRef}
        files={files}
        handleFileSelectFromDB={handleFileSelectFromDB}
        displayFileName={displayFileName}
        setDisplayFileName={setDisplayFileName}
        displayFileId={displayFileId}
        setDisplayFileId={setDisplayFileId}
      />

      {/* HAMBURGER (mobile only) */}
      <button
        className={`hamburger-global ${sidebarOpen ? "hidden" : ""}`}
        onClick={toggleSidebar}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* MAIN */}
      <main className={`main-content ${currentView === "dashboard" ? "dashboard-mode" : "chat-mode"}`}>
        {/* DASHBOARD MODE */}
        {currentView === "dashboard" && (
          <Dashboard
            documents={files}
            onOpen={handleOpenDoc}
            onFileSelect={handleFileUpload}
            onDelete={handleDelete}
            filesLoading={filesLoading}
          />
        )}

        {/* CHAT MODE */}
        {currentView === "chat" && (
          <div className="chat-wrapper">
            <ChatArea
              chatContainerRef={chatContainerRef}
              messages={messages}
              loading={loading}
              uploading={uploading}
              fileInputRef={fileInputRef}
              handleFileSelect={handleFileSelect}
              editingIndex={editingIndex}
              editingText={editingText}
              setEditingIndex={setEditingIndex}
              setEditingText={setEditingText}
              handleSaveEdit={handleSaveEdit}
              handleCopy={handleCopy}
              handleRegenerate={handleRegenerate}
              messagesEndRef={messagesEndRef}
              messageLoading={messageLoading}
            />

            <InputArea
              fileName={fileName}
              messages={messages}
              question={question}
              setQuestion={setQuestion}
              loading={loading}
              uploading={uploading}
              isStreaming={isStreaming}
              setShowNewChatModal={setShowNewChatModal}
              handleAsk={handleAsk}
              fileInputRef={fileInputRef}
              handleFileSelect={handleFileSelect}
              stopStreamingRef={stopStreamingRef}
            />
          </div>
        )}
      </main>

      {/* MODAL */}
      {showNewChatModal && (
        <NewChatModal
          fileName={fileName}
          setShowNewChatModal={setShowNewChatModal}
          handleNewChat={handleNewChat}
          fileInputRef={fileInputRef}
        />
      )}

      {/* TOAST */}
      {toastMessage && (
        <div className="toast-notification" role="alert">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default React.memo(App);