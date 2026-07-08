import React, { useState, useEffect } from "react";
import { 
  subscribeToAttendanceRecords, 
  getSubjects,
  type AttendanceRecord 
} from "../firebase";
import { DEPARTMENTS, SEMESTERS, type Department, type Semester } from "../subjects";
import { 
  Download, 
  Search, 
  SlidersHorizontal, 
  Layers, 
  Users, 
  FolderOpen, 
  AlertCircle,
  FileSpreadsheet,
  TrendingDown,
  Activity,
  Percent,
  UserX
} from "lucide-react";
import * as XLSX from "xlsx";

export const PrincipalDashboard: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Layout Tab State
  const [section, setSection] = useState<"logs" | "defaulters">("logs");

  // Logs Filters State
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedDept, setSelectedDept] = useState<Department | "">("");
  const [selectedSem, setSelectedSem] = useState<Semester | "">("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [searchStaff, setSearchStaff] = useState("");
  const [subjectsList, setSubjectsList] = useState<string[]>([]);

  // Defaulters Filter State
  const [selectedMonth, setSelectedMonth] = useState("");

  // Subscribe to real-time logs on mount & set default filters
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToAttendanceRecords(
      (data) => {
        setRecords(data);
        setLoading(false);
      },
      (err) => {
        setError(`Database Connection Error: ${err.message}. Make sure you have created and enabled a Cloud Firestore database in your Firebase project (https://console.firebase.google.com/).`);
        setLoading(false);
      }
    );

    // Default month picker to current year-month
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    setSelectedMonth(`${yyyy}-${mm}`);

    return () => unsubscribe();
  }, []);

  // Reset semester if department changes to Science & Humanities and semester is > Sem 2
  useEffect(() => {
    if (selectedDept === "Science & Humanities" && selectedSem !== "" && selectedSem !== "Semester 1" && selectedSem !== "Semester 2") {
      setSelectedSem("");
    }
  }, [selectedDept, selectedSem]);

  // Update subjects dropdown options when department/semester filters change
  useEffect(() => {
    const loadSubjects = async () => {
      if (selectedDept) {
        try {
          const list = await getSubjects(selectedDept, selectedSem || undefined);
          setSubjectsList(Array.from(new Set(list.map(s => s.name))));
        } catch (e) {
          console.error("Failed to load subjects for principal dashboard:", e);
        }
      } else {
        setSubjectsList([]);
      }
      setSelectedSubject(""); // Reset subject filter
    };
    loadSubjects();
  }, [selectedDept, selectedSem]);

  // Apply filters in real-time for logs view
  useEffect(() => {
    let result = [...records];

    if (startDate) {
      result = result.filter(r => r.date >= startDate);
    }
    if (endDate) {
      result = result.filter(r => r.date <= endDate);
    }
    if (selectedDept) {
      result = result.filter(r => r.department === selectedDept);
    }
    if (selectedSem) {
      result = result.filter(r => r.semester === selectedSem);
    }
    if (selectedSubject) {
      result = result.filter(r => r.subject === selectedSubject);
    }
    if (searchStaff.trim()) {
      const search = searchStaff.toLowerCase();
      result = result.filter(r => r.staffName.toLowerCase().includes(search));
    }

    setFilteredRecords(result);
  }, [records, startDate, endDate, selectedDept, selectedSem, selectedSubject, searchStaff]);

  // Calculate Statistics (based on complete filtered set)
  const totalClasses = filteredRecords.length;
  const totalAbsences = filteredRecords.reduce((acc, curr) => {
    if (!curr.absentNos.trim()) return acc;
    return acc + curr.absentNos.split(",").filter(n => n.trim() !== "").length;
  }, 0);

  const avgAbsences = totalClasses > 0 ? (totalAbsences / totalClasses).toFixed(1) : "0";

  // Department-wise Absences (for visual progress charts)
  const getDeptAbsences = () => {
    const mapping: Record<string, number> = {};
    DEPARTMENTS.forEach(d => {
      mapping[d] = 0;
    });

    filteredRecords.forEach(r => {
      if (r.absentNos.trim()) {
        const count = r.absentNos.split(",").filter(n => n.trim() !== "").length;
        mapping[r.department] = (mapping[r.department] || 0) + count;
      }
    });

    return mapping;
  };

  const deptStats = getDeptAbsences();
  const maxDeptAbsence = Math.max(...Object.values(deptStats), 1); // Avoid division by 0

  const getHighestAbsenceDept = () => {
    let maxDept = "None";
    let maxVal = 0;
    Object.entries(deptStats).forEach(([dept, val]) => {
      if (val > maxVal) {
        maxVal = val;
        maxDept = dept;
      }
    });
    return maxVal > 0 ? maxDept : "None";
  };
  const highestAbsenceDept = getHighestAbsenceDept();

  const attendanceRate = totalClasses > 0 ? (Math.max(0, 100 - (totalAbsences / (totalClasses * 60)) * 100)).toFixed(1) + "%" : "100%";

  // --- STUDENT DEFAULTER LOGIC ---
  const calculateDefaulters = () => {
    if (!selectedMonth) return [];

    // 1. Fetch records matching selected Month
    let matchingRecords = records.filter(r => r.date.startsWith(selectedMonth));

    // 2. Apply optional filters
    if (selectedDept) {
      matchingRecords = matchingRecords.filter(r => r.department === selectedDept);
    }
    if (selectedSem) {
      matchingRecords = matchingRecords.filter(r => r.semester === selectedSem);
    }

    if (matchingRecords.length === 0) return [];

    // 3. Group records by Department + Semester + Subject
    const recordsGrouped: Record<string, { dept: string; sem: string; subj: string; records: AttendanceRecord[] }> = {};
    
    matchingRecords.forEach(r => {
      const key = `${r.department}_${r.semester}_${r.subject}`;
      if (!recordsGrouped[key]) {
        recordsGrouped[key] = { dept: r.department, sem: r.semester, subj: r.subject, records: [] };
      }
      recordsGrouped[key].records.push(r);
    });

    const list: Array<{
      rollNo: number;
      department: string;
      semester: string;
      subject: string;
      classesHeld: number;
      absences: number;
      rate: number;
    }> = [];

    // 4. For each group and student Roll Number 1-60, calculate rate
    Object.values(recordsGrouped).forEach(({ dept, sem, subj, records: groupRecords }) => {
      const L = groupRecords.length; // total lectures held
      
      for (let R = 1; R <= 60; R++) {
        let A = 0; // absences count
        
        groupRecords.forEach(rec => {
          const absList = rec.absentNos.split(",")
            .map(x => parseInt(x.trim(), 10))
            .filter(x => !isNaN(x));
          
          if (absList.includes(R)) {
            A++;
          }
        });

        const rate = parseFloat(((L - A) / L * 100).toFixed(1));
        if (rate < 75.0) {
          list.push({
            rollNo: R,
            department: dept,
            semester: sem,
            subject: subj,
            classesHeld: L,
            absences: A,
            rate
          });
        }
      }
    });

    // Sort by Department, Semester, Roll Number, Subject
    return list.sort((a, b) => {
      if (a.department !== b.department) return a.department.localeCompare(b.department);
      if (a.semester !== b.semester) return a.semester.localeCompare(b.semester);
      if (a.rollNo !== b.rollNo) return a.rollNo - b.rollNo;
      return a.subject.localeCompare(b.subject);
    });
  };

  const calculateAllDefaulters = (targetMonth: string) => {
    if (!targetMonth) return [];

    // 1. Fetch records matching selected Month
    const matchingRecords = records.filter(r => r.date.startsWith(targetMonth));
    if (matchingRecords.length === 0) return [];

    // 2. Group records by Department + Semester + Subject
    const recordsGrouped: Record<string, { dept: string; sem: string; subj: string; records: AttendanceRecord[] }> = {};
    
    matchingRecords.forEach(r => {
      const key = `${r.department}_${r.semester}_${r.subject}`;
      if (!recordsGrouped[key]) {
        recordsGrouped[key] = { dept: r.department, sem: r.semester, subj: r.subject, records: [] };
      }
      recordsGrouped[key].records.push(r);
    });

    const list: Array<{
      rollNo: number;
      department: string;
      semester: string;
      subject: string;
      classesHeld: number;
      absences: number;
      rate: number;
    }> = [];

    // 3. For each group and student Roll Number 1-60, calculate rate
    Object.values(recordsGrouped).forEach(({ dept, sem, subj, records: groupRecords }) => {
      const L = groupRecords.length; // total lectures held
      
      for (let R = 1; R <= 60; R++) {
        let A = 0; // absences count
        
        groupRecords.forEach(rec => {
          const absList = rec.absentNos.split(",")
            .map(x => parseInt(x.trim(), 10))
            .filter(x => !isNaN(x));
          
          if (absList.includes(R)) {
            A++;
          }
        });

        const rate = parseFloat(((L - A) / L * 100).toFixed(1));
        if (rate < 75.0) {
          list.push({
            rollNo: R,
            department: dept,
            semester: sem,
            subject: subj,
            classesHeld: L,
            absences: A,
            rate
          });
        }
      }
    });

    // Sort by Department, Semester, Roll Number, Subject
    return list.sort((a, b) => {
      if (a.department !== b.department) return a.department.localeCompare(b.department);
      if (a.semester !== b.semester) return a.semester.localeCompare(b.semester);
      if (a.rollNo !== b.rollNo) return a.rollNo - b.rollNo;
      return a.subject.localeCompare(b.subject);
    });
  };

  const defaultersList = calculateDefaulters();

  // --- EXPORT TO EXCEL ACTIONS ---

  const handleExportLogs = (exportType: "filtered" | "all") => {
    const targetRecords = exportType === "filtered" ? filteredRecords : records;
    if (targetRecords.length === 0) {
      alert("No data available to export.");
      return;
    }

    const payload = targetRecords.map(r => ({
      "Date": r.date,
      "Start Time": r.startTime,
      "End Time": r.endTime,
      "Staff Name": r.staffName,
      "Department": r.department,
      "Semester": r.semester,
      "Subject": r.subject,
      "Absent Roll Numbers": r.absentNos,
      "Total Absentees": r.absentNos ? r.absentNos.split(",").filter(x => x.trim() !== "").length : 0
    }));

    const worksheet = XLSX.utils.json_to_sheet(payload);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Logs");

    worksheet["!cols"] = [
      { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 22 }, 
      { wch: 22 }, { wch: 12 }, { wch: 25 }, { wch: 25 }, { wch: 15 }
    ];

    const prefix = exportType === "filtered" ? "Filtered" : "Master";
    XLSX.writeFile(workbook, `${prefix}_Attendance_Logs_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const handleExportDefaulters = (exportType: "filtered" | "all") => {
    let targetList;
    let filename;
    
    if (exportType === "filtered") {
      if (!selectedDept || !selectedSem) {
        alert("Please select Department and Semester first.");
        return;
      }
      targetList = defaultersList;
      filename = `Defaulters_${selectedDept.replace(/\s+/g, "_")}_${selectedSem.replace(/\s+/g, "_")}_${selectedMonth}.xlsx`;
    } else {
      // Calculate college-wide defaulters for the selected month
      targetList = calculateAllDefaulters(selectedMonth);
      filename = `Master_Defaulters_All_Depts_${selectedMonth}.xlsx`;
    }

    if (targetList.length === 0) {
      alert("No defaulter list available to export.");
      return;
    }

    const payload = targetList.map(d => ({
      "Roll Number": `Roll No ${d.rollNo}`,
      "Department": exportType === "filtered" ? selectedDept : d.department,
      "Semester": exportType === "filtered" ? selectedSem : d.semester,
      "Subject": d.subject,
      "Total Lectures": d.classesHeld,
      "Lectures Absent": d.absences,
      "Attendance Percentage": `${d.rate}%`
    }));

    const worksheet = XLSX.utils.json_to_sheet(payload);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Defaulters Report");

    worksheet["!cols"] = [
      { wch: 15 }, { wch: 22 }, { wch: 12 }, { wch: 25 }, 
      { wch: 15 }, { wch: 15 }, { wch: 20 }
    ];

    XLSX.writeFile(workbook, filename);
  };

  const getAbsenteeCount = (absentNosStr: string) => {
    if (!absentNosStr.trim()) return 0;
    return absentNosStr.split(",").filter(n => n.trim() !== "").length;
  };

  return (
    <div className="pd-page">
      {/* Page Heading */}
      <div className="pd-heading">
        <h2>Principal Analytics Dashboard</h2>
        <p className="subtitle" style={{ marginBottom: 0 }}>
          Real-time updates of class completion and student absence analytics.
        </p>
      </div>

      {error && (
        <div className="pd-error-banner">
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Cards Row */}
      <div className="dashboard-stats">
        <div className="stat-box">
          <div className="stat-icon">
            <Layers size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-number">{totalClasses}</span>
            <span className="stat-label">Classes Logged</span>
          </div>
        </div>

        <div className="stat-box stat-secondary">
          <div className="stat-icon">
            <Users size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-number">{totalAbsences}</span>
            <span className="stat-label">Total Absences</span>
          </div>
        </div>

        <div className="stat-box stat-success">
          <div className="stat-icon">
            <Percent size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-number">{attendanceRate}</span>
            <span className="stat-label">Attendance Rate</span>
          </div>
        </div>

        <div className="stat-box stat-warning">
          <div className="stat-icon">
            <Activity size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-number">{avgAbsences}</span>
            <span className="stat-label">Avg Absences/Class</span>
          </div>
        </div>

        <div className="stat-box stat-danger">
          <div className="stat-icon">
            <AlertCircle size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-number pd-dept-stat" title={highestAbsenceDept}>
              {highestAbsenceDept}
            </span>
            <span className="stat-label">Highest Absence Dept</span>
          </div>
        </div>
      </div>

      {/* Department Breakdown */}
      <div className="glass-card">
        <h3 className="pd-section-title">
          <TrendingDown size={18} style={{ color: "var(--accent-blue)", flexShrink: 0 }} />
          <span>Absences Registered by Department</span>
        </h3>
        <div className="department-list">
          {DEPARTMENTS.map((dept) => {
            const val = deptStats[dept] || 0;
            const percentage = Math.round((val / maxDeptAbsence) * 100);
            return (
              <div key={dept} className="dept-progress-card">
                <div className="dept-header">
                  <span className="dept-name">{dept}</span>
                  <span className="dept-stat-count">{val} Absences</span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-bar"
                    style={{
                      width: `${percentage}%`,
                      background: dept === "Computer Engineering" ? "var(--grad-primary)" : "linear-gradient(135deg, #10b981 0%, #3b82f6 100%)"
                    }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sub-Navigation and Data Section */}
      <div className="glass-card">
        {/* Tab Toggles */}
        <div className="admin-tab-container pd-section-tabs">
          <button
            className={`nav-btn ${section === "logs" ? "active" : ""}`}
            onClick={() => setSection("logs")}
          >
            <FileSpreadsheet size={16} />
            <span>Daily Attendance Logs</span>
          </button>
          <button
            className={`nav-btn ${section === "defaulters" ? "active" : ""}`}
            onClick={() => setSection("defaulters")}
          >
            <UserX size={16} />
            <span>Monthly Defaulter List (&lt; 75%)</span>
          </button>
        </div>

        {/* --- VIEW 1: DAILY ATTENDANCE LOGS --- */}
        {section === "logs" && (
          <>
            <h3 className="pd-section-title">
              <SlidersHorizontal size={18} style={{ color: "var(--accent-blue)", flexShrink: 0 }} />
              <span>Filter Logs</span>
            </h3>

            <div className="filters-panel">
              <div className="form-group">
                <label htmlFor="startDate" className="pd-filter-label">Start Date</label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pd-filter-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="endDate" className="pd-filter-label">End Date</label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pd-filter-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="filterDept" className="pd-filter-label">Department</label>
                <select
                  id="filterDept"
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value as Department)}
                  className="pd-filter-input"
                >
                  <option value="">All Departments</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="filterSem" className="pd-filter-label">Semester</label>
                <select
                  id="filterSem"
                  value={selectedSem}
                  onChange={(e) => setSelectedSem(e.target.value as Semester)}
                  className="pd-filter-input"
                >
                  <option value="">All Semesters</option>
                  {(selectedDept === "Science & Humanities" ? SEMESTERS.slice(0, 2) : SEMESTERS).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="filterSubject" className="pd-filter-label">Subject</label>
                <select
                  id="filterSubject"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="pd-filter-input"
                >
                  <option value="">All Subjects</option>
                  {subjectsList.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="searchStaff" className="pd-filter-label">Staff Name</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    id="searchStaff"
                    placeholder="Search staff..."
                    value={searchStaff}
                    onChange={(e) => setSearchStaff(e.target.value)}
                    className="pd-filter-input pd-search-input"
                  />
                  <Search
                    size={14}
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
            </div>

            <div className="dashboard-actions">
              <span className="pd-records-count">
                Showing {filteredRecords.length} of {records.length} records
              </span>
              <div className="pd-action-btns">
                <button
                  className="btn btn-secondary"
                  onClick={() => handleExportLogs("filtered")}
                  disabled={filteredRecords.length === 0}
                >
                  <Download size={16} />
                  <span>Export Filtered</span>
                </button>
                <button
                  className="btn btn-success"
                  onClick={() => handleExportLogs("all")}
                  disabled={records.length === 0}
                >
                  <FileSpreadsheet size={16} />
                  <span>Export Master Sheet</span>
                </button>
              </div>
            </div>

            <div className="pd-table-section">
              {loading ? (
                <div className="pd-loading">
                  <div className="spinner" style={{ marginBottom: "1rem" }}></div>
                  <span>Syncing logs with Firebase...</span>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="table-wrapper">
                  <div className="table-empty">
                    <FolderOpen size={48} />
                    <p style={{ fontWeight: 600, color: "var(--text-primary)" }}>No records match your filters.</p>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      Try adjusting the dates, dropdown selectors, or checking the search name.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Staff Name</th>
                        <th>Dept &amp; Sem</th>
                        <th>Subject / Course</th>
                        <th style={{ textAlign: "center" }}>Absentees</th>
                        <th>Absent Roll Nos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map((r, idx) => (
                        <tr key={r.id || idx}>
                          <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{r.date}</td>
                          <td className="pd-time-cell">
                            {r.startTime} - {r.endTime}
                          </td>
                          <td style={{ fontWeight: 500 }}>{r.staffName}</td>
                          <td>
                            <span className="pd-dept-text">{r.department}</span>
                            <span className="badge badge-purple pd-sem-badge">{r.semester}</span>
                          </td>
                          <td className="pd-subject-cell">{r.subject}</td>
                          <td style={{ textAlign: "center", fontWeight: "bold" }}>
                            <span
                              style={{
                                color: getAbsenteeCount(r.absentNos) > 0 ? "var(--accent-red)" : "var(--accent-green)",
                                backgroundColor: getAbsenteeCount(r.absentNos) > 0 ? "rgba(239, 68, 68, 0.08)" : "rgba(16, 185, 129, 0.08)",
                                padding: "0.25rem 0.5rem",
                                borderRadius: "4px"
                              }}
                            >
                              {getAbsenteeCount(r.absentNos)}
                            </span>
                          </td>
                          <td className="pd-absent-cell" title={r.absentNos}>
                            {r.absentNos || <span className="pd-none-text">None (100% Present)</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* --- VIEW 2: DEFAULTER STUDENT LIST (< 75%) --- */}
        {section === "defaulters" && (
          <>
            <h3 className="pd-section-title">
              <SlidersHorizontal size={18} style={{ color: "var(--accent-blue)", flexShrink: 0 }} />
              <span>Select Department, Semester &amp; Month</span>
            </h3>

            <div className="filters-panel">
              <div className="form-group">
                <label htmlFor="selectedMonth" className="pd-filter-label">Month</label>
                <input
                  type="month"
                  id="selectedMonth"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="pd-filter-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="defFilterDept" className="pd-filter-label">Department</label>
                <select
                  id="defFilterDept"
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value as Department)}
                  className="pd-filter-input"
                >
                  <option value="">-- Choose Department --</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="defFilterSem" className="pd-filter-label">Semester</label>
                <select
                  id="defFilterSem"
                  value={selectedSem}
                  onChange={(e) => setSelectedSem(e.target.value as Semester)}
                  className="pd-filter-input"
                >
                  <option value="">-- Choose Semester --</option>
                  {(selectedDept === "Science & Humanities" ? SEMESTERS.slice(0, 2) : SEMESTERS).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {!selectedMonth ? (
              <div className="table-wrapper">
                <div className="table-empty">
                  <UserX size={48} />
                  <p style={{ fontWeight: 600, color: "var(--text-primary)" }}>Provide filters to view defaulter report</p>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    You must select a Month to generate the student defaulter analytics.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="dashboard-actions">
                  <span className="pd-records-count">
                    Found {defaultersList.length} defaulters for {selectedDept || "All Departments"} ({selectedSem || "All Semesters"}) - {selectedMonth}
                  </span>
                  <div className="pd-action-btns">
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleExportDefaulters("filtered")}
                      disabled={defaultersList.length === 0}
                    >
                      <Download size={16} />
                      <span>Export Filtered Defaulters</span>
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleExportDefaulters("all")}
                    >
                      <FileSpreadsheet size={16} />
                      <span>Export Master Defaulters List</span>
                    </button>
                  </div>
                </div>

                <div className="pd-table-section">
                  {defaultersList.length === 0 ? (
                    <div className="table-wrapper">
                      <div className="table-empty" style={{ color: "var(--accent-green)" }}>
                        <FolderOpen size={48} />
                        <p style={{ fontWeight: 600 }}>No defaulter students found!</p>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                          All students have an attendance rate greater than or equal to 75% for this month.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            <th>Roll No</th>
                            <th>Department</th>
                            <th>Sem</th>
                            <th>Subject</th>
                            <th style={{ textAlign: "center" }}>Held</th>
                            <th style={{ textAlign: "center" }}>Absent</th>
                            <th style={{ textAlign: "center" }}>Rate</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {defaultersList.map((d, idx) => (
                            <tr key={idx} className="pd-defaulter-row">
                              <td style={{ fontWeight: 800 }}>#{d.rollNo}</td>
                              <td className="pd-dept-text">{d.department}</td>
                              <td>{d.semester}</td>
                              <td style={{ fontWeight: 600 }}>{d.subject}</td>
                              <td style={{ textAlign: "center", fontWeight: 500 }}>{d.classesHeld}</td>
                              <td style={{ textAlign: "center", fontWeight: 500 }}>{d.absences}</td>
                              <td style={{ textAlign: "center", fontWeight: "bold" }}>
                                <span className="pd-rate-badge">
                                  {d.rate}%
                                </span>
                              </td>
                              <td>
                                <span className="badge pd-defaulter-badge">
                                  &lt; 75%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};
export default PrincipalDashboard;

