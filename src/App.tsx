import React, { useState, useEffect } from "react";
import { Header, type ViewState } from "./components/Header";
import { StaffForm } from "./components/StaffForm";
import { Login } from "./components/Login";
import { PrincipalDashboard } from "./components/PrincipalDashboard";
import { SuperAdminPanel } from "./components/SuperAdminPanel";
import { 
  subscribeToAuthChanges, 
  logoutUser, 
  initializeSubjectsIfNeeded,
  type AuthUser, 
  IS_FIREBASE_CONFIGURED 
} from "./firebase";
import { Info, HelpCircle, X } from "lucide-react";

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>("staff");
  const [adminUser, setAdminUser] = useState<AuthUser | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [requestedRole, setRequestedRole] = useState<"principal" | "super_admin">("principal");

  // Initialize DB Seeds & Auth Changes
  useEffect(() => {
    // 1. If Firebase is active, auto-seed the subjects catalog if empty
    if (IS_FIREBASE_CONFIGURED) {
      initializeSubjectsIfNeeded();
    }

    // 2. Subscribe to auth changes
    const unsubscribe = subscribeToAuthChanges((user) => {
      setAdminUser(user);
      
      if (user) {
        // If logged in from the login view, redirect to their home panel
        if (currentView === "login") {
          setCurrentView(user.role === "super_admin" ? "superadmin" : "dashboard");
        }
      } else {
        // If signed out, force back to staff view or login
        if (currentView === "dashboard" || currentView === "superadmin") {
          setCurrentView("staff");
        }
      }
    });

    return () => unsubscribe();
  }, [currentView]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      setCurrentView("staff");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const handleLoginSuccess = (user: AuthUser) => {
    setAdminUser(user);
    setCurrentView(user.role === "super_admin" ? "superadmin" : "dashboard");
  };

  const handleViewChange = (view: ViewState) => {
    if (view === "dashboard") {
      if (adminUser && adminUser.role === "principal") {
        setCurrentView("dashboard");
      } else {
        setRequestedRole("principal");
        setCurrentView("login");
      }
    } else if (view === "superadmin") {
      if (adminUser && adminUser.role === "super_admin") {
        setCurrentView("superadmin");
      } else {
        setRequestedRole("super_admin");
        setCurrentView("login");
      }
    } else {
      setCurrentView(view);
    }
  };

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
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {currentView === "staff" && <StaffForm />}
        
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
