import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { 
  getPrincipals, 
  addPrincipal, 
  deletePrincipal, 
  getStaff, 
  addStaff, 
  deleteStaff, 
  updateStaff,
  resetStaffToPDFData,
  getSubjects, 
  addSubject, 
  deleteSubject,
  updateSubject,
  getStudents,
  addStudent,
  updateStudent,
  deleteStudent,
  addStudentsBatch,
  subscribeToSystemSettings,
  updateSystemSettings,
  type Principal,
  type Staff,
  type SubjectItem,
  type Student
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
  X,
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Download,
  RefreshCw,
  GraduationCap,
  Lock,
  Unlock
} from "lucide-react";

export const SuperAdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"principals" | "staff" | "subjects" | "students">("principals");
  const [dateLocked, setDateLocked] = useState(false);

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
  const [syncingStaff, setSyncingStaff] = useState(false);

  // Staff Editing State
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [editingStaffName, setEditingStaffName] = useState("");
  const [editingStaffDept, setEditingStaffDept] = useState<Department | "">("");
  const [editingStaffEmail, setEditingStaffEmail] = useState("");
  const [editingStaffPassword, setEditingStaffPassword] = useState("");

  // Excel Import State
  type ImportRow = { name: string; department: string; valid: boolean; reason?: string };
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [importUploading, setImportUploading] = useState(false);
  const [importDone, setImportDone] = useState<{ added: number; skipped: number } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  // Subjects State
  const [subjectsList, setSubjectsList] = useState<SubjectItem[]>([]);
  const [subName, setSubName] = useState("");
  const [subDept, setSubDept] = useState<Department | "">("");
  const [subSem, setSubSem] = useState<Semester | "">("");
  const [subError, setSubError] = useState<string | null>(null);
  const [subSuccess, setSubSuccess] = useState(false);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editingSubName, setEditingSubName] = useState("");

  // Reset semester if department changes to Science & Humanities and semester is > Sem 2
  useEffect(() => {
    if (subDept === "Science & Humanities" && subSem !== "" && subSem !== "Semester 1" && subSem !== "Semester 2") {
      setSubSem("");
    }
  }, [subDept, subSem]);

  // Students State
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [studentDept, setStudentDept] = useState<Department | "">("");
  const [studentSem, setStudentSem] = useState<Semester | "">("");
  const [studentYear, setStudentYear] = useState("");
  const [studRollNo, setStudRollNo] = useState("");
  const [studName, setStudName] = useState("");
  const [studError, setStudError] = useState<string | null>(null);
  const [studSuccess, setStudSuccess] = useState(false);

  // Student Editing State
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingStudentRollNo, setEditingStudentRollNo] = useState("");
  const [editingStudentName, setEditingStudentName] = useState("");

  // Student Excel Import State
  const [studImportRows, setStudImportRows] = useState<{ rollNo: string; name: string; valid: boolean; reason?: string }[]>([]);
  const [studImportUploading, setStudImportUploading] = useState(false);
  const [studImportDone, setStudImportDone] = useState<{ added: number; skipped: number } | null>(null);
  const [studImportError, setStudImportError] = useState<string | null>(null);
  const studImportFileRef = useRef<HTMLInputElement>(null);

  // Smart Academic Year initializer for Student Tab
  useEffect(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-11
    let defaultYear = "";
    if (currentYear >= 2027) {
      defaultYear = `${currentYear}-${currentYear + 1}`;
    } else {
      if (currentMonth < 5) {
        defaultYear = `${currentYear - 1}-${currentYear}`;
      } else {
        defaultYear = `${currentYear}-${currentYear + 1}`;
      }
    }
    setStudentYear(defaultYear);
  }, []);

  // Subscribe to shared date lock setting
  useEffect(() => {
    const unsubscribe = subscribeToSystemSettings((settings) => {
      setDateLocked(settings.dateLocked);
    });
    return () => unsubscribe();
  }, []);

  const handleToggleDateLock = async () => {
    try {
      await updateSystemSettings({ dateLocked: !dateLocked });
    } catch (e) {
      console.error("Failed to toggle date constraint:", e);
    }
  };

  // Reset student semester if department changes to Science & Humanities and semester is > Sem 2
  useEffect(() => {
    if (studentDept === "Science & Humanities" && studentSem !== "" && studentSem !== "Semester 1" && studentSem !== "Semester 2") {
      setStudentSem("");
    }
  }, [studentDept, studentSem]);

  // Loaders
  const [loading, setLoading] = useState(false);

  // Load lists when tabs change or filters update
  useEffect(() => {
    loadData();
  }, [activeTab, staffFilterDept, subDept, subSem, studentDept, studentSem, studentYear]);

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
      } else if (activeTab === "students") {
        if (studentDept && studentSem && studentYear) {
          const data = await getStudents(studentDept, studentSem, studentYear);
          setStudentsList(data);
        } else {
          setStudentsList([]);
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

  const handleResetStaffToPDF = async () => {
    if (!window.confirm("WARNING: This will replace the entire active staff collection (both simulated and Firestore if configured) with the 50 staff records from the PDF. Email addresses will be generated from Short Names and unique deterministic passwords will be created. Do you want to proceed?")) {
      return;
    }
    setSyncingStaff(true);
    setSError(null);
    setSSuccess(false);
    try {
      await resetStaffToPDFData();
      alert("Successfully synced all staff members with PDF data!");
      loadData();
    } catch (err: any) {
      setSError(err.message || "Failed to sync staff with PDF data.");
    } finally {
      setSyncingStaff(false);
    }
  };

  const handleEditStaffStart = (s: Staff) => {
    setEditingStaffId(s.id!);
    setEditingStaffName(s.name);
    setEditingStaffDept(s.department as Department);
    setEditingStaffEmail(s.email || "");
    setEditingStaffPassword(s.password || "");
  };

  const handleEditStaffCancel = () => {
    setEditingStaffId(null);
    setEditingStaffName("");
    setEditingStaffDept("");
    setEditingStaffEmail("");
    setEditingStaffPassword("");
  };

  const handleSaveStaffEdit = async (id: string) => {
    if (!editingStaffName.trim() || !editingStaffDept || !editingStaffEmail.trim() || !editingStaffPassword.trim()) {
      alert("All fields are required to update staff credentials.");
      return;
    }
    try {
      await updateStaff(id, editingStaffName, editingStaffDept, editingStaffEmail, editingStaffPassword);
      setEditingStaffId(null);
      setEditingStaffName("");
      setEditingStaffDept("");
      setEditingStaffEmail("");
      setEditingStaffPassword("");
      loadData();
    } catch (err: any) {
      alert("Error updating staff credentials: " + err.message);
    }
  };

  // Excel Import Handler
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportDone(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedExts = [".xlsx", ".xls", ".csv"];
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (!allowedExts.includes(ext)) {
      setImportError("Please upload a valid Excel file (.xlsx, .xls) or CSV (.csv).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const raw: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (raw.length === 0) {
          setImportError("The sheet appears to be empty. Please check the file.");
          return;
        }

        // Normalise column names — case-insensitive header matching
        const normalise = (val: any) => String(val ?? "").trim();
        const findCol = (row: any, ...keys: string[]) => {
          const rowKeys = Object.keys(row);
          for (const k of keys) {
            const match = rowKeys.find(rk => rk.toLowerCase().replace(/\s+/g, "") === k.toLowerCase().replace(/\s+/g, ""));
            if (match) return normalise(row[match]);
          }
          return "";
        };

        const parsed: ImportRow[] = raw.map((row) => {
          const name = findCol(row, "staffname", "name", "staff", "staffmember");
          const dept = findCol(row, "department", "dept", "departmentname");

          if (!name) return { name, department: dept, valid: false, reason: "Staff name is missing" };
          if (!dept) return { name, department: dept, valid: false, reason: "Department is missing" };

          const matchedDept = DEPARTMENTS.find(
            d => d.toLowerCase() === dept.toLowerCase()
          );
          if (!matchedDept) {
            return { name, department: dept, valid: false, reason: `"${dept}" is not a valid department` };
          }

          return { name, department: matchedDept, valid: true };
        });

        setImportRows(parsed);
      } catch (err: any) {
        setImportError("Failed to parse the file: " + (err.message || "Unknown error"));
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmImport = async () => {
    const validRows = importRows.filter(r => r.valid);
    if (validRows.length === 0) {
      setImportError("No valid rows to import.");
      return;
    }
    setImportUploading(true);
    setImportError(null);
    let added = 0;
    let skipped = 0;
    for (const row of validRows) {
      try {
        await addStaff(row.name, row.department as Department);
        added++;
      } catch {
        skipped++;
      }
    }
    setImportUploading(false);
    setImportDone({ added, skipped });
    setImportRows([]);
    if (importFileRef.current) importFileRef.current.value = "";
    loadData();
  };

  const handleClearImport = () => {
    setImportRows([]);
    setImportDone(null);
    setImportError(null);
    if (importFileRef.current) importFileRef.current.value = "";
  };

  const downloadTemplate = () => {
    const templateData = [
      { "Staff Name": "Prof. Amit Patil", "Department": "Computer Engineering" },
      { "Staff Name": "Prof. Priya Sharma", "Department": "Electronics & Tele. Comm. Engineering" },
      { "Staff Name": "Prof. Rahul Desai", "Department": "Mechanical Engineering" },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    ws["!cols"] = [{ wch: 30 }, { wch: 35 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Staff Import Template");
    XLSX.writeFile(wb, "Staff_Import_Template.xlsx");
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

  // Students handlers
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudError(null);
    setStudSuccess(false);
    if (!studRollNo.trim() || !studName.trim() || !studentDept || !studentSem || !studentYear) {
      setStudError("Please select a class and provide Roll No and Name.");
      return;
    }

    try {
      await addStudent(studRollNo, studName, studentDept, studentSem, studentYear);
      setStudRollNo("");
      setStudName("");
      setStudSuccess(true);
      loadData();
    } catch (err: any) {
      setStudError(err.message || "Failed to add student.");
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete student "${name}"?`)) return;
    try {
      await deleteStudent(id);
      loadData();
    } catch (err: any) {
      alert("Error deleting student: " + err.message);
    }
  };

  const handleEditStudentStart = (s: Student) => {
    setEditingStudentId(s.id!);
    setEditingStudentRollNo(s.rollNo);
    setEditingStudentName(s.name);
  };

  const handleEditStudentCancel = () => {
    setEditingStudentId(null);
    setEditingStudentRollNo("");
    setEditingStudentName("");
  };

  const handleSaveStudentEdit = async (id: string) => {
    if (!editingStudentRollNo.trim() || !editingStudentName.trim()) {
      alert("Roll No and Name cannot be empty.");
      return;
    }
    try {
      await updateStudent(id, editingStudentRollNo, editingStudentName);
      setEditingStudentId(null);
      setEditingStudentRollNo("");
      setEditingStudentName("");
      loadData();
    } catch (err: any) {
      alert("Error updating student: " + err.message);
    }
  };

  const downloadStudentTemplate = () => {
    const templateData = [
      { 
        "Roll No": "1", 
        "Student Name": "John Doe", 
        "Department": "Computer Engineering", 
        "Semester": "Semester 3", 
        "Academic Year": "2026-2027" 
      },
      { 
        "Roll No": "2", 
        "Student Name": "Jane Smith", 
        "Department": "Computer Engineering", 
        "Semester": "Semester 3", 
        "Academic Year": "2026-2027" 
      },
      { 
        "Roll No": "1", 
        "Student Name": "Rahul Patil", 
        "Department": "Mechanical Engineering", 
        "Semester": "Semester 1", 
        "Academic Year": "2026-2027" 
      },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    ws["!cols"] = [
      { wch: 10 }, 
      { wch: 25 }, 
      { wch: 30 }, 
      { wch: 15 }, 
      { wch: 15 }
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Student Import Template");
    XLSX.writeFile(wb, "Student_Import_Template.xlsx");
  };

  const handleImportStudentFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStudImportError(null);
    setStudImportDone(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedExts = [".xlsx", ".xls", ".csv"];
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (!allowedExts.includes(ext)) {
      setStudImportError("Please upload a valid Excel file (.xlsx, .xls) or CSV (.csv).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const raw: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (raw.length === 0) {
          setStudImportError("The sheet appears to be empty.");
          return;
        }

        const normalise = (val: any) => String(val ?? "").trim();
        const findCol = (row: any, ...keys: string[]) => {
          const rowKeys = Object.keys(row);
          for (const k of keys) {
            const match = rowKeys.find(rk => rk.toLowerCase().replace(/\s+/g, "") === k.toLowerCase().replace(/\s+/g, ""));
            if (match) return normalise(row[match]);
          }
          return "";
        };

        const parsed = raw.map((row) => {
          const rollNo = findCol(row, "rollno", "roll", "rno", "number");
          const name = findCol(row, "studentname", "name", "student", "fullname");
          const department = findCol(row, "department", "dept", "branch");
          const semester = findCol(row, "semester", "sem");
          const academicYear = findCol(row, "academicyear", "year", "ay");

          const finalDept = (department || studentDept) as Department;
          const finalSem = (semester || studentSem) as Semester;
          const finalYear = academicYear || studentYear;

          if (!rollNo) return { rollNo, name, department: finalDept, semester: finalSem, academicYear: finalYear, valid: false, reason: "Roll No is missing" };
          if (!name) return { rollNo, name, department: finalDept, semester: finalSem, academicYear: finalYear, valid: false, reason: "Student name is missing" };
          if (!finalDept) return { rollNo, name, department: finalDept, semester: finalSem, academicYear: finalYear, valid: false, reason: "Department is missing (select in UI or add column)" };
          if (!finalSem) return { rollNo, name, department: finalDept, semester: finalSem, academicYear: finalYear, valid: false, reason: "Semester is missing (select in UI or add column)" };
          if (!finalYear) return { rollNo, name, department: finalDept, semester: finalSem, academicYear: finalYear, valid: false, reason: "Academic Year is missing (select in UI or add column)" };

          if (!DEPARTMENTS.includes(finalDept) || finalDept === "Science & Humanities") {
            return { rollNo, name, department: finalDept, semester: finalSem, academicYear: finalYear, valid: false, reason: `Invalid or excluded department: "${finalDept}"` };
          }
          if (!SEMESTERS.includes(finalSem)) {
            return { rollNo, name, department: finalDept, semester: finalSem, academicYear: finalYear, valid: false, reason: `Invalid semester: "${finalSem}"` };
          }

          return { rollNo, name, department: finalDept, semester: finalSem, academicYear: finalYear, valid: true };
        });

        // Check duplicate roll numbers inside the file itself for each class grouping
        const seenClassRolls = new Set<string>();
        const validated = parsed.map((item) => {
          if (!item.valid) return item;
          const compoundKey = `${item.department.toLowerCase()}_${item.semester.toLowerCase()}_${item.academicYear.toLowerCase()}_${item.rollNo.toLowerCase()}`;
          if (seenClassRolls.has(compoundKey)) {
            return { ...item, valid: false, reason: `Duplicate Roll No "${item.rollNo}" for this class in file` };
          }
          seenClassRolls.add(compoundKey);
          return item;
        });

        setStudImportRows(validated);
      } catch (err: any) {
        setStudImportError("Failed to parse file: " + (err.message || "Unknown error"));
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmStudentImport = async () => {
    const validRows = studImportRows.filter(r => r.valid);
    if (validRows.length === 0) {
      setStudImportError("No valid rows to import.");
      return;
    }
    setStudImportUploading(true);
    setStudImportError(null);

    const studentsToImport = validRows.map(row => ({
      rollNo: row.rollNo,
      name: row.name,
      department: row.department,
      semester: row.semester,
      academicYear: row.academicYear
    }));

    let added = 0;
    let skipped = 0;

    try {
      // Group students by class to fetch existing roll numbers in batches
      const groups: Record<string, typeof studentsToImport> = {};
      studentsToImport.forEach(s => {
        const classKey = `${s.department}|${s.semester}|${s.academicYear}`;
        if (!groups[classKey]) groups[classKey] = [];
        groups[classKey].push(s);
      });

      const finalImportList: typeof studentsToImport = [];

      for (const classKey of Object.keys(groups)) {
        const [dept, sem, year] = classKey.split("|");
        const existingList = await getStudents(dept, sem, year);
        const existingRolls = new Set(existingList.map(s => s.rollNo.toLowerCase()));

        groups[classKey].forEach(s => {
          if (existingRolls.has(s.rollNo.toLowerCase())) {
            skipped++;
          } else {
            finalImportList.push(s);
          }
        });
      }

      if (finalImportList.length > 0) {
        await addStudentsBatch(finalImportList);
        added += finalImportList.length;
      }
    } catch (err: any) {
      setStudImportError("Import failed: " + err.message);
    }

    setStudImportUploading(false);
    setStudImportDone({ added, skipped });
    setStudImportRows([]);
    if (studImportFileRef.current) studImportFileRef.current.value = "";
    loadData();
  };

  const handleClearStudentImport = () => {
    setStudImportRows([]);
    setStudImportDone(null);
    setStudImportError(null);
    if (studImportFileRef.current) studImportFileRef.current.value = "";
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

      {/* Shared System Controls */}
      <div className="glass-card" style={{ marginBottom: "1.5rem", padding: "1rem 1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {dateLocked ? <Lock size={18} style={{ color: "#ef4444" }} /> : <Unlock size={18} style={{ color: "#10b981" }} />}
              <span>Daily Attendance Date Restraints</span>
            </h4>
            <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              {dateLocked 
                ? "Locked: Faculty members are restricted to logging attendance for today's date only." 
                : "Unlocked: Faculty members are permitted to select and enter attendance for past calendar dates."
              }
            </p>
          </div>
          <div>
            <button
              onClick={handleToggleDateLock}
              className="btn"
              style={{
                backgroundColor: dateLocked ? "rgba(239, 68, 68, 0.12)" : "rgba(16, 185, 129, 0.12)",
                color: dateLocked ? "#f87171" : "#34d399",
                border: `1px solid ${dateLocked ? "rgba(239, 68, 68, 0.25)" : "rgba(16, 185, 129, 0.25)"}`,
                padding: "0.5rem 1rem",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.85rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem"
              }}
            >
              {dateLocked ? "Unlock Date Selection" : "Lock to Today Only"}
            </button>
          </div>
        </div>
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
        <button
          className={`nav-btn ${activeTab === "students" ? "active" : ""}`}
          onClick={() => setActiveTab("students")}
        >
          <GraduationCap size={18} />
          <span>Manage Students</span>
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
                <UserPlus size={16} />
                Add Staff
              </button>
            </form>

            {/* --- Excel Bulk Import --- */}
            <div className="sa-import-divider">
              <span>or</span>
            </div>

            <div className="sa-import-section">
              <div className="sa-import-header">
                <h4 className="sa-import-title">
                  <FileSpreadsheet size={16} style={{ color: "var(--accent-blue)", flexShrink: 0 }} />
                  <span>Bulk Import via Excel</span>
                </h4>
                <button className="btn btn-secondary sa-template-btn" onClick={downloadTemplate} type="button" title="Download template Excel file">
                  <Download size={14} />
                  <span>Download Template</span>
                </button>
              </div>

              <p className="sa-import-hint">
                Upload an Excel / CSV file with two columns: <strong>Staff Name</strong> and <strong>Department</strong>. Column names are case-insensitive.
              </p>

              <div className="sa-drop-zone" onClick={() => importFileRef.current?.click()}>
                <input
                  ref={importFileRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleImportFile}
                  style={{ display: "none" }}
                  id="staffImportFile"
                />
                <Upload size={28} style={{ color: "var(--accent-blue)", marginBottom: "0.5rem" }} />
                <span className="sa-drop-label">Click to choose file</span>
                <span className="sa-drop-sub">.xlsx, .xls or .csv</span>
              </div>

              {importError && (
                <div className="sa-msg sa-msg-error" style={{ marginTop: "0.75rem" }}>
                  <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                  {importError}
                </div>
              )}

              {importDone && (
                <div className="sa-msg sa-msg-success" style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                  Import complete — <strong>{importDone.added}</strong> staff added{importDone.skipped > 0 ? `, ${importDone.skipped} skipped` : ""}.
                </div>
              )}

              {importRows.length > 0 && (
                <div className="sa-import-preview">
                  <div className="sa-import-preview-header">
                    <span className="sa-import-preview-count">
                      Preview: {importRows.filter(r => r.valid).length} valid / {importRows.filter(r => !r.valid).length} invalid out of {importRows.length} rows
                    </span>
                    <button className="btn btn-secondary" style={{ height: "30px", padding: "0 0.6rem", fontSize: "0.75rem" }} onClick={handleClearImport} type="button">
                      <X size={12} /> Clear
                    </button>
                  </div>

                  <div className="table-wrapper sa-import-table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th style={{ width: "28px" }}></th>
                          <th>Staff Name</th>
                          <th>Department</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importRows.map((row, idx) => (
                          <tr key={idx} className={row.valid ? "" : "sa-import-invalid-row"}>
                            <td style={{ textAlign: "center" }}>
                              {row.valid
                                ? <CheckCircle2 size={14} style={{ color: "var(--accent-green)" }} />
                                : <AlertTriangle size={14} style={{ color: "var(--accent-red)" }} />
                              }
                            </td>
                            <td className="sa-td-bold">{row.name || <em style={{ color: "var(--text-muted)" }}>—</em>}</td>
                            <td>{row.department || <em style={{ color: "var(--text-muted)" }}>—</em>}</td>
                            <td className={row.valid ? "sa-import-ok" : "sa-import-err"}>
                              {row.valid ? "✓ Ready" : row.reason}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button
                    className="btn btn-primary sa-submit-btn"
                    onClick={handleConfirmImport}
                    disabled={importUploading || importRows.filter(r => r.valid).length === 0}
                    type="button"
                    style={{ marginTop: "0.75rem" }}
                  >
                    {importUploading
                      ? <><div className="spinner-sm"></div> Importing...</>
                      : <><Upload size={15} /> Import {importRows.filter(r => r.valid).length} Staff Members</>
                    }
                  </button>
                </div>
              )}
            </div>

            {/* --- PDF Bulk Sync --- */}
            <div className="sa-import-divider">
              <span>or</span>
            </div>

            <div className="sa-import-section">
              <div className="sa-import-header" style={{ marginBottom: "0.25rem" }}>
                <h4 className="sa-import-title">
                  <RefreshCw size={16} style={{ color: "var(--accent-blue)", flexShrink: 0 }} />
                  <span>Sync with PDF Data</span>
                </h4>
              </div>
              <p className="sa-import-hint">
                Replace the entire active staff collection with the 50 standard staff members defined in the PDF.
              </p>
              <button
                className="btn btn-secondary sa-submit-btn"
                style={{
                  width: "100%",
                  borderColor: "var(--accent-blue)",
                  color: "var(--accent-blue)",
                  backgroundColor: "rgba(59, 130, 246, 0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  marginTop: "0.5rem"
                }}
                onClick={handleResetStaffToPDF}
                disabled={syncingStaff}
                type="button"
              >
                {syncingStaff ? (
                  <>
                    <div className="spinner-sm"></div>
                    <span>Syncing...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={15} />
                    <span>Sync Staff with PDF Data</span>
                  </>
                )}
              </button>
            </div>
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
                    <th>Email Address</th>
                    <th>Password</th>
                    <th style={{ textAlign: "center" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && staffList.length === 0 ? (
                    <tr><td colSpan={5} className="sa-td-center">Loading staff list...</td></tr>
                  ) : staffList.length === 0 ? (
                    <tr><td colSpan={5} className="sa-td-center sa-td-muted">No staff found in this directory.</td></tr>
                  ) : (
                    staffList.map((s) => {
                      const isEditing = editingStaffId === s.id;
                      return (
                        <tr key={s.id}>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editingStaffName}
                                onChange={(e) => setEditingStaffName(e.target.value)}
                                className="sa-edit-input"
                                autoFocus
                              />
                            ) : (
                              <span className="sa-td-bold">{s.name}</span>
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <select
                                value={editingStaffDept}
                                onChange={(e) => setEditingStaffDept(e.target.value as Department)}
                                className="sa-edit-input"
                              >
                                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                              </select>
                            ) : (
                              <span className="badge badge-purple">{s.department}</span>
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <input
                                type="email"
                                value={editingStaffEmail}
                                onChange={(e) => setEditingStaffEmail(e.target.value)}
                                className="sa-edit-input"
                              />
                            ) : (
                              <span style={{ fontSize: "0.85rem" }}>{s.email || "—"}</span>
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editingStaffPassword}
                                onChange={(e) => setEditingStaffPassword(e.target.value)}
                                className="sa-edit-input"
                              />
                            ) : (
                              <span style={{ fontFamily: "monospace", fontSize: "0.9rem", color: "var(--accent-blue)" }}>{s.password || "—"}</span>
                            )}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <div className="sa-action-btns">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => handleSaveStaffEdit(s.id!)}
                                    className="btn btn-success sa-icon-btn"
                                    title="Save Credentials"
                                  >
                                    <Check size={16} />
                                  </button>
                                  <button
                                    onClick={handleEditStaffCancel}
                                    className="btn btn-secondary sa-icon-btn"
                                    title="Cancel"
                                  >
                                    <X size={16} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleEditStaffStart(s)}
                                    className="btn btn-secondary sa-icon-btn sa-edit-btn"
                                    title="Edit Credentials"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteStaff(s.id!, s.name)}
                                    className="btn btn-danger sa-icon-btn"
                                    title="Remove Staff"
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
                  {(subDept === "Science & Humanities" ? SEMESTERS.slice(0, 2) : SEMESTERS).map(s => <option key={s} value={s}>{s}</option>)}
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
                  {(subDept === "Science & Humanities" ? SEMESTERS.slice(0, 2) : SEMESTERS).map(s => <option key={s} value={s}>{s}</option>)}
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

      {/* --- TAB 4: MANAGE STUDENTS --- */}
      {activeTab === "students" && (
        <div className="admin-grid">
          {/* Add Student Form */}
          <div className="glass-card">
            <h3 className="sa-card-title">
              <UserPlus size={18} style={{ color: "var(--accent-blue)", flexShrink: 0 }} />
              <span>Add Student Manually</span>
            </h3>
            {studError && <div className="sa-msg sa-msg-error">{studError}</div>}
            {studSuccess && <div className="sa-msg sa-msg-success">Student added successfully.</div>}
            
            <form onSubmit={handleAddStudent} className="sa-form">
              <div className="form-group">
                <label>Academic Year</label>
                <select
                  value={studentYear}
                  onChange={(e) => setStudentYear(e.target.value)}
                  className="form-control"
                  required
                >
                  <option value="">Select Academic Year</option>
                  <option value="2025-2026">2025-2026</option>
                  <option value="2026-2027">2026-2027</option>
                  <option value="2027-2028">2027-2028</option>
                  <option value="2028-2029">2028-2029</option>
                </select>
              </div>

              <div className="form-group">
                <label>Department</label>
                <select
                  value={studentDept}
                  onChange={(e) => {
                    setStudentDept(e.target.value as Department);
                    setStudentSem("");
                  }}
                  className="form-control"
                  required
                >
                  <option value="">Select Department</option>
                  {DEPARTMENTS.filter(d => d !== "Science & Humanities").map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Semester</label>
                <select
                  value={studentSem}
                  onChange={(e) => setStudentSem(e.target.value as Semester)}
                  className="form-control"
                  disabled={!studentDept}
                  required
                >
                  <option value="">Select Semester</option>
                  {SEMESTERS.filter(sem => {
                    if (studentDept === "Science & Humanities") {
                      return sem === "Semester 1" || sem === "Semester 2";
                    }
                    return true;
                  }).map((sem) => (
                    <option key={sem} value={sem}>{sem}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Roll Number</label>
                <input
                  type="text"
                  placeholder="e.g. 101"
                  value={studRollNo}
                  onChange={(e) => setStudRollNo(e.target.value)}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label>Student Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Patil"
                  value={studName}
                  onChange={(e) => setStudName(e.target.value)}
                  className="form-control"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary sa-submit-btn"
                disabled={!studentDept || !studentSem || !studentYear}
              >
                Add Student
              </button>
            </form>

            <hr className="divider" style={{ margin: "1.5rem 0" }} />

            {/* Bulk Upload Roster via Excel */}
            <h3 className="sa-card-title">
              <FileSpreadsheet size={18} style={{ color: "var(--accent-blue)", flexShrink: 0 }} />
              <span>Bulk Student Excel Import</span>
            </h3>

            {studImportError && <div className="sa-msg sa-msg-error">{studImportError}</div>}
            {studImportDone && (
              <div className="sa-msg sa-msg-success">
                Import completed successfully! Added: {studImportDone.added}, Skipped duplicate roll numbers: {studImportDone.skipped}.
              </div>
            )}

            <div className="sa-import-box">
              <div className="sa-import-actions" style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  className="btn btn-secondary sa-submit-btn"
                  onClick={downloadStudentTemplate}
                  style={{ flex: 1, display: "flex", gap: "0.4rem", alignItems: "center", justifyContent: "center" }}
                >
                  <Download size={16} />
                  <span>Template</span>
                </button>
                <div style={{ flex: 1, position: "relative" }}>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleImportStudentFile}
                    ref={studImportFileRef}
                    style={{ display: "none" }}
                    id="excel-student-file-input"
                  />
                  <label
                    htmlFor="excel-student-file-input"
                    className="btn btn-secondary sa-submit-btn"
                    style={{
                      display: "flex",
                      gap: "0.4rem",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      width: "100%",
                      boxSizing: "border-box"
                    }}
                  >
                    <Upload size={16} />
                    <span>Upload Excel</span>
                  </label>
                </div>
              </div>

              {studImportRows.length > 0 && (
                <div className="sa-import-preview" style={{ marginTop: "1rem" }}>
                  <div className="sa-import-preview-header">
                    <h4>File Preview ({studImportRows.length} rows found)</h4>
                    <span className="badge badge-purple">
                      {studImportRows.filter((r) => r.valid).length} Valid
                    </span>
                  </div>
                  
                  <div className="sa-preview-table-container" style={{ maxHeight: "150px", overflowY: "auto", border: "1px solid var(--border-color)", borderRadius: "6px", margin: "0.5rem 0" }}>
                    <table className="sa-table" style={{ fontSize: "0.8rem", width: "100%" }}>
                      <thead>
                        <tr>
                          <th>Roll No</th>
                          <th>Student Name</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studImportRows.slice(0, 20).map((row, idx) => (
                          <tr key={idx} style={{ opacity: row.valid ? 1 : 0.6 }}>
                            <td>{row.rollNo || "—"}</td>
                            <td>{row.name || "—"}</td>
                            <td>
                              {row.valid ? (
                                <span style={{ color: "var(--accent-green)" }}>Ready</span>
                              ) : (
                                <span style={{ color: "var(--accent-red)" }} title={row.reason}>Invalid</span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {studImportRows.length > 20 && (
                          <tr>
                            <td colSpan={3} style={{ textAlign: "center", color: "var(--text-muted)" }}>
                              Showing first 20 rows...
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="sa-import-preview-btns" style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ flex: 1 }}
                      disabled={studImportUploading || studImportRows.filter(r => r.valid).length === 0}
                      onClick={handleConfirmStudentImport}
                    >
                      {studImportUploading ? "Importing..." : "Confirm & Import"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleClearStudentImport}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Student Directory */}
          <div className="glass-card sa-list-card">
            <h3 className="sa-card-title">
              <Layers size={18} style={{ color: "var(--accent-blue)", flexShrink: 0 }} />
              <span>Student Directory</span>
            </h3>

            {/* Selection filters */}
            <div className="sa-directory-filters" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginBottom: "1rem" }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <select
                  value={studentYear}
                  onChange={(e) => setStudentYear(e.target.value)}
                  className="form-control"
                  style={{ height: "38px", fontSize: "0.85rem" }}
                >
                  <option value="">Year</option>
                  <option value="2025-2026">2025-2026</option>
                  <option value="2026-2027">2026-2027</option>
                  <option value="2027-2028">2027-2028</option>
                  <option value="2028-2029">2028-2029</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <select
                  value={studentDept}
                  onChange={(e) => {
                    setStudentDept(e.target.value as Department);
                    setStudentSem("");
                  }}
                  className="form-control"
                  style={{ height: "38px", fontSize: "0.85rem" }}
                >
                  <option value="">Department</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <select
                  value={studentSem}
                  onChange={(e) => setStudentSem(e.target.value as Semester)}
                  className="form-control"
                  style={{ height: "38px", fontSize: "0.85rem" }}
                  disabled={!studentDept}
                >
                  <option value="">Semester</option>
                  {SEMESTERS.filter(sem => {
                    if (studentDept === "Science & Humanities") {
                      return sem === "Semester 1" || sem === "Semester 2";
                    }
                    return true;
                  }).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {!studentDept || !studentSem || !studentYear ? (
              <div className="sa-directory-empty">
                <AlertTriangle size={32} className="sa-empty-icon" />
                <p>Please select Academic Year, Department, and Semester to view the student directory.</p>
              </div>
            ) : loading ? (
              <div className="sa-directory-empty">
                <div className="spinner"></div>
                <p>Loading students list...</p>
              </div>
            ) : studentsList.length === 0 ? (
              <div className="sa-directory-empty">
                <AlertTriangle size={32} className="sa-empty-icon" />
                <p>No students found for this class. You can add them manually or upload an Excel list above.</p>
              </div>
            ) : (
              <div className="table-responsive" style={{ maxHeight: "450px", overflowY: "auto" }}>
                <table className="sa-table">
                  <thead>
                    <tr>
                      <th style={{ width: "80px" }}>Roll No</th>
                      <th>Student Name</th>
                      <th style={{ textAlign: "center", width: "100px" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsList.map((s) => {
                      const isEditing = editingStudentId === s.id;
                      return (
                        <tr key={s.id}>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editingStudentRollNo}
                                onChange={(e) => setEditingStudentRollNo(e.target.value)}
                                className="sa-edit-input"
                                style={{ width: "60px", padding: "4px" }}
                                autoFocus
                              />
                            ) : (
                              <span className="sa-td-bold">{s.rollNo}</span>
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editingStudentName}
                                onChange={(e) => setEditingStudentName(e.target.value)}
                                className="sa-edit-input"
                                style={{ width: "90%", padding: "4px" }}
                              />
                            ) : (
                              <span>{s.name}</span>
                            )}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <div className="sa-action-btns" style={{ justifyContent: "center" }}>
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => handleSaveStudentEdit(s.id!)}
                                    className="btn btn-success sa-icon-btn"
                                    title="Save changes"
                                  >
                                    <Check size={16} />
                                  </button>
                                  <button
                                    onClick={handleEditStudentCancel}
                                    className="btn btn-secondary sa-icon-btn"
                                    title="Cancel"
                                  >
                                    <X size={16} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleEditStudentStart(s)}
                                    className="btn btn-secondary sa-icon-btn sa-edit-btn"
                                    title="Edit student info"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteStudent(s.id!, s.name)}
                                    className="btn btn-danger sa-icon-btn"
                                    title="Delete student"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </>
                              )}
                            </div>
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
    </div>
  );
};
export default SuperAdminPanel;
