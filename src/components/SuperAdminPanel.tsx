import React, { useState, useEffect } from "react";
import { 
  getPrincipals, 
  addPrincipal, 
  deletePrincipal, 
  getStaff, 
  addStaff, 
  deleteStaff, 
  getSubjects, 
  addSubject, 
  deleteSubject,
  updateSubject,
  type Principal,
  type Staff,
  type SubjectItem
} from "../firebase";
import { DEPARTMENTS, SEMESTERS, type Department, type Semester } from "../subjects";
import { 
  UserPlus, 
  ShieldCheck, 
  Users, 
  BookOpen, 
  Trash2, 
  Plus, 
  Layers,
  Edit2,
  Check,
  X
} from "lucide-react";

export const SuperAdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"principals" | "staff" | "subjects">("principals");

  // Principals State
  const [principalsList, setPrincipalsList] = useState<Principal[]>([]);
  const [pName, setPName] = useState("");
  const [pEmail, setPEmail] = useState("");
  const [pPassword, setPPassword] = useState("");
  const [pError, setPError] = useState<string | null>(null);
  const [pSuccess, setPSuccess] = useState(false);

  // Staff State
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [sName, setSName] = useState("");
  const [sDept, setSDept] = useState<Department | "">("");
  const [staffFilterDept, setStaffFilterDept] = useState<Department | "">("");
  const [sError, setSError] = useState<string | null>(null);
  const [sSuccess, setSSuccess] = useState(false);

  // Subjects State
  const [subjectsList, setSubjectsList] = useState<SubjectItem[]>([]);
  const [subName, setSubName] = useState("");
  const [subDept, setSubDept] = useState<Department | "">("");
  const [subSem, setSubSem] = useState<Semester | "">("");
  const [subError, setSubError] = useState<string | null>(null);
  const [subSuccess, setSubSuccess] = useState(false);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editingSubName, setEditingSubName] = useState("");

  // Loaders
  const [loading, setLoading] = useState(false);

  // Load lists when tabs change
  useEffect(() => {
    loadData();
  }, [activeTab, staffFilterDept, subDept, subSem]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "principals") {
        const data = await getPrincipals();
        setPrincipalsList(data);
      } else if (activeTab === "staff") {
        const data = await getStaff(staffFilterDept || undefined);
        setStaffList(data);
      } else if (activeTab === "subjects") {
        if (subDept && subSem) {
          const data = await getSubjects(subDept, subSem);
          setSubjectsList(data);
        } else {
          setSubjectsList([]);
        }
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Principal handlers
  const handleAddPrincipal = async (e: React.FormEvent) => {
    e.preventDefault();
    setPError(null);
    setPSuccess(false);
    if (!pName || !pEmail || !pPassword) {
      setPError("All fields are required.");
      return;
    }
    if (pPassword.length < 6) {
      setPError("Password must be at least 6 characters.");
      return;
    }

    try {
      await addPrincipal(pEmail, pName, pPassword);
      setPName("");
      setPEmail("");
      setPPassword("");
      setPSuccess(true);
      loadData();
    } catch (err: any) {
      setPError(err.message || "Failed to add Principal account.");
    }
  };

  const handleDeletePrincipal = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete Principal account for "${name}"?`)) return;
    try {
      await deletePrincipal(id);
      loadData();
    } catch (err: any) {
      alert("Error deleting: " + err.message);
    }
  };

  // Staff handlers
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSError(null);
    setSSuccess(false);
    if (!sName || !sDept) {
      setSError("Please provide Staff Name and Department.");
      return;
    }

    try {
      await addStaff(sName, sDept);
      setSName("");
      setSSuccess(true);
      loadData();
    } catch (err: any) {
      setSError(err.message || "Failed to add staff member.");
    }
  };

  const handleDeleteStaff = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove staff member "${name}"?`)) return;
    try {
      await deleteStaff(id);
      loadData();
    } catch (err: any) {
      alert("Error removing staff: " + err.message);
    }
  };

  // Subjects handlers
  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubError(null);
    setSubSuccess(false);
    if (!subName || !subDept || !subSem) {
      setSubError("Please fill in all subject fields.");
      return;
    }

    try {
      await addSubject(subName, subDept, subSem);
      setSubName("");
      setSubSuccess(true);
      loadData();
    } catch (err: any) {
      setSubError(err.message || "Failed to add subject.");
    }
  };

  const handleDeleteSubject = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the subject "${name}"?`)) return;
    try {
      await deleteSubject(id);
      loadData();
    } catch (err: any) {
      alert("Error deleting subject: " + err.message);
    }
  };

  const handleEditSubjectStart = (id: string, name: string) => {
    setEditingSubId(id);
    setEditingSubName(name);
  };

  const handleEditSubjectCancel = () => {
    setEditingSubId(null);
    setEditingSubName("");
  };

  const handleSaveSubjectEdit = async (id: string) => {
    if (!editingSubName.trim()) {
      alert("Subject name cannot be empty.");
      return;
    }
    try {
      await updateSubject(id, editingSubName);
      setEditingSubId(null);
      setEditingSubName("");
      loadData();
    } catch (err: any) {
      alert("Error updating subject: " + err.message);
    }
  };

  return (
    <div className="sa-page">
      {/* Title */}
      <div className="sa-heading">
        <h2>Super Admin Administration</h2>
        <p className="subtitle" style={{ marginBottom: 0 }}>
          Manage Principal credentials, staff lists, and subjects curriculum catalogues.
        </p>
      </div>

      {/* Admin Tab Selector */}
      <div className="admin-tab-container">
        <button
          className={`nav-btn ${activeTab === "principals" ? "active" : ""}`}
          onClick={() => setActiveTab("principals")}
        >
          <ShieldCheck size={18} />
          <span>Manage Principals</span>
        </button>
        <button
          className={`nav-btn ${activeTab === "staff" ? "active" : ""}`}
          onClick={() => setActiveTab("staff")}
        >
          <Users size={18} />
          <span>Manage Staff</span>
        </button>
        <button
          className={`nav-btn ${activeTab === "subjects" ? "active" : ""}`}
          onClick={() => setActiveTab("subjects")}
        >
          <BookOpen size={18} />
          <span>Manage Subjects</span>
        </button>
      </div>

      {/* --- TAB 1: MANAGE PRINCIPALS --- */}
      {activeTab === "principals" && (
        <div className="admin-grid">
          {/* Create Form */}
          <div className="glass-card">
            <h3 className="sa-card-title">
              <UserPlus size={18} style={{ color: "var(--accent-blue)", flexShrink: 0 }} />
              <span>Create Principal Account</span>
            </h3>
            {pError && <div className="sa-msg sa-msg-error">{pError}</div>}
            {pSuccess && <div className="sa-msg sa-msg-success">Principal created successfully!</div>}

            <form onSubmit={handleAddPrincipal} className="sa-form">
              <div className="form-group">
                <label>Principal Name</label>
                <input type="text" value={pName} onChange={(e) => setPName(e.target.value)} placeholder="Dr. Ranjeet Powar" required />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" value={pEmail} onChange={(e) => setPEmail(e.target.value)} placeholder="principal@college.edu" required />
              </div>
              <div className="form-group">
                <label>Sign-in Password</label>
                <input type="password" value={pPassword} onChange={(e) => setPPassword(e.target.value)} placeholder="Min 6 characters" required />
              </div>
              <button type="submit" className="btn btn-primary sa-submit-btn">
                Create Account
              </button>
            </form>
          </div>

          {/* List Table */}
          <div className="glass-card">
            <h3 className="sa-card-title sa-card-title-plain">Registered Principal Accounts</h3>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email Address</th>
                    <th>Credentials</th>
                    <th style={{ textAlign: "center" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && principalsList.length === 0 ? (
                    <tr><td colSpan={4} className="sa-td-center">Loading accounts...</td></tr>
                  ) : principalsList.length === 0 ? (
                    <tr><td colSpan={4} className="sa-td-center sa-td-muted">No Principal accounts found.</td></tr>
                  ) : (
                    principalsList.map((p) => (
                      <tr key={p.id}>
                        <td className="sa-td-bold">{p.name}</td>
                        <td className="sa-td-secondary">{p.email}</td>
                        <td className="sa-td-credential">
                          Pass: {p.password ? "••••••" : "Auth Managed"}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            onClick={() => handleDeletePrincipal(p.id!, p.name)}
                            className="btn btn-danger sa-icon-btn"
                            title="Delete Account"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: MANAGE STAFF --- */}
      {activeTab === "staff" && (
        <div className="admin-grid">
          {/* Create Form */}
          <div className="glass-card">
            <h3 className="sa-card-title">
              <UserPlus size={18} style={{ color: "var(--accent-blue)", flexShrink: 0 }} />
              <span>Register Staff Member</span>
            </h3>
            {sError && <div className="sa-msg sa-msg-error">{sError}</div>}
            {sSuccess && <div className="sa-msg sa-msg-success">Staff added successfully!</div>}

            <form onSubmit={handleAddStaff} className="sa-form">
              <div className="form-group">
                <label>Staff Member Name</label>
                <input type="text" value={sName} onChange={(e) => setSName(e.target.value)} placeholder="Prof. Amit Patil" required />
              </div>
              <div className="form-group">
                <label>Department</label>
                <select value={sDept} onChange={(e) => setSDept(e.target.value as Department)} required>
                  <option value="">-- Select Department --</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <button type="submit" className="btn btn-primary sa-submit-btn">
                Add Staff
              </button>
            </form>
          </div>

          {/* List Table */}
          <div className="glass-card">
            <div className="staff-dir-header">
              <h3 className="sa-card-title sa-card-title-plain" style={{ marginBottom: 0 }}>Registered Staff Directory</h3>
              <div className="sa-filter-row">
                <span className="sa-filter-label">Filter Dept:</span>
                <select
                  value={staffFilterDept}
                  onChange={(e) => setStaffFilterDept(e.target.value as Department)}
                  className="sa-filter-select"
                >
                  <option value="">All Departments</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Staff Name</th>
                    <th>Department</th>
                    <th style={{ textAlign: "center" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && staffList.length === 0 ? (
                    <tr><td colSpan={3} className="sa-td-center">Loading staff list...</td></tr>
                  ) : staffList.length === 0 ? (
                    <tr><td colSpan={3} className="sa-td-center sa-td-muted">No staff found in this directory.</td></tr>
                  ) : (
                    staffList.map((s) => (
                      <tr key={s.id}>
                        <td className="sa-td-bold">{s.name}</td>
                        <td>
                          <span className="badge badge-purple">{s.department}</span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            onClick={() => handleDeleteStaff(s.id!, s.name)}
                            className="btn btn-danger sa-icon-btn"
                            title="Remove Staff"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: MANAGE SUBJECTS --- */}
      {activeTab === "subjects" && (
        <div className="admin-grid">
          {/* Create Form */}
          <div className="glass-card">
            <h3 className="sa-card-title">
              <Plus size={18} style={{ color: "var(--accent-blue)", flexShrink: 0 }} />
              <span>Add Subject / Course</span>
            </h3>
            {subError && <div className="sa-msg sa-msg-error">{subError}</div>}
            {subSuccess && <div className="sa-msg sa-msg-success">Subject added successfully!</div>}

            <form onSubmit={handleAddSubject} className="sa-form">
              <div className="form-group">
                <label>Subject / Course Name</label>
                <input type="text" value={subName} onChange={(e) => setSubName(e.target.value)} placeholder="e.g. Advanced Operating Systems" required />
              </div>
              <div className="form-group">
                <label>Department</label>
                <select value={subDept} onChange={(e) => setSubDept(e.target.value as Department)} required>
                  <option value="">-- Select Department --</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Semester</label>
                <select value={subSem} onChange={(e) => setSubSem(e.target.value as Semester)} required>
                  <option value="">-- Select Semester --</option>
                  {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <button type="submit" className="btn btn-primary sa-submit-btn">
                Add Subject
              </button>
            </form>
          </div>

          {/* List Table */}
          <div className="glass-card">
            <div className="sa-subjects-header">
              <h3 className="sa-card-title sa-card-title-plain" style={{ marginBottom: 0 }}>Subjects Catalogues</h3>
              <div className="sa-filter-row">
                <select
                  value={subDept}
                  onChange={(e) => setSubDept(e.target.value as Department)}
                  className="sa-filter-select"
                >
                  <option value="">-- Select Dept --</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select
                  value={subSem}
                  onChange={(e) => setSubSem(e.target.value as Semester)}
                  className="sa-filter-select"
                >
                  <option value="">-- Select Sem --</option>
                  {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {!subDept || !subSem ? (
              <div className="table-wrapper">
                <div className="table-empty">
                  <Layers size={40} style={{ opacity: 0.5 }} />
                  <p style={{ fontWeight: 600, color: "var(--text-primary)" }}>Select Department and Semester first</p>
                  <p style={{ fontSize: "0.85rem" }}>Select a specific department and semester from the filter dropdowns to manage subjects.</p>
                </div>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Subject Name</th>
                      <th>Dept &amp; Sem</th>
                      <th style={{ textAlign: "center" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && subjectsList.length === 0 ? (
                      <tr><td colSpan={3} className="sa-td-center">Loading subjects list...</td></tr>
                    ) : subjectsList.length === 0 ? (
                      <tr><td colSpan={3} className="sa-td-center sa-td-muted">No subjects recorded for this mapping.</td></tr>
                    ) : (
                      subjectsList.map((s) => {
                        const isEditing = editingSubId === s.id;
                        return (
                          <tr key={s.id}>
                            <td>
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editingSubName}
                                  onChange={(e) => setEditingSubName(e.target.value)}
                                  className="sa-edit-input"
                                  autoFocus
                                />
                              ) : (
                                <span className="sa-td-bold">{s.name}</span>
                              )}
                            </td>
                            <td>
                              <span className="sa-td-secondary">{s.department}</span>
                              <span className="badge badge-purple sa-sem-badge">{s.semester}</span>
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <div className="sa-action-btns">
                                {isEditing ? (
                                  <>
                                    <button
                                      onClick={() => handleSaveSubjectEdit(s.id!)}
                                      className="btn btn-success sa-icon-btn"
                                      title="Save Subject"
                                    >
                                      <Check size={16} />
                                    </button>
                                    <button
                                      onClick={handleEditSubjectCancel}
                                      className="btn btn-secondary sa-icon-btn"
                                      title="Cancel Edit"
                                    >
                                      <X size={16} />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleEditSubjectStart(s.id!, s.name)}
                                      className="btn btn-secondary sa-icon-btn sa-edit-btn"
                                      title="Edit Subject"
                                    >
                                      <Edit2 size={16} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteSubject(s.id!, s.name)}
                                      className="btn btn-danger sa-icon-btn"
                                      title="Delete Subject"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default SuperAdminPanel;

