import React, { useCallback } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";

import {
  LayoutDashboard,
  Scale,
  FileText,
  LogOut,
  Moon,
  Sun,
  Plus,
  ChevronLeft,
} from "lucide-react";

import "./Sidebar.css";

export default function Sidebar({
  theme,
  toggleTheme,
  currentView,
  setCurrentView,
  sidebarOpen,
  setSidebarOpen,
  fileInputRef,
  files,
  handleFileSelectFromDB,
  displayFileId,
  setDisplayFileId,
}) {
  const user = auth.currentUser;

  const updateURL = useCallback((view, fileId = null) => {
    const params = new URLSearchParams();
    params.set("view", view);
    if (fileId) params.set("file", fileId);

    const newURL = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, "", newURL);
  }, []);

  const handleNewChatClick = useCallback(() => {
    setCurrentView("chat");
    setDisplayFileId(null);
    updateURL("chat");

    setSidebarOpen(false);

    setTimeout(() => {
      if (fileInputRef?.current) {
        fileInputRef.current.value = "";
        fileInputRef.current.click();
      }
    }, 50);
  }, [setCurrentView, setDisplayFileId, updateURL, setSidebarOpen, fileInputRef]);

  const handleDashboardClick = useCallback(() => {
    setCurrentView("dashboard");
    setDisplayFileId(null);
    updateURL("dashboard");
    setSidebarOpen(false);
  }, [setCurrentView, setDisplayFileId, updateURL, setSidebarOpen]);

  const handleFileClick = useCallback(
    (file) => {
      setDisplayFileId(file.id);
      handleFileSelectFromDB(file);
      setCurrentView("chat");
      updateURL("chat", file.id);
      setSidebarOpen(false);
    },
    [setDisplayFileId, handleFileSelectFromDB, setCurrentView, updateURL, setSidebarOpen]
  );

  const handleLogoClick = useCallback(() => {
    setCurrentView("dashboard");
    setDisplayFileId(null);
    updateURL("dashboard");
  }, [setCurrentView, setDisplayFileId, updateURL]);

  const handleLogout = useCallback(() => {
    signOut(auth);
  }, []);

  return (
    <aside
      className={`sidebar ${sidebarOpen ? "open" : ""}`}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* MOBILE CLOSE */}
      <button
        className="sidebar-close"
        onClick={() => setSidebarOpen(false)}
        aria-label="Close sidebar"
      >
        <ChevronLeft size={20} />
      </button>

      {/* HEADER */}
      <div className="sidebar-header">
        <div className="sidebar-header-content" role="banner">
          <button
            onClick={handleLogoClick}
            className="logo-button"
            aria-label="Go to dashboard"
          >
            <div className="logo-circle">
              <Scale size={24} />
            </div>
          </button>

          <div className="sidebar-header-text">
            <h2 className="logo-title">LegalAI</h2>
            <p className="logo-subtitle">Smart Legal Assistant</p>
          </div>

          <button
            className="theme-icon-btn"
            onClick={toggleTheme}
            title="Toggle Theme"
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="sidebar-nav" aria-label="Primary navigation">
        <button
          className={`sidebar-menu-item ${currentView === "dashboard" ? "active" : ""}`}
          onClick={handleDashboardClick}
          aria-current={currentView === "dashboard" ? "page" : undefined}
        >
          <LayoutDashboard size={20} aria-hidden="true" />
          <span>Dashboard</span>
        </button>

        {currentView === "chat" && (
          <button
            className="sidebar-menu-item new-chat-item"
            onClick={handleNewChatClick}
            aria-label="Start new chat"
          >
            <Plus size={20} aria-hidden="true" />
            <span>New Chat</span>
          </button>
        )}
      </nav>

      {/* DOCUMENTS SECTION */}
      {files && files.length > 0 && (
        <section className="sidebar-documents-section" aria-label="Recent documents">
          <h3 className="section-title">Documents</h3>
          <div className="sidebar-file-list">
            {files.map((file) => (
              <button
                key={file.id}
                className={`sidebar-file-item ${file.id === displayFileId ? "active" : ""}`}
                onClick={() => handleFileClick(file)}
                aria-label={`Open chat for ${file.originalName}`}
              >
                <FileText size={16} aria-hidden="true" />
                <span className="file-name" title={file.originalName}>
                  {file.originalName}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="sidebar-divider" />

      {/* USER FOOTER */}
      {user && (
        <footer className="sidebar-footer" aria-label="User account">
          <button
            className="sidebar-user"
            onClick={() => {}}
            aria-disabled="true"
          >
            <img
              src={user.photoURL || "/default-avatar.png"}
              referrerPolicy="no-referrer"
              alt=""
              className="sidebar-user-avatar"
              onError={(e) => {
                e.target.src = "/default-avatar.png";
              }}
            />
            <div className="sidebar-user-info">
              <p className="sidebar-user-name" title={user.displayName || "User"}>
                {user.displayName || "User"}
              </p>
              <small className="sidebar-user-email" title={user.email}>
                {user.email}
              </small>
            </div>
            <button
              className="sidebar-settings-btn"
              onClick={handleLogout}
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut size={18} aria-hidden="true" />
            </button>
          </button>
        </footer>
      )}
    </aside>
  );
}