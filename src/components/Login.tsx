import React, { useState } from "react";
import { Lock, Mail, Eye, EyeOff, ShieldAlert, Key } from "lucide-react";
import { loginUser, loginStaff, IS_FIREBASE_CONFIGURED } from "../firebase";

interface LoginProps {
  onLoginSuccess: (user: any) => void;
  requestedRole: "principal" | "super_admin" | "staff";
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, requestedRole }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setError(null);
    setLoading(true);

    const normEmail = email.trim().toLowerCase();
    const superAdminEmail = (import.meta.env.VITE_SUPER_ADMIN_EMAIL || "superadmin@attendance.com").toLowerCase();

    // Enforce auth role separation on sign-in attempt
    if (requestedRole === "super_admin" && normEmail !== superAdminEmail) {
      setError("This portal is restricted to Super Administrator logins only.");
      setLoading(false);
      return;
    }

    if (requestedRole === "principal" && normEmail === superAdminEmail) {
      setError("Please log in as a Principal. Super Administrators must authenticate via the Super Admin portal.");
      setLoading(false);
      return;
    }

    try {
      if (requestedRole === "staff") {
        const staff = await loginStaff(email, password);
        onLoginSuccess(staff);
      } else {
        const user = await loginUser(email, password);
        onLoginSuccess(user);
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const autofillSuperAdmin = () => {
    setEmail("superadmin@attendance.com");
    setPassword("superadmin123");
  };

  const autofillPrincipal = () => {
    setEmail("principal@attendance.com");
    setPassword("principal123");
  };

  const autofillStaff = () => {
    setEmail("amit.patil@smvicre.edu.in");
    setPassword("staff123");
  };

  const getPortalTitle = () => {
    if (requestedRole === "super_admin") return "Super Admin Portal";
    if (requestedRole === "principal") return "Principal Dashboard Portal";
    return "Staff Attendance Portal";
  };

  const getPortalSubtitle = () => {
    if (requestedRole === "super_admin") {
      return "Sign in using Super Admin credentials to manage system settings.";
    }
    if (requestedRole === "principal") {
      return "Sign in using your registered Principal credentials to view analytics.";
    }
    return "Sign in using your registered staff email and password to log in and record attendance.";
  };

  return (
    <div style={{ maxWidth: "480px", margin: "2rem auto", padding: "1rem" }}>
      <div className="glass-card">
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "rgba(59, 130, 246, 0.1)",
              border: "1px solid rgba(59, 130, 246, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem auto",
              color: "#3b82f6"
            }}
          >
            <Key size={30} />
          </div>
          <h2>{getPortalTitle()}</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
            {getPortalSubtitle()}
          </p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              borderRadius: "8px",
              padding: "0.75rem 1rem",
              color: "#fca5a5",
              fontSize: "0.9rem",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem"
            }}
          >
            <ShieldAlert size={20} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="form-group">
            <label>Email Address</label>
            <div style={{ position: "relative" }}>
              <input
                type="email"
                required
                placeholder={requestedRole === "staff" ? "first.last@smvicre.edu.in" : "e.g. user@attendance.com"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: "2.5rem" }}
              />
              <Mail
                size={18}
                style={{
                  position: "absolute",
                  left: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)"
                }}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: "2.5rem", paddingRight: "2.5rem" }}
              />
              <Lock
                size={18}
                style={{
                  position: "absolute",
                  left: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)"
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: 0,
                  display: "flex",
                  alignItems: "center"
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "0.5rem" }} disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {!IS_FIREBASE_CONFIGURED && (
          <div
            style={{
              marginTop: "1.5rem",
              paddingTop: "1.25rem",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              textAlign: "center"
            }}
          >
            <span
              style={{
                display: "block",
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                marginBottom: "0.75rem"
              }}
            >
              Simulating locally. Use demo credentials:
            </span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {requestedRole === "super_admin" && (
                <button
                  onClick={autofillSuperAdmin}
                  className="btn btn-secondary"
                  style={{
                    padding: "0.5rem",
                    minHeight: "36px",
                    fontSize: "0.8rem",
                    flex: 1
                  }}
                >
                  Autofill Super Admin
                </button>
              )}
              {requestedRole === "principal" && (
                <button
                  onClick={autofillPrincipal}
                  className="btn btn-secondary"
                  style={{
                    padding: "0.5rem",
                    minHeight: "36px",
                    fontSize: "0.8rem",
                    flex: 1
                  }}
                >
                  Autofill Principal
                </button>
              )}
              {requestedRole === "staff" && (
                <button
                  onClick={autofillStaff}
                  className="btn btn-secondary"
                  style={{
                    padding: "0.5rem",
                    minHeight: "36px",
                    fontSize: "0.8rem",
                    flex: 1
                  }}
                >
                  Autofill Staff
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default Login;
