import React, { useState } from "react";
import { Lock, Mail, Eye, EyeOff, ShieldAlert, Key } from "lucide-react";
import { loginUser, IS_FIREBASE_CONFIGURED } from "../firebase";

interface LoginProps {
  onLoginSuccess: (user: any) => void;
  requestedRole: "principal" | "super_admin";
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
      const user = await loginUser(email, password);
      onLoginSuccess(user);
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
          <h2>{requestedRole === "super_admin" ? "Super Admin Portal" : "Principal Dashboard Portal"}</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
            {requestedRole === "super_admin" 
              ? "Sign in using Super Admin credentials to manage system settings." 
              : "Sign in using your registered Principal credentials to view analytics."}
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
            <ShieldAlert size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div style={{ position: "relative" }}>
              <input
                type="email"
                id="email"
                required
                placeholder="admin@attendance.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                style={{ paddingLeft: "2.75rem" }}
              />
              <Mail
                size={18}
                style={{
                  position: "absolute",
                  left: "1rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)"
                }}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                style={{ paddingLeft: "2.75rem" }}
              />
              <Lock
                size={18}
                style={{
                  position: "absolute",
                  left: "1rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)"
                }}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={{ height: "48px", width: "48px" }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: "0.5rem" }}>
            {loading ? "Authenticating..." : "Login to Portal"}
          </button>
        </form>

        {!IS_FIREBASE_CONFIGURED && (
          <div
            style={{
              marginTop: "2rem",
              paddingTop: "1.5rem",
              borderTop: "1px solid var(--border-color)",
              textAlign: "center"
            }}
          >
            <span
              style={{
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                display: "block",
                marginBottom: "0.75rem"
              }}
            >
              Simulating locally. Use demo credentials:
            </span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {requestedRole === "super_admin" ? (
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
              ) : (
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default Login;
