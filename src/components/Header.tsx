import React, { useState } from "react";
import { GraduationCap, LayoutDashboard, LogOut, UserCheck, ShieldAlert, Menu, X } from "lucide-react";
import { type AuthUser } from "../firebase";

export type ViewState = "staff" | "dashboard" | "superadmin" | "login";

interface HeaderProps {
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
  adminUser: AuthUser | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  adminUser,
  onLogout
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleNavClick = (view: ViewState) => {
    onViewChange(view);
    setIsOpen(false);
  };

  const handleLogoutClick = () => {
    onLogout();
    setIsOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="nav-brand" style={{ cursor: "pointer" }} onClick={() => handleNavClick("staff")}>
          <GraduationCap size={28} />
          <span>Vidyalaya Attendance</span>
        </div>

        {/* Mobile Hamburger toggle button */}
        <button 
          className="menu-toggle" 
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle Menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Regular Desktop Links (hidden on mobile via CSS) */}
        <div className="nav-links desktop-only">
          {/* Staff Entry - Always Visible */}
          <button
            className={`nav-btn ${currentView === "staff" ? "active" : ""}`}
            onClick={() => handleNavClick("staff")}
          >
            <UserCheck size={18} />
            <span>Staff Entry</span>
          </button>

          {/* Principal Dashboard */}
          {(!adminUser || adminUser.role === "principal") && (
            <button
              className={`nav-btn ${currentView === "dashboard" ? "active" : ""}`}
              onClick={() => handleNavClick("dashboard")}
            >
              <LayoutDashboard size={18} />
              <span>Principal Dashboard</span>
            </button>
          )}

          {/* Super Admin Panel */}
          {(!adminUser || adminUser.role === "super_admin") && (
            <button
              className={`nav-btn ${currentView === "superadmin" ? "active" : ""}`}
              onClick={() => handleNavClick("superadmin")}
            >
              <ShieldAlert size={18} />
              <span>Super Admin Panel</span>
            </button>
          )}

          {/* Logged in User Profile & Sign Out Button */}
          {adminUser && (
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginLeft: "0.5rem" }}>
              <span 
                className={`badge ${adminUser.role === "super_admin" ? "badge-purple" : "badge-blue"}`} 
                style={{ display: "inline-flex", gap: "0.25rem" }}
                title={adminUser.email}
              >
                {adminUser.role === "super_admin" ? "Super Admin" : "Principal"}
              </span>
              <button
                onClick={handleLogoutClick}
                className="btn btn-danger"
                style={{
                  minHeight: "38px",
                  height: "38px",
                  padding: "0 1rem",
                  fontSize: "0.9rem",
                  display: "inline-flex",
                  alignItems: "center"
                }}
                title="Sign Out"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Links Dropdown Menu */}
      {isOpen && (
        <div className="mobile-nav-menu">
          <button
            className={`mobile-nav-btn ${currentView === "staff" ? "active" : ""}`}
            onClick={() => handleNavClick("staff")}
          >
            <UserCheck size={18} />
            <span>Staff Entry</span>
          </button>

          {(!adminUser || adminUser.role === "principal") && (
            <button
              className={`mobile-nav-btn ${currentView === "dashboard" ? "active" : ""}`}
              onClick={() => handleNavClick("dashboard")}
            >
              <LayoutDashboard size={18} />
              <span>Principal Dashboard</span>
            </button>
          )}

          {(!adminUser || adminUser.role === "super_admin") && (
            <button
              className={`mobile-nav-btn ${currentView === "superadmin" ? "active" : ""}`}
              onClick={() => handleNavClick("superadmin")}
            >
              <ShieldAlert size={18} />
              <span>Super Admin Panel</span>
            </button>
          )}

          {adminUser && (
            <div className="mobile-profile-section">
              <span className={`badge ${adminUser.role === "super_admin" ? "badge-purple" : "badge-blue"}`} style={{ alignSelf: "flex-start" }}>
                {adminUser.role === "super_admin" ? "Super Admin" : "Principal"}
              </span>
              <button
                onClick={handleLogoutClick}
                className="btn btn-danger mobile-logout-btn"
                style={{
                  minHeight: "38px",
                  height: "38px",
                  width: "100%",
                  justifyContent: "center",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
export default Header;
