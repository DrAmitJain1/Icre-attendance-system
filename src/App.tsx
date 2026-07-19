import React, { useState, useEffect } from "react";
import { Header, type ViewState } from "./components/Header";
// import { StaffForm } from "./components/StaffForm";
import { StaffDashboard } from "./components/StaffDashboard";
import { Login } from "./components/Login";
import { PrincipalDashboard } from "./components/PrincipalDashboard";
import { SuperAdminPanel } from "./components/SuperAdminPanel";
import {
  subscribeToAuthChanges,
  logoutUser,
  initializeSubjectsIfNeeded,
  initializeStudentsIfNeeded,
  type AuthUser,
  type Staff,
  IS_FIREBASE_CONFIGURED
} from "./firebase";
import { Info, HelpCircle, X } from "lucide-react";

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>("staff");
  const [adminUser, setAdminUser] = useState<AuthUser | null>(null);
  const [loggedInStaff, setLoggedInStaff] = useState<Staff | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [requestedRole, setRequestedRole] = useState<"principal" | "super_admin" | "staff">("staff");
  const [loadingAuth, setLoadingAuth] = useState(true);

  const setPersistedView = (view: ViewState) => {
    setCurrentView(view);
    localStorage.setItem("attendance_current_view", view);
  };

  // Load saved session and view on mount
  useEffect(() => {
    const savedStaff = localStorage.getItem("attendance_logged_in_staff");
    if (savedStaff) {
      try {
        setLoggedInStaff(JSON.parse(savedStaff));
      } catch (e) {
        console.error("Failed to restore staff session:", e);
      }
    }

    const savedView = localStorage.getItem("attendance_current_view") as ViewState | null;
    if (savedView) {
      setCurrentView(savedView);
    }
  }, []);

  // Initialize DB Seeds & Auth Changes
  useEffect(() => {
    // 1. If Firebase is active, auto-seed the subjects & students catalog if empty
    if (IS_FIREBASE_CONFIGURED) {
      initializeSubjectsIfNeeded();
      initializeStudentsIfNeeded();
    }

    // 2. Subscribe to auth changes
    const unsubscribe = subscribeToAuthChanges((user) => {
      setAdminUser(user);
      setLoadingAuth(false);

      const savedView = localStorage.getItem("attendance_current_view") as ViewState | null;

      if (user) {
        // If logged in as admin, check if their current view is login or default staff view
        if (currentView === "login" || (currentView === "staff" && !localStorage.getItem("attendance_logged_in_staff"))) {
          const nextView = user.role === "super_admin" ? "superadmin" : "dashboard";
          setPersistedView(nextView);
        } else if (savedView) {
          setCurrentView(savedView);
        }
      } else {
        // If signed out, force back to staff view if currently in admin dashboards
        if (currentView === "dashboard" || currentView === "superadmin") {
          setPersistedView("staff");
        } else if (savedView) {
          setCurrentView(savedView);
        }
      }
    });

    return () => unsubscribe();
  }, [currentView]);

  const handleLogout = async () => {
    if (loggedInStaff) {
      setLoggedInStaff(null);
      localStorage.removeItem("attendance_logged_in_staff");
      setPersistedView("staff");
    } else {
      try {
        await logoutUser();
        setPersistedView("staff");
      } catch (error) {
        console.error("Sign out error:", error);
      }
    }
  };

  const handleLoginSuccess = (user: any) => {
    if (requestedRole === "staff") {
      setLoggedInStaff(user);
      localStorage.setItem("attendance_logged_in_staff", JSON.stringify(user));
      setPersistedView("staff");
    } else {
      setAdminUser(user);
      setPersistedView(user.role === "super_admin" ? "superadmin" : "dashboard");
    }
  };

  const handleViewChange = (view: ViewState) => {
    if (view === "dashboard") {
      if (adminUser && adminUser.role === "principal") {
        setPersistedView("dashboard");
      } else {
        setRequestedRole("principal");
        setPersistedView("login");
      }
    } else if (view === "superadmin") {
      if (adminUser && adminUser.role === "super_admin") {
        setPersistedView("superadmin");
      } else {
        setRequestedRole("super_admin");
        setPersistedView("login");
      }
    } else {
      setPersistedView(view);
    }
  };

  if (loadingAuth) {
    return (
      <div className="roster-loading-container" style={{ height: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <div className="spinner"></div>
        <p style={{ marginTop: "1rem", color: "var(--text-secondary)", fontWeight: 600 }}>Resuming session...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Demo Mode Notice Banner */}
      {!IS_FIREBASE_CONFIGURED && (
        <div className="demo-banner">
          <Info size={16} />
          <span>
            <strong>Demo Mode Active:</strong> Attendance records are saved locally in this browser.
          </span>
          <button
            className="demo-banner-link"
            onClick={() => setShowConfigModal(true)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              font: "inherit",
              fontWeight: 800
            }}
          >
            Click here to connect Firebase
          </button>
        </div>
      )}

      {/* Header / Navbar */}
      <Header
        currentView={currentView}
        onViewChange={handleViewChange}
        adminUser={adminUser}
        loggedInStaff={loggedInStaff}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {currentView === "staff" && (
          loggedInStaff ? (
            <StaffDashboard loggedInStaff={loggedInStaff} />
          ) : (
            <Login
              onLoginSuccess={(staff) => {
                setRequestedRole("staff");
                setLoggedInStaff(staff);
                localStorage.setItem("attendance_logged_in_staff", JSON.stringify(staff));
              }}
              requestedRole="staff"
            />
          )
        )}

        {currentView === "login" && (
          <Login onLoginSuccess={handleLoginSuccess} requestedRole={requestedRole} />
        )}

        {currentView === "superadmin" && (
          adminUser && adminUser.role === "super_admin" ? (
            <SuperAdminPanel />
          ) : (
            <Login onLoginSuccess={handleLoginSuccess} requestedRole="super_admin" />
          )
        )}

        {currentView === "dashboard" && (
          adminUser && adminUser.role === "principal" ? (
            <PrincipalDashboard />
          ) : (
            <Login onLoginSuccess={handleLoginSuccess} requestedRole="principal" />
          )
        )}
      </main>

      {/* Firebase Setup Modal */}
      {showConfigModal && (
        <div className="demo-modal-overlay" onClick={() => setShowConfigModal(false)}>
          <div className="demo-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0 }}>
                <HelpCircle size={20} />
                <span>Connect Firebase Database</span>
              </h3>
              <button
                onClick={() => setShowConfigModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  padding: "0.25rem"
                }}
              >
                <X size={20} />
              </button>
            </div>

            <p>
              To make this application a production-ready system storing data dynamically for all users, configure your Firebase credentials:
            </p>

            <ol>
              <li>Go to the <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" style={{ color: "var(--accent-blue)" }}>Firebase Console</a> and create a new project.</li>
              <li>Under project settings, register a new <strong>Web App</strong> to retrieve your config keys.</li>
              <li>Enable <strong>Firestore Database</strong> (rules must allow writes/reads) and <strong>Authentication</strong> (enable Email/Password provider).</li>
              <li>Create a <code>.env.local</code> file in this workspace root (based on <code>.env.example</code>) and insert your credentials:</li>
            </ol>

            <pre>
{`VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=app-name.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=app-name
VITE_FIREBASE_STORAGE_BUCKET=app-name.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:1234:web:abcd
VITE_SUPER_ADMIN_EMAIL=superadmin@attendance.com
VITE_SUPER_ADMIN_PASSWORD=superadmin123`}
            </pre>

            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 0 }}>
              <strong>For Vercel Deployments:</strong> Go to your Vercel Dashboard → Project Settings → Environment Variables, and add each of these keys there so they are populated securely.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
export default App;
