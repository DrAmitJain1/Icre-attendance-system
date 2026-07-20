import React, { useState, useEffect } from "react";
import { CheckCircle } from "lucide-react";
import { saveAttendanceRecord, getSubjects, getStudents, subscribeToSystemSettings, type Staff, type Student } from "../firebase";
import { DEPARTMENTS, SEMESTERS, type Department, type Semester } from "../subjects";

interface StaffFormProps {
  loggedInStaff: Staff;
}

export const StaffForm: React.FC<StaffFormProps> = ({ loggedInStaff }) => {
  // State for form fields
  const [academicYear, setAcademicYear] = useState("");
  const [staffDepartment, setStaffDepartment] = useState<Department | "">("");
  const [lectureDepartment, setLectureDepartment] = useState<Department | "">("");
  const [semester, setSemester] = useState<Semester | "">("");
  const [subject, setSubject] = useState("");
  const [lectureType, setLectureType] = useState<"Lecture" | "Practical">("Lecture");
  const [staffName, setStaffName] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [absentNos, setAbsentNos] = useState("");
  const [dateLocked, setDateLocked] = useState(false);
  const [isExtraLecture, setIsExtraLecture] = useState(false);

  // UI state
  const [subjectsList, setSubjectsList] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Roster-based Attendance States
  const [students, setStudents] = useState<Student[]>([]);
  const [presentStatus, setPresentStatus] = useState<Record<string, boolean>>({});
  const [rosterLoading, setRosterLoading] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");

  // Confirmation Modal States
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [absentListForConfirm, setAbsentListForConfirm] = useState<{ rollNo: string; name: string }[]>([]);

  // Subscribe to system settings (lock / unlock date)
  useEffect(() => {
    const unsubscribe = subscribeToSystemSettings((settings) => {
      setDateLocked(settings.dateLocked);
    });
    return () => unsubscribe();
  }, []);

  // Load students for interactive roster
  useEffect(() => {
    const loadClassStudents = async () => {
      if (lectureDepartment && semester && academicYear) {
        setRosterLoading(true);
        try {
          const list = await getStudents(lectureDepartment, semester, academicYear);
          setStudents(list);
          // Default all loaded students to Present (true)
          const initialStatus: Record<string, boolean> = {};
          list.forEach(s => {
            initialStatus[s.rollNo] = true;
          });
          setPresentStatus(initialStatus);
        } catch (err) {
          console.error("Failed to load students roster:", err);
        } finally {
          setRosterLoading(false);
        }
      } else {
        setStudents([]);
        setPresentStatus({});
      }
    };
    loadClassStudents();
  }, [lectureDepartment, semester, academicYear]);

  const toggleStudentStatus = (rollNo: string) => {
    setPresentStatus(prev => ({
      ...prev,
      [rollNo]: !prev[rollNo]
    }));
  };

  const markAllPresent = () => {
    const updated: Record<string, boolean> = {};
    students.forEach(s => {
      updated[s.rollNo] = true;
    });
    setPresentStatus(updated);
  };

  const markAllAbsent = () => {
    const updated: Record<string, boolean> = {};
    students.forEach(s => {
      updated[s.rollNo] = false;
    });
    setPresentStatus(updated);
  };

  // Initialize smart defaults
  useEffect(() => {
    if (loggedInStaff) {
      setStaffName(loggedInStaff.name);
      setStaffDepartment(loggedInStaff.department as Department);
    }

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-11
    
    // Academic Year calculation matching the next year 1-1-2027 logic:
    if (currentYear >= 2027) {
      setAcademicYear(`${currentYear}-${currentYear + 1}`);
    } else {
      if (currentMonth < 5) {
        setAcademicYear(`${currentYear - 1}-${currentYear}`);
      } else {
        setAcademicYear(`${currentYear}-${currentYear + 1}`);
      }
    }

    // Set today's date in YYYY-MM-DD
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    setDate(`${yyyy}-${mm}-${dd}`);

    // Set default times (Current hour to next hour)
    const hour = today.getHours();
    const formattedStart = `${String(hour).padStart(2, "0")}:00`;
    const formattedEnd = `${String((hour + 1) % 24).padStart(2, "0")}:00`;
    setStartTime(formattedStart);
    setEndTime(formattedEnd);
  }, [loggedInStaff]);

  // Update subjects list whenever lectureDepartment or semester changes (dynamically from database)
  useEffect(() => {
    const loadSubjectsData = async () => {
      if (lectureDepartment && semester) {
        try {
          const list = await getSubjects(lectureDepartment, semester);
          setSubjectsList(Array.from(new Set(list.map(s => s.name))));
          setSubject(""); // Reset subject selection
        } catch (e) {
          console.error("Failed to load subjects:", e);
        }
      } else {
        setSubjectsList([]);
        setSubject("");
      }
    };
    loadSubjectsData();
  }, [lectureDepartment, semester]);

  // Reset semester if lectureDepartment changes to Science & Humanities and semester is > Sem 2
  useEffect(() => {
    if (lectureDepartment === "Science & Humanities" && semester !== "" && semester !== "Semester 1" && semester !== "Semester 2") {
      setSemester("");
    }
  }, [lectureDepartment, semester]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!academicYear || !staffDepartment || !lectureDepartment || !semester || !subject || !staffName || !date || !startTime || !endTime) {
      setError("Please fill in all required fields.");
      return;
    }

    // Prepare absent roll numbers from roster or manual text input
    let absentList: { rollNo: string; name: string }[] = [];
    if (students.length > 0) {
      const absentStudents = students.filter(s => !presentStatus[s.rollNo]);
      absentList = absentStudents.map(s => ({ rollNo: s.rollNo, name: s.name }));
    } else {
      const cleanAbsent = absentNos.trim();
      if (cleanAbsent !== "") {
        const isValid = /^[\d\s,]*$/.test(cleanAbsent);
        if (!isValid) {
          setError("Absent Roll Numbers must be numbers separated by commas only (e.g., 5, 12, 19).");
          return;
        }
        absentList = cleanAbsent.split(",").map(val => ({ rollNo: val.trim(), name: "Manual Entry" }));
      }
    }

    setError(null);
    setAbsentListForConfirm(absentList);
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    setError(null);
    setLoading(true);

    let cleanAbsent = "";
    if (students.length > 0) {
      const absentStudents = students.filter(s => !presentStatus[s.rollNo]);
      cleanAbsent = absentStudents.map(s => s.rollNo).join(", ");
    } else {
      cleanAbsent = absentNos.trim();
    }

    const dateParts = date.split("-");
    const dbFormattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : date;

    try {
      await saveAttendanceRecord({
        academicYear,
        department: lectureDepartment, // Saved as department (lecture target) to fit dashboard requirements
        staffDepartment,              // Saved as staffDepartment for meta-integrity
        semester,
        subject,
        lectureType,
        staffName,
        date: dbFormattedDate,
        startTime,
        endTime,
        absentNos: cleanAbsent,
        isExtraLecture
      });

      // Save staff name to local storage for convenience
      localStorage.setItem("attendance_staff_name", staffName);

       // Trigger success state
      setSuccess(true);
      setAbsentNos(""); // Clear absentees for subsequent logs
      setIsExtraLecture(false); // Reset extra lecture proxy checkbox
      
      // Auto dismiss success window after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);

    } catch (err: any) {
      console.error(err);
      setError("Failed to save record: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ position: "relative" }}>
      {success && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(11, 15, 25, 0.95)",
            backdropFilter: "blur(12px)",
            borderRadius: "16px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
            animation: "fadeIn 0.2s ease-out"
          }}
        >
          <div style={{ color: "var(--accent-green)", marginBottom: "1rem" }}>
            <CheckCircle size={64} />
          </div>
          <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            Attendance Logged Successfully!
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", textAlign: "center", maxWidth: "320px" }}>
            The record has been securely stored in Firebase and is visible in the Principal Dashboard.
          </p>
          <button
            className="btn btn-secondary"
            onClick={() => setSuccess(false)}
            style={{ marginTop: "2rem" }}
          >
            Log Another Lecture
          </button>
        </div>
      )}

      <h2>Daily Attendance Entry</h2>
      <p className="subtitle">Staff members can select their department, semester, subject, and record student absences.</p>

      {error && (
        <div
          style={{
            backgroundColor: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "8px",
            padding: "0.75rem 1rem",
            color: "#fca5a5",
            marginBottom: "1.5rem",
            fontSize: "0.9rem"
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="form-grid">
        {/* Academic Year (Locked) */}
        <div className="form-group">
          <label htmlFor="academicYear">Academic Year</label>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              id="academicYear"
              required
              readOnly
              style={{ opacity: 0.7, cursor: "not-allowed", backgroundColor: "rgba(255,255,255,0.05)" }}
              placeholder="e.g. 2026-2027"
              value={academicYear}
            />
          </div>
        </div>

        {/* Date (Conditionally Locked) */}
        <div className="form-group">
          <label htmlFor="date">
            Date {dateLocked && <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginLeft: "0.25rem" }}>(Locked to Today)</span>}
          </label>
          <div style={{ position: "relative" }}>
            <input
              type="date"
              id="date"
              required
              readOnly={dateLocked}
              style={dateLocked ? { opacity: 0.7, cursor: "not-allowed", backgroundColor: "rgba(255,255,255,0.05)" } : {}}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        {/* Staff Department (Locked) */}
        <div className="form-group">
          <label htmlFor="staffDepartment">Staff Department</label>
          <input
            type="text"
            id="staffDepartment"
            required
            readOnly
            style={{ opacity: 0.7, cursor: "not-allowed", backgroundColor: "rgba(255,255,255,0.05)" }}
            value={staffDepartment}
          />
        </div>

        {/* Lecture Department */}
        <div className="form-group">
          <label htmlFor="lectureDepartment">Lecture Department (Classroom)</label>
          <select
            id="lectureDepartment"
            required
            value={lectureDepartment}
            onChange={(e) => setLectureDepartment(e.target.value as Department)}
          >
            <option value="">-- Select Lecture Department --</option>
            {DEPARTMENTS.filter(d => d !== "Science & Humanities").map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {/* Semester */}
        <div className="form-group">
          <label htmlFor="semester">Semester</label>
          <select
            id="semester"
            required
            value={semester}
            onChange={(e) => setSemester(e.target.value as Semester)}
          >
            <option value="">-- Select Semester --</option>
            {(lectureDepartment === "Science & Humanities" ? SEMESTERS.slice(0, 2) : SEMESTERS).map((sem) => (
              <option key={sem} value={sem}>
                {sem}
              </option>
            ))}
          </select>
        </div>

        {/* Subject (Filtered dynamically based on Lecture Department) */}
        <div className="form-group">
          <label htmlFor="subject">Subject / Course</label>
          <select
            id="subject"
            required
            disabled={!lectureDepartment || !semester}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            {!lectureDepartment || !semester ? (
              <option value="">Choose Lecture Dept & Sem first</option>
            ) : (
              <>
                <option value="">-- Select Subject --</option>
                {subjectsList.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </>
            )}
          </select>
        </div>

        {/* Session / Lecture Type */}
        <div className="form-group">
          <label htmlFor="lectureType">Session Type (Lecture/Practical)</label>
          <select
            id="lectureType"
            required
            value={lectureType}
            onChange={(e) => setLectureType(e.target.value as "Lecture" | "Practical")}
          >
            <option value="Lecture">Lecture</option>
            <option value="Practical">Practical</option>
          </select>
        </div>


        {/* Start Time */}
        <div className="form-group">
          <label htmlFor="startTime">Lecture Start Time</label>
          <input
            type="time"
            id="startTime"
            required
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>

        {/* End Time */}
        <div className="form-group">
          <label htmlFor="endTime">Lecture End Time</label>
          <input
            type="time"
            id="endTime"
            required
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>

        {/* Extra Lecture Checkbox */}
        <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "0.5rem", height: "40px", marginTop: "24px" }}>
          <input
            type="checkbox"
            id="isExtraLecture"
            checked={isExtraLecture}
            onChange={(e) => setIsExtraLecture(e.target.checked)}
            style={{ width: "18px", height: "18px", cursor: "pointer" }}
          />
          <label htmlFor="isExtraLecture" style={{ margin: 0, cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>
            This is an Extra Lecture (Proxy)
          </label>
        </div>

        {/* Student Attendance Roster or Manual Input fallback */}
        {rosterLoading ? (
          <div className="form-group full-width roster-loading-container" style={{ textAlign: "center", padding: "2rem" }}>
            <div className="spinner" style={{ margin: "0 auto 1rem auto" }}></div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Loading students list for this class...</p>
          </div>
        ) : students.length > 0 ? (
          <div className="form-group full-width roster-card glass-card" style={{ padding: "1.25rem", margin: "1rem 0" }}>
            <div className="roster-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h4 className="roster-title" style={{ margin: 0, fontSize: "1.1rem" }}>Mark Absent / Present Students</h4>
                <p className="roster-subtitle" style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.2rem 0 0" }}>
                  Toggle student cards to mark them as Present (green) or Absent (red).
                </p>
              </div>
              <div className="roster-stats" style={{ display: "flex", gap: "0.5rem" }}>
                <span className="badge badge-purple">Total: {students.length}</span>
                <span className="badge badge-success">Present: {students.filter(s => presentStatus[s.rollNo]).length}</span>
                <span className="badge badge-danger">Absent: {students.filter(s => !presentStatus[s.rollNo]).length}</span>
              </div>
            </div>

            <div className="roster-actions-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
              <div className="roster-search-wrapper" style={{ flex: 1, minWidth: "200px" }}>
                <input
                  type="text"
                  placeholder="Filter by student name or roll..."
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  className="roster-search-input"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "rgba(255,255,255,0.05)", color: "var(--text-primary)", boxSizing: "border-box" }}
                />
              </div>
              <div className="roster-quick-btns" style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={markAllPresent}
                  className="btn btn-secondary"
                  style={{ fontSize: "0.8rem", padding: "6px 12px", display: "inline-flex" }}
                >
                  All Present
                </button>
                <button
                  type="button"
                  onClick={markAllAbsent}
                  className="btn btn-secondary"
                  style={{ fontSize: "0.8rem", padding: "6px 12px", display: "inline-flex" }}
                >
                  All Absent
                </button>
              </div>
            </div>

            <div className="roster-grid">
              {students
                .filter(s => {
                  const q = studentSearchQuery.toLowerCase().trim();
                  return s.name.toLowerCase().includes(q) || s.rollNo.includes(q);
                })
                .map((s) => {
                  const isPresent = presentStatus[s.rollNo] !== false; // default true
                  return (
                    <div
                      key={s.id}
                      onClick={() => toggleStudentStatus(s.rollNo)}
                      className={`roster-item compact-toggle ${isPresent ? "present" : "absent"}`}
                      title={`${s.name} (Roll No: ${s.rollNo})`}
                    >
                      <span className="roll-number">{s.rollNo}</span>
                      <span className="student-name-compact">{s.name}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        ) : (!lectureDepartment || !semester) ? (
          /* Prompts staff to select dept & sem */
          <div className="form-group full-width" style={{
            textAlign: "center",
            padding: "2rem",
            border: "1.5px dashed var(--border-color)",
            borderRadius: "12px",
            backgroundColor: "rgba(255, 255, 255, 0.01)",
            boxSizing: "border-box"
          }}>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: 0 }}>
              Select a Lecture Department and Semester above to load the student roster toggles.
            </p>
          </div>
        ) : (
          /* Manual Input Fallback when no students list is uploaded */
          <div className="form-group full-width">
            <label htmlFor="absentNos">Absent Student Roll Numbers (comma separated)</label>
            <input
              type="text"
              id="absentNos"
              placeholder="e.g., 5, 12, 19, 23 (Leave blank if all are present)"
              value={absentNos}
              onChange={(e) => setAbsentNos(e.target.value)}
            />
            <span className="form-hint">
              No students database found for this class. You can manually enter absent roll numbers separated by commas.
            </span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          className="btn btn-primary btn-submit"
          disabled={loading}
        >
          {loading ? "Checking Attendance..." : "Log & Save Record"}
        </button>
      </form>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay" style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "1rem",
          boxSizing: "border-box"
        }}>
          <div className="glass-card modal-card" style={{
            width: "100%",
            maxWidth: "480px",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "1.5rem",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            border: "1px solid var(--border-color)",
            boxSizing: "border-box"
          }}>
            <h3 style={{ margin: "0 0 0.5rem 0", color: "var(--text-primary)", fontSize: "1.25rem", fontWeight: 700 }}>
              Confirm Attendance Submission
            </h3>
            
            <div style={{ margin: "1rem 0", fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              <p style={{ marginBottom: "0.75rem" }}>
                Please review the absent students list before saving the record for <strong>{lectureDepartment} - {semester} ({subject})</strong>.
              </p>
              
              <div style={{ 
                border: "1px solid var(--border-color)", 
                borderRadius: "8px", 
                backgroundColor: "#f8fafc", 
                padding: "0.75rem 1rem", 
                maxHeight: "180px", 
                overflowY: "auto",
                margin: "1rem 0"
              }}>
                {absentListForConfirm.length === 0 ? (
                  <div style={{ color: "var(--accent-green)", fontWeight: 600, textAlign: "center", padding: "0.5rem" }}>
                    🎉 100% Attendance! All students are PRESENT.
                  </div>
                ) : (
                  <div>
                    <h5 style={{ margin: "0 0 0.5rem 0", color: "var(--accent-red)", fontWeight: 700 }}>
                      ABSENT STUDENTS ({absentListForConfirm.length})
                    </h5>
                    <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
                      {absentListForConfirm.map((item, idx) => (
                        <li key={idx} style={{ marginBottom: "0.25rem" }}>
                          <strong>Roll No. {item.rollNo}</strong>: {item.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowConfirmModal(false)}
                style={{ flex: 1, padding: "10px", fontSize: "0.9rem" }}
              >
                Go Back & Edit
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmSubmit}
                style={{ flex: 1, padding: "10px", fontSize: "0.9rem", backgroundColor: "var(--accent-red)", borderColor: "var(--accent-red)" }}
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default StaffForm;
