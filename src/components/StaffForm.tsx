import React, { useState, useEffect } from "react";
import { CheckCircle } from "lucide-react";
import { saveAttendanceRecord, getStaff, getSubjects } from "../firebase";
import { DEPARTMENTS, SEMESTERS, type Department, type Semester } from "../subjects";

export const StaffForm: React.FC = () => {
  // State for form fields
  const [academicYear, setAcademicYear] = useState("");
  const [department, setDepartment] = useState<Department | "">("");
  const [semester, setSemester] = useState<Semester | "">("");
  const [subject, setSubject] = useState("");
  const [staffName, setStaffName] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [absentNos, setAbsentNos] = useState("");

  // UI state
  const [subjectsList, setSubjectsList] = useState<string[]>([]);
  const [dbStaffList, setDbStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize smart defaults
  useEffect(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-11
    
    // Academic Year: If before June, it's (currentYear - 1)-(currentYear)
    if (currentMonth < 5) {
      setAcademicYear(`${currentYear - 1}-${currentYear}`);
    } else {
      setAcademicYear(`${currentYear}-${currentYear + 1}`);
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

    // Retrieve staff name from localStorage if available
    const savedName = localStorage.getItem("attendance_staff_name");
    if (savedName) {
      setStaffName(savedName);
    }
  }, []);

  // Update subjects list whenever department or semester changes (dynamically from database)
  useEffect(() => {
    const loadSubjectsData = async () => {
      if (department && semester) {
        try {
          const list = await getSubjects(department, semester);
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
  }, [department, semester]);

  // Update staff list whenever department changes (dynamically from database)
  useEffect(() => {
    const loadStaffData = async () => {
      if (department) {
        try {
          const list = await getStaff(department);
          setDbStaffList(list);
          // If the saved staff name is not in the list, or empty, set to empty
          const savedName = localStorage.getItem("attendance_staff_name");
          if (savedName && list.find(s => s.name === savedName)) {
            setStaffName(savedName);
          } else {
            setStaffName("");
          }
        } catch (e) {
          console.error("Failed to load staff:", e);
        }
      } else {
        setDbStaffList([]);
        setStaffName("");
      }
    };
    loadStaffData();
  }, [department]);

  // Reset semester if department changes to Science & Humanities and semester is > Sem 2
  useEffect(() => {
    if (department === "Science & Humanities" && semester !== "" && semester !== "Semester 1" && semester !== "Semester 2") {
      setSemester("");
    }
  }, [department, semester]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!academicYear || !department || !semester || !subject || !staffName || !date || !startTime || !endTime) {
      setError("Please fill in all required fields.");
      return;
    }

    // Validate Absent Roll Numbers format (e.g. 5, 12, 19 or empty/numbers/commas)
    const cleanAbsent = absentNos.trim();
    if (cleanAbsent !== "") {
      const isValid = /^[\d\s,]*$/.test(cleanAbsent);
      if (!isValid) {
        setError("Absent Roll Numbers must be numbers separated by commas only (e.g., 5, 12, 19).");
        return;
      }
    }

    setError(null);
    setLoading(true);

    try {
      await saveAttendanceRecord({
        academicYear,
        department,
        semester,
        subject,
        staffName,
        date,
        startTime,
        endTime,
        absentNos: cleanAbsent
      });

      // Save staff name to local storage for convenience
      localStorage.setItem("attendance_staff_name", staffName);

      // Trigger success state
      setSuccess(true);
      setAbsentNos(""); // Clear absentees for subsequent logs
      
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
        {/* Academic Year */}
        <div className="form-group">
          <label htmlFor="academicYear">Academic Year</label>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              id="academicYear"
              required
              placeholder="e.g. 2026-2027"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
            />
          </div>
        </div>

        {/* Date */}
        <div className="form-group">
          <label htmlFor="date">Date</label>
          <div style={{ position: "relative" }}>
            <input
              type="date"
              id="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        {/* Department */}
        <div className="form-group">
          <label htmlFor="department">Department</label>
          <select
            id="department"
            required
            value={department}
            onChange={(e) => setDepartment(e.target.value as Department)}
          >
            <option value="">-- Select Department --</option>
            {DEPARTMENTS.map((dept) => (
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
            {(department === "Science & Humanities" ? SEMESTERS.slice(0, 2) : SEMESTERS).map((sem) => (
              <option key={sem} value={sem}>
                {sem}
              </option>
            ))}
          </select>
        </div>

        {/* Subject (Filtered dynamically) */}
        <div className="form-group">
          <label htmlFor="subject">Subject / Course</label>
          <select
            id="subject"
            required
            disabled={!department || !semester}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            {!department || !semester ? (
              <option value="">Choose Dept & Sem first</option>
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

        {/* Staff Name Dropdown */}
        <div className="form-group">
          <label htmlFor="staffName">Staff Name</label>
          <select
            id="staffName"
            required
            disabled={!department}
            value={staffName}
            onChange={(e) => setStaffName(e.target.value)}
          >
            {!department ? (
              <option value="">Choose Department first</option>
            ) : (
              <>
                <option value="">-- Select Staff --</option>
                {dbStaffList.map((st) => (
                  <option key={st.id || st.name} value={st.name}>
                    {st.name}
                  </option>
                ))}
              </>
            )}
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

        {/* Absent Roll Numbers */}
        <div className="form-group full-width">
          <label htmlFor="absentNos">Absent Student Roll Numbers (comma separated)</label>
          <input
            type="text"
            id="absentNos"
            placeholder="e.g., 5, 12, 19, 23 (Leave blank if all are present)"
            value={absentNos}
            onChange={(e) => setAbsentNos(e.target.value)}
          />
          <span className="form-hint">Enter roll numbers separated by commas. Leave blank if 100% attendance.</span>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="btn btn-primary btn-submit"
          disabled={loading}
        >
          {loading ? "Saving Attendance Record..." : "Log & Save Record"}
        </button>
      </form>
    </div>
  );
};
export default StaffForm;
