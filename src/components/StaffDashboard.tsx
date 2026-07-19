import React, { useState, useEffect } from "react";
import { StaffForm } from "./StaffForm";
import { 
  subscribeToAttendanceRecords, 
  getStudentsCountMap,
  type AttendanceRecord, 
  type Staff 
} from "../firebase";
import { 
  ClipboardList, 
  BarChart3, 
  User, 
  Calendar, 
  Clock, 
  BookOpen, 
  TrendingUp, 
  AlertCircle,
  Download
} from "lucide-react";

interface StaffDashboardProps {
  loggedInStaff: Staff;
}

type TabType = "entry" | "stats" | "profile";

export const StaffDashboard: React.FC<StaffDashboardProps> = ({ loggedInStaff }) => {
  const [activeTab, setActiveTab] = useState<TabType>("entry");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [classSizes, setClassSizes] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Filter states
  const [filterDept, setFilterDept] = useState("");
  const [filterSem, setFilterSem] = useState("");
  const [filterSub, setFilterSub] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterLectureType, setFilterLectureType] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // Chart view mode state (for comparison chart card)
  const [chartViewMode, setChartViewMode] = useState<"subject" | "class">("subject");

  // Fetch all attendance records and student count map to calculate statistics in-memory
  useEffect(() => {
    // 1. Fetch class sizes map
    const loadClassSizes = async () => {
      try {
        const sizes = await getStudentsCountMap();
        setClassSizes(sizes);
      } catch (err) {
        console.error("Failed to load class sizes map:", err);
      }
    };
    loadClassSizes();

    // 2. Subscribe to attendance records
    const unsubscribe = subscribeToAttendanceRecords((allRecords) => {
      // Filter records that match this staff member's name
      const filtered = allRecords.filter(
        r => r.staffName.toLowerCase() === loggedInStaff.name.toLowerCase()
      );
      setRecords(filtered);
      setLoading(false);
    });
    
    return unsubscribe;
  }, [loggedInStaff.name]);

  // Dynamic filter lists based on actual logged history
  const uniqueDepts = Array.from(new Set(records.map(r => r.department))).sort();
  const uniqueSems = Array.from(new Set(records.map(r => r.semester))).sort();
  const uniqueSubs = Array.from(new Set(records.map(r => r.subject))).sort();
  const uniqueMonths = Array.from(
    new Set(
      records
        .map(r => {
          const parts = r.date.split("/");
          return parts.length === 3 ? parseInt(parts[1], 10) - 1 : null;
        })
        .filter((m): m is number => m !== null)
    )
  ).sort((a, b) => a - b);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Statistics calculations (always based on all records)
  const totalSessions = records.length;
  const totalLecturesCount = records.filter(r => (r.lectureType || "Lecture") === "Lecture").length;
  const totalPracticalsCount = records.filter(r => r.lectureType === "Practical").length;
  
  const totalAbsentees = records.reduce((acc, curr) => {
    const abs = curr.absentNos || "";
    if (!abs.trim()) return acc;
    return acc + abs.split(",").map(n => n.trim()).filter(Boolean).length;
  }, 0);
  const avgAbsentees = totalSessions > 0 ? (totalAbsentees / totalSessions).toFixed(1) : "0.0";

  // Monthly stats
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyLectures = records.filter(r => {
    const parts = r.date.split("/");
    if (parts.length === 3) {
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      return m === currentMonth && y === currentYear;
    }
    return false;
  }).length;

  // Date parsing utility for sorting (DD/MM/YYYY)
  const parseDateString = (dateStr: string): Date => {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
    return new Date(0);
  };

  // Filtered and sorted record list
  const filteredAndSortedRecords = records
    .filter(r => {
      if (filterDept && r.department !== filterDept) return false;
      if (filterSem && r.semester !== filterSem) return false;
      if (filterSub && r.subject !== filterSub) return false;
      if (filterLectureType && (r.lectureType || "Lecture") !== filterLectureType) return false;
      if (filterMonth !== "") {
        const parts = r.date.split("/");
        if (parts.length === 3) {
          const m = parseInt(parts[1], 10) - 1;
          if (m !== parseInt(filterMonth, 10)) return false;
        } else {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      const timeA = parseDateString(a.date).getTime();
      const timeB = parseDateString(b.date).getTime();
      return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
    });

  // --- SVG TREND LINE CALCULATIONS ---
  // Chronological attendance rate percentage for the last 8 lectures
  const chronologicalTrendRecords = [...records]
    .sort((a, b) => parseDateString(a.date).getTime() - parseDateString(b.date).getTime())
    .slice(-8); // Show trend of last 8 lectures

  const trendStats = chronologicalTrendRecords.map(r => {
    const key = `${r.department}_${r.semester}_${r.academicYear}`;
    const total = classSizes[key] || 15; // fallback to 15
    const absentNos = r.absentNos || "";
    const abs = absentNos.trim() ? absentNos.split(",").map(n => n.trim()).filter(Boolean).length : 0;
    const present = total - abs >= 0 ? total - abs : 0;
    const rate = Math.round((present / total) * 100);
    return {
      dateLabel: r.date.slice(0, 5), // DD/MM
      rate,
      subject: r.subject,
      classLabel: `${r.department.split(" ")[0]} Sem ${r.semester.slice(-1)}`
    };
  });

  // Calculate SVG Points for the trend graph
  const svgWidth = 500;
  const svgHeight = 160;
  const graphPaddingLeft = 35;
  const graphPaddingRight = 15;
  const graphPaddingTop = 15;
  const graphPaddingBottom = 25;

  const trendPoints = trendStats.map((item, index) => {
    const x = graphPaddingLeft + index * ((svgWidth - graphPaddingLeft - graphPaddingRight) / (trendStats.length - 1 || 1));
    // map 0% -> bottom, 100% -> top
    const y = svgHeight - graphPaddingBottom - (item.rate / 100) * (svgHeight - graphPaddingTop - graphPaddingBottom);
    return { x, y, ...item };
  });

  const trendLinePath = trendPoints.length > 0 
    ? `M ${trendPoints[0].x} ${trendPoints[0].y} ` + trendPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ")
    : "";

  const trendAreaPath = trendPoints.length > 0
    ? `${trendLinePath} L ${trendPoints[trendPoints.length - 1].x} ${svgHeight - graphPaddingBottom} L ${trendPoints[0].x} ${svgHeight - graphPaddingBottom} Z`
    : "";

  // --- SUBJECT-WISE ATTENDANCE STATS ---
  const subjectStatsList = uniqueSubs.map(sub => {
    const subRecords = records.filter(r => r.subject === sub);
    let totalSum = 0;
    let presentSum = 0;
    subRecords.forEach(r => {
      const key = `${r.department}_${r.semester}_${r.academicYear}`;
      const total = classSizes[key] || 15;
      const absentNos = r.absentNos || "";
      const abs = absentNos.trim() ? absentNos.split(",").map(n => n.trim()).filter(Boolean).length : 0;
      totalSum += total;
      presentSum += Math.max(0, total - abs);
    });
    const avgRate = totalSum > 0 ? Math.round((presentSum / totalSum) * 100) : 0;
    return { label: sub, rate: avgRate, count: subRecords.length };
  });

  // --- CLASS-WISE ATTENDANCE STATS ---
  const classStatsList: { label: string; fullLabel: string; rate: number; count: number }[] = [];
  uniqueDepts.forEach(dept => {
    const activeSems = uniqueSems.filter(sem => records.some(r => r.department === dept && r.semester === sem));
    activeSems.forEach(sem => {
      const classRecords = records.filter(r => r.department === dept && r.semester === sem);
      let totalSum = 0;
      let presentSum = 0;
      classRecords.forEach(r => {
        const key = `${r.department}_${r.semester}_${r.academicYear}`;
        const total = classSizes[key] || 15;
        const absentNos = r.absentNos || "";
        const abs = absentNos.trim() ? absentNos.split(",").map(n => n.trim()).filter(Boolean).length : 0;
        totalSum += total;
        presentSum += Math.max(0, total - abs);
      });
      const avgRate = totalSum > 0 ? Math.round((presentSum / totalSum) * 100) : 0;
      classStatsList.push({
        label: `${dept.split(" ")[0]} - Sem ${sem.slice(-1)}`,
        fullLabel: `${dept} (${sem})`,
        rate: avgRate,
        count: classRecords.length
      });
    });
  });

  // Export filtered list to CSV file
  const handleExportCSV = () => {
    if (filteredAndSortedRecords.length === 0) return;

    const headers = ["Date", "Department", "Semester", "Academic Year", "Subject", "Session Type", "Start Time", "End Time", "Absentees Count", "Absent Roll Numbers"];
    const rows = filteredAndSortedRecords.map(r => {
      const absentNos = r.absentNos || "";
      const absCount = absentNos.trim() 
        ? absentNos.split(",").map(n => n.trim()).filter(Boolean).length 
        : 0;
      return [
        r.date,
        `"${r.department.replace(/"/g, '""')}"`,
        `"${r.semester.replace(/"/g, '""')}"`,
        r.academicYear,
        `"${r.subject.replace(/"/g, '""')}"`,
        r.lectureType || "Lecture",
        r.startTime,
        r.endTime,
        absCount,
        `"${absentNos.replace(/"/g, '""')}"`
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    let filename = `attendance_report_${loggedInStaff.name.toLowerCase().replace(/\s+/g, "_")}`;
    if (filterDept) filename += `_${filterDept.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 8)}`;
    if (filterSem) filename += `_sem${filterSem.slice(-1)}`;
    if (filterSub) filename += `_${filterSub.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 10)}`;
    if (filterMonth !== "") filename += `_${monthNames[parseInt(filterMonth, 10)].toLowerCase()}`;
    filename += ".csv";

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="staff-dashboard-container">
      {/* Dashboard Sub-navigation Tabs */}
      <div className="staff-dashboard-tabs">
        <button
          className={`staff-tab-button ${activeTab === "entry" ? "active" : ""}`}
          onClick={() => setActiveTab("entry")}
        >
          <ClipboardList size={18} />
          <span>Daily Attendance Entry</span>
        </button>
        <button
          className={`staff-tab-button ${activeTab === "stats" ? "active" : ""}`}
          onClick={() => setActiveTab("stats")}
        >
          <BarChart3 size={18} />
          <span>Statistics & History</span>
        </button>
        <button
          className={`staff-tab-button ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          <User size={18} />
          <span>My Profile</span>
        </button>
      </div>

      {/* Dashboard Views */}
      <div className="staff-dashboard-content">
        {activeTab === "entry" && (
          <div className="staff-view-card">
            <StaffForm loggedInStaff={loggedInStaff} />
          </div>
        )}

        {activeTab === "stats" && (
          <div className="staff-view-card">
            <h2 className="section-title">My Statistics & Lecture Logs</h2>
            
            {/* Stats Metrics Grid */}
            <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
              <div className="stats-card" style={{ background: "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(37, 99, 235, 0.08) 100%)", borderColor: "rgba(59, 130, 246, 0.25)" }}>
                <div className="stats-card-icon lectures" style={{ color: "#3b82f6" }}>
                  <Calendar size={24} />
                </div>
                <div className="stats-card-info">
                  <h3>Lectures Logged</h3>
                  <p className="stats-value">{totalLecturesCount}</p>
                </div>
              </div>

              <div className="stats-card" style={{ background: "linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(234, 88, 12, 0.08) 100%)", borderColor: "rgba(249, 115, 22, 0.25)" }}>
                <div className="stats-card-icon practicals" style={{ color: "#f97316" }}>
                  <ClipboardList size={24} />
                </div>
                <div className="stats-card-info">
                  <h3>Practicals Logged</h3>
                  <p className="stats-value">{totalPracticalsCount}</p>
                </div>
              </div>

              <div className="stats-card">
                <div className="stats-card-icon monthly">
                  <TrendingUp size={24} />
                </div>
                <div className="stats-card-info">
                  <h3>Logs This Month</h3>
                  <p className="stats-value">{monthlyLectures}</p>
                </div>
              </div>

              <div className="stats-card">
                <div className="stats-card-icon absentees">
                  <AlertCircle size={24} />
                </div>
                <div className="stats-card-info">
                  <h3>Avg. Absentees / Session</h3>
                  <p className="stats-value">{avgAbsentees}</p>
                </div>
              </div>
            </div>

            {/* Visual Graphs Dashboard Grid */}
            {records.length > 0 && (
              <div className="dashboard-charts-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem", marginTop: "1.5rem" }}>
                
                {/* Chart 1: Attendance Rate Trend (SVG Line/Area Chart) */}
                <div className="chart-panel-card">
                  <div className="chart-panel-header">
                    <h3 className="chart-panel-title">Attendance Rate Trend</h3>
                    <span className="chart-panel-subtitle">Last 8 Conducted Lectures</span>
                  </div>
                  
                  {trendStats.length === 0 ? (
                    <div className="chart-empty-placeholder" style={{ height: "160px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No data points available yet.</p>
                    </div>
                  ) : (
                    <div className="chart-svg-container" style={{ position: "relative", width: "100%", height: "170px", marginTop: "1rem" }}>
                      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" height="100%">
                        <defs>
                          <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--accent-blue)" stopOpacity="0.25"/>
                            <stop offset="100%" stopColor="var(--accent-blue)" stopOpacity="0.00"/>
                          </linearGradient>
                        </defs>

                        {/* Y-Axis Gridlines & Labels */}
                        {[0, 25, 50, 75, 100].map((level) => {
                          const yPos = svgHeight - graphPaddingBottom - (level / 100) * (svgHeight - graphPaddingTop - graphPaddingBottom);
                          return (
                            <g key={level} className="gridline-group">
                              <line 
                                x1={graphPaddingLeft} 
                                y1={yPos} 
                                x2={svgWidth - graphPaddingRight} 
                                y2={yPos} 
                                stroke="var(--border-color)" 
                                strokeWidth="0.8"
                                strokeDasharray="3 3"
                              />
                              <text 
                                x={graphPaddingLeft - 8} 
                                y={yPos + 3} 
                                fontSize="9px" 
                                fill="var(--text-muted)" 
                                textAnchor="end"
                                fontWeight="600"
                              >
                                {level}%
                              </text>
                            </g>
                          );
                        })}

                        {/* Area Shading Under Path */}
                        {trendPoints.length > 1 && (
                          <path d={trendAreaPath} fill="url(#chart-area-grad)" />
                        )}

                        {/* Line Path */}
                        {trendPoints.length > 1 && (
                          <path 
                            d={trendLinePath} 
                            fill="none" 
                            stroke="var(--accent-blue)" 
                            strokeWidth="2.5" 
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        )}

                        {/* Interactive Data Point Markers */}
                        {trendPoints.map((pt, i) => (
                          <g key={i} className="chart-marker-group">
                            <circle 
                              cx={pt.x} 
                              cy={pt.y} 
                              r="4.5" 
                              fill="var(--card-bg)" 
                              stroke="var(--accent-blue)" 
                              strokeWidth="2.5" 
                            />
                            <text 
                              x={pt.x} 
                              y={pt.y - 8} 
                              fontSize="9px" 
                              fontWeight="800" 
                              fill="var(--text-primary)" 
                              textAnchor="middle"
                            >
                              {pt.rate}%
                            </text>
                            {/* X-axis date labels */}
                            <text 
                              x={pt.x} 
                              y={svgHeight - 8} 
                              fontSize="9px" 
                              fill="var(--text-secondary)" 
                              textAnchor="middle"
                              fontWeight="600"
                            >
                              {pt.dateLabel}
                            </text>
                            {/* SVG Tooltip hover details */}
                            <title>{`${pt.subject}\n${pt.classLabel}\nAttendance: ${pt.rate}%`}</title>
                          </g>
                        ))}
                      </svg>
                    </div>
                  )}
                </div>

                {/* Chart 2: Classroom & Subject Performance Analysis */}
                <div className="chart-panel-card">
                  <div className="chart-panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "none", paddingBottom: 0 }}>
                    <div>
                      <h3 className="chart-panel-title">Attendance Analysis</h3>
                      <span className="chart-panel-subtitle">Average Attendance Rates</span>
                    </div>
                    {/* Toggle Selector */}
                    <div className="chart-toggle-switch" style={{ display: "flex", backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid var(--border-color)", padding: "0.2rem", borderRadius: "8px", gap: "0.2rem" }}>
                      <button 
                        onClick={() => setChartViewMode("subject")}
                        className={`chart-switch-btn ${chartViewMode === "subject" ? "active" : ""}`}
                        style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem", border: "none", borderRadius: "6px", background: chartViewMode === "subject" ? "rgba(59, 130, 246, 0.15)" : "transparent", color: chartViewMode === "subject" ? "var(--accent-blue)" : "var(--text-muted)", cursor: "pointer", fontWeight: 700 }}
                      >
                        By Subject
                      </button>
                      <button 
                        onClick={() => setChartViewMode("class")}
                        className={`chart-switch-btn ${chartViewMode === "class" ? "active" : ""}`}
                        style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem", border: "none", borderRadius: "6px", background: chartViewMode === "class" ? "rgba(59, 130, 246, 0.15)" : "transparent", color: chartViewMode === "class" ? "var(--accent-blue)" : "var(--text-muted)", cursor: "pointer", fontWeight: 700 }}
                      >
                        By Class
                      </button>
                    </div>
                  </div>

                  <div className="chart-bar-list" style={{ marginTop: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {chartViewMode === "subject" ? (
                      subjectStatsList.length === 0 ? (
                        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center", padding: "2rem" }}>No subject records available.</p>
                      ) : (
                        subjectStatsList.slice(0, 4).map((sub, idx) => {
                          const barColorClass = sub.rate >= 85 ? "green" : sub.rate >= 70 ? "yellow" : "red";
                          return (
                            <div key={idx} className="bar-stat-row">
                              <div className="bar-stat-info" style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "0.2rem" }}>
                                <span className="bar-stat-label" style={{ fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "70%" }} title={sub.label}>{sub.label}</span>
                                <span className="bar-stat-percent" style={{ fontWeight: 800, color: `var(--accent-${barColorClass})` }}>{sub.rate}% <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 500 }}>({sub.count} L)</span></span>
                              </div>
                              <div className="bar-track" style={{ width: "100%", height: "8px", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "4px", overflow: "hidden" }}>
                                <div className={`bar-fill ${barColorClass}`} style={{ width: `${sub.rate}%`, height: "100%", borderRadius: "4px", transition: "width 0.5s ease-in-out" }}></div>
                              </div>
                            </div>
                          );
                        })
                      )
                    ) : (
                      classStatsList.length === 0 ? (
                        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center", padding: "2rem" }}>No class records available.</p>
                      ) : (
                        classStatsList.slice(0, 4).map((cls, idx) => {
                          const barColorClass = cls.rate >= 85 ? "green" : cls.rate >= 70 ? "yellow" : "red";
                          return (
                            <div key={idx} className="bar-stat-row">
                              <div className="bar-stat-info" style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "0.2rem" }}>
                                <span className="bar-stat-label" style={{ fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "70%" }} title={cls.fullLabel}>{cls.label}</span>
                                <span className="bar-stat-percent" style={{ fontWeight: 800, color: `var(--accent-${barColorClass})` }}>{cls.rate}% <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 500 }}>({cls.count} L)</span></span>
                              </div>
                              <div className="bar-track" style={{ width: "100%", height: "8px", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "4px", overflow: "hidden" }}>
                                <div className={`bar-fill ${barColorClass}`} style={{ width: `${cls.rate}%`, height: "100%", borderRadius: "4px", transition: "width 0.5s ease-in-out" }}></div>
                              </div>
                            </div>
                          );
                        })
                      )
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* Lecture History Log List */}
            <div className="history-section" style={{ marginTop: "2.5rem" }}>
              <div className="history-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
                <h3 className="sub-section-title" style={{ margin: 0 }}>Recent Lecture History</h3>
                {filteredAndSortedRecords.length > 0 && (
                  <button 
                    onClick={handleExportCSV} 
                    className="btn btn-secondary btn-export"
                    style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", fontSize: "0.85rem" }}
                  >
                    <Download size={16} />
                    <span>Export Report (CSV)</span>
                  </button>
                )}
              </div>

              {/* Advanced Filter Bar */}
              {records.length > 0 && (
                <div className="history-filters-bar">
                  <div className="filter-item">
                    <label>Class Department</label>
                    <select 
                      value={filterDept} 
                      onChange={(e) => setFilterDept(e.target.value)}
                      className="form-control filter-select"
                    >
                      <option value="">All Departments</option>
                      {uniqueDepts.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div className="filter-item">
                    <label>Semester</label>
                    <select 
                      value={filterSem} 
                      onChange={(e) => setFilterSem(e.target.value)}
                      className="form-control filter-select"
                    >
                      <option value="">All Semesters</option>
                      {uniqueSems.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="filter-item">
                    <label>Subject</label>
                    <select 
                      value={filterSub} 
                      onChange={(e) => setFilterSub(e.target.value)}
                      className="form-control filter-select"
                    >
                      <option value="">All Subjects</option>
                      {uniqueSubs.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="filter-item">
                    <label>Session Type</label>
                    <select 
                      value={filterLectureType} 
                      onChange={(e) => setFilterLectureType(e.target.value)}
                      className="form-control filter-select"
                    >
                      <option value="">All Session Types</option>
                      <option value="Lecture">Lectures Only</option>
                      <option value="Practical">Practicals Only</option>
                    </select>
                  </div>

                  <div className="filter-item">
                    <label>Month</label>
                    <select 
                      value={filterMonth} 
                      onChange={(e) => setFilterMonth(e.target.value)}
                      className="form-control filter-select"
                    >
                      <option value="">All Months</option>
                      {uniqueMonths.map(m => (
                        <option key={m} value={m}>{monthNames[m]}</option>
                      ))}
                    </select>
                  </div>

                  <div className="filter-item">
                    <label>Sort Date</label>
                    <select 
                      value={sortOrder} 
                      onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
                      className="form-control filter-select"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                    </select>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="roster-loading-container" style={{ padding: "3rem" }}>
                  <div className="spinner"></div>
                  <p style={{ marginTop: "1rem" }}>Loading history logs...</p>
                </div>
              ) : records.length === 0 ? (
                <div className="no-records-card" style={{ textAlign: "center", padding: "3rem", border: "1.5px dashed var(--border-color)", borderRadius: "12px", backgroundColor: "rgba(255,255,255,0.01)" }}>
                  <BookOpen size={40} style={{ color: "var(--text-muted)", marginBottom: "1rem" }} />
                  <p style={{ color: "var(--text-muted)", margin: 0 }}>You haven't logged any attendance records yet.</p>
                </div>
              ) : filteredAndSortedRecords.length === 0 ? (
                <div className="no-records-card" style={{ textAlign: "center", padding: "3rem", border: "1.5px dashed var(--border-color)", borderRadius: "12px", backgroundColor: "rgba(255,255,255,0.01)" }}>
                  <AlertCircle size={40} style={{ color: "var(--text-muted)", marginBottom: "1rem" }} />
                  <p style={{ color: "var(--text-muted)", margin: 0 }}>No records found matching the selected filters.</p>
                </div>
              ) : (
                <div className="history-table-wrapper" style={{ overflowX: "auto" }}>
                  <table className="history-table" style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Class Details</th>
                        <th>Subject</th>
                        <th>Timing</th>
                        <th>Absentees Count</th>
                        <th>Absent Roll Numbers</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAndSortedRecords.map((r) => {
                        const absentNos = r.absentNos || "";
                        const absCount = absentNos.trim() 
                          ? absentNos.split(",").map(n => n.trim()).filter(Boolean).length 
                          : 0;
                        return (
                          <tr key={r.id}>
                            <td className="date-cell">{r.date}</td>
                            <td>
                              <span className="dept-badge">{r.department}</span>
                              <div className="sem-subtext">{r.semester} ({r.academicYear})</div>
                            </td>
                            <td className="subject-cell">
                              <div>{r.subject}</div>
                              {r.lectureType && (
                                <span style={{ 
                                  display: "inline-block", 
                                  fontSize: "0.65rem", 
                                  padding: "0.1rem 0.35rem", 
                                  borderRadius: "4px", 
                                  marginTop: "0.25rem", 
                                  fontWeight: 700,
                                  textTransform: "uppercase",
                                  color: r.lectureType === "Practical" ? "#f97316" : "#3b82f6", 
                                  backgroundColor: r.lectureType === "Practical" ? "rgba(249, 115, 22, 0.08)" : "rgba(59, 130, 246, 0.08)" 
                                }}>
                                  {r.lectureType}
                                </span>
                              )}
                            </td>
                            <td className="time-cell">
                              <Clock size={12} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                              <span>{r.startTime} - {r.endTime}</span>
                            </td>
                            <td>
                              <span className={`abs-badge ${absCount > 0 ? "has-abs" : "zero-abs"}`}>
                                {absCount} Absent
                              </span>
                            </td>
                            <td className="roll-nos-cell" title={r.absentNos || "All Present"}>
                              {r.absentNos || <em style={{ color: "var(--accent-green)" }}>All Present</em>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "profile" && (
          <div className="staff-view-card">
            <h2 className="section-title">My Profile</h2>
            
            <div className="profile-card">
              <div className="profile-header">
                <div className="profile-avatar">
                  {loggedInStaff.name.charAt(0).toUpperCase()}
                </div>
                <div className="profile-title">
                  <h3>{loggedInStaff.name}</h3>
                  <span className="profile-role-badge">Faculty Member</span>
                </div>
              </div>

              <div className="profile-details-grid">
                <div className="profile-detail-item">
                  <span className="detail-label">Email Address</span>
                  <span className="detail-value">{loggedInStaff.email || "N/A"}</span>
                </div>
                
                <div className="profile-detail-item">
                  <span className="detail-label">Designated Department</span>
                  <span className="detail-value">{loggedInStaff.department}</span>
                </div>

                <div className="profile-detail-item">
                  <span className="detail-label">Registered Password</span>
                  <span className="detail-value" style={{ fontFamily: "monospace", letterSpacing: "1px" }}>
                    {loggedInStaff.password}
                  </span>
                </div>

                <div className="profile-detail-item">
                  <span className="detail-label">Academic Access</span>
                  <span className="detail-value">SMV ICRE Attendance System Portal</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
