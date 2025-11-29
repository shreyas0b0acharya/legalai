import React from "react";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase"; // Make sure this path is correct

function Header({
  theme,
  toggleTheme,
  fileName,
  messages,
  menuOpen,
  setMenuOpen,
  menuButtonRef,
  menuRef,
  handleNewChat,
}) {
  const user = auth.currentUser; // Get current logged-in user

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setMenuOpen(false);
      // No need to navigate — main.jsx already listens to auth state and shows Login page
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="tidio-header">
      <div className="header-content">
        {/* LEFT SIDE */}
        <div className="header-left">
          <div className="header-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
              />
            </svg>
          </div>

          <div className="header-info">
            <h1>LegalAI Assistant</h1>

            {fileName && (
              <div className="active-document">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
                </svg>
                <span>{fileName}</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: 3 DOT MENU */}
        <div className="header-right">
          <div className="menu-wrapper">
            <button
              className="menu-btn"
              ref={menuButtonRef}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                width="20"
                height="20"
                stroke="none"
                className="menu-dots"
              >
                <circle cx="12" cy="6" r="2.2" />
                <circle cx="12" cy="12" r="2.2" />
                <circle cx="12" cy="18" r="2.2" />
              </svg>
            </button>

            {menuOpen && (
              <div className="menu-dropdown" ref={menuRef}>
                {/* USER INFO (optional nice touch) */}
                {user && (
                  <>
                    <div className="menu-user-info">
                      <img
                        src={user.photoURL || "/default-avatar.png"}
                        alt={user.displayName || "User"}
                        className="menu-user-avatar"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="menu-user-name">
                          {user.displayName || "User"}
                        </div>
                        <div className="menu-user-email">{user.email}</div>
                      </div>
                    </div>
                    <div className="menu-divider" />
                  </>
                )}

                {/* NEW CHAT */}
                {messages.length > 0 && (
                  <button className="menu-item" onClick={handleNewChat}>
                    <div className="menu-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </div>
                    <span>New Chat</span>
                  </button>
                )}

                {/* THEME TOGGLE */}
                <button
                  className="menu-item"
                  onClick={() => {
                    toggleTheme();
                    setMenuOpen(false);
                  }}
                >
                  <div className="menu-icon">
                    {theme === "dark" ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="5" strokeWidth="2" />
                        <path
                          d="M12 1v2M12 21v2M1 12h2M21 12h2M4.2 4.2l1.4 1.4M18.3 18.3l1.4 1.4M4.2 19.8l1.4-1.4M18.3 5.6l1.4-1.4"
                          strokeWidth="2"
                        />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21.64 13.36A9 9 0 1110.64 2.36 7.5 7.5 0 0021.64 13.36z"
                        />
                      </svg>
                    )}
                  </div>
                  <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
                </button>

                {/* LOGOUT */}
                <button className="menu-item logout-item" onClick={handleLogout}>
                  <div className="menu-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                  </div>
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Header;