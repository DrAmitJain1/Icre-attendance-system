import { initializeApp, getApps, deleteApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from "firebase/auth";
import {
  getFirestore,
  collection as fbCollection,
  addDoc as fbAddDoc,
  setDoc as fbSetDoc,
  updateDoc as fbUpdateDoc,
  query as fbQuery,
  orderBy as fbOrderBy,
  onSnapshot as fbOnSnapshot,
  getDocs as fbGetDocs,
  getDoc as fbGetDoc,
  deleteDoc as fbDeleteDoc,
  doc as fbDoc,
  where as fbWhere,
  type DocumentData,
  writeBatch as fbWriteBatch
} from "firebase/firestore";
import { SUBJECT_MAPPING, DEPARTMENTS, SEMESTERS, type Semester } from "./subjects";

// --- INTERFACES ---

export interface AttendanceRecord {
  id?: string;
  academicYear: string;
  department: string;
  staffDepartment?: string;
  semester: string;
  subject: string;
  lectureType?: "Lecture" | "Practical";
  staffName: string;
  date: string;
  startTime: string;
  endTime: string;
  absentNos: string;
  isExtraLecture?: boolean;
  createdAt: number;
}

export interface Staff {
  id?: string;
  name: string;
  department: string;
  email?: string;
  password?: string;
  createdAt: number;
}

export interface SubjectItem {
  id?: string;
  name: string;
  department: string;
  semester: string;
  createdAt: number;
}

export interface Student {
  id?: string;
  rollNo: string;
  name: string;
  department: string;
  semester: string;
  academicYear: string;
  createdAt: number;
}

export interface Principal {
  id?: string;
  email: string;
  password?: string;
  name: string;
  createdAt: number;
}

export interface AuthUser {
  uid: string;
  email: string;
  role: "super_admin" | "principal";
  name: string;
}

// --- FIREBASE CONFIGURATION ---

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const IS_FIREBASE_CONFIGURED = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== "your_api_key_here" &&
  firebaseConfig.projectId
);

let app: any;
let auth: any;
let db: any;

if (IS_FIREBASE_CONFIGURED) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.error("Firebase initialization failed, falling back to simulated mode:", error);
  }
}

// --- LOCAL STORAGE DEMO SEED DATA ---

const cleanShortNameForEmail = (shortName: string): string => {
  let clean = shortName.replace(/^(dr\.|prof\.|dr|prof)\s+/i, "").trim();
  clean = clean.toLowerCase().replace(/\s+/g, ".");
  return `${clean}@smvicre.edu.in`;
};

const generateDeterministicPassword = (shortName: string): string => {
  const clean = shortName.replace(/^(dr\.|prof\.|dr|prof)\s+/i, "").trim().toLowerCase().replace(/\s+/g, "");
  const prefix = (clean + "xxxxx").substring(0, 5);
  const code = (shortName.length * 17) % 90 + 10;
  return `${prefix.charAt(0).toUpperCase()}${prefix.substring(1)}${code}!`;
};

const PDF_STAFF_RAW = [
  { name: "Dr. Arvind Kadam", department: "Electronics & Tele. Comm. Engineering", shortName: "Arvind Kadam" },
  { name: "Ayan Kazi", department: "Civil & Rural Engineering", shortName: "Ayan Kazi" },
  { name: "Kireesh More", department: "Civil & Rural Engineering", shortName: "Kireesh More" },
  { name: "Shubham Khot", department: "Civil & Rural Engineering", shortName: "Shubham Khot" },
  { name: "Prakash Patil", department: "Civil & Rural Engineering", shortName: "Prakash Patil" },
  { name: "Rahul Surve", department: "Civil & Rural Engineering", shortName: "Rahul Surve" },
  { name: "Omkar Dhenge", department: "Civil & Rural Engineering", shortName: "Omkar Dhenge" },
  { name: "Ravikiran Torase", department: "Civil & Rural Engineering", shortName: "Ravikiran Torase" },
  { name: "Sunil Mangale", department: "Civil & Rural Engineering", shortName: "Sunil Mangale" },
  { name: "Mayur Pilankar", department: "Computer Engineering", shortName: "Mayur Pilankar" },
  { name: "Santosh Mane", department: "Computer Engineering", shortName: "Santosh Mane" },
  { name: "Chandrabhan Kumare", department: "Computer Engineering", shortName: "Chandrabhan Kumare" },
  { name: "Mahesh Pore", department: "Computer Engineering", shortName: "Mahesh Pore" },
  { name: "Aniket Chavan", department: "Computer Engineering", shortName: "Aniket Chavan" },
  { name: "Gajanan Bhoi", department: "Computer Engineering", shortName: "Gajanan Bhoi" },
  { name: "Omkar Suryavanshi", department: "Computer Engineering", shortName: "Omkar Suryavanshi" },
  { name: "Pooja Chavan", department: "Computer Engineering", shortName: "Pooja Chavan" },
  { name: "Vinayak Kalake", department: "Computer Engineering", shortName: "Vinayak Kalake" },
  { name: "Dr. Ranjeet Powar", department: "Computer Engineering", shortName: "Dr. Ranjeet Powar" },
  { name: "Sarjerao Patil", department: "Electrical Engineering", shortName: "Sarjerao Patil" },
  { name: "Manoj Kalekar", department: "Electrical Engineering", shortName: "Manoj Kalekar" },
  { name: "Rahul Jadhav", department: "Electrical Engineering", shortName: "Rahul Jadhav" },
  { name: "Ajit Patil", department: "Electrical Engineering", shortName: "Ajit Patil" },
  { name: "Revati Metal", department: "Electrical Engineering", shortName: "Revati Metal" },
  { name: "Dastagir Shanediwan", department: "Electronics & Tele. Comm. Engineering", shortName: "Dastagir Shanediwan" },
  { name: "Reshma Bhai", department: "Electronics & Tele. Comm. Engineering", shortName: "Reshma Bhai" },
  { name: "Nilam Patil", department: "Electronics & Tele. Comm. Engineering", shortName: "Nilam Patil" },
  { name: "Pramod Inchanalkar", department: "Electronics & Tele. Comm. Engineering", shortName: "Pramod Inchanalkar" },
  { name: "Deepak Khot", department: "Electronics & Tele. Comm. Engineering", shortName: "Deepak Khot" },
  { name: "Deepak Otari", department: "Electronics & Tele. Comm. Engineering", shortName: "Deepak Otari" },
  { name: "Chandrakant Mane", department: "Mechanical Engineering - Div A", shortName: "Chandrakant Mane" },
  { name: "Arvind Gojare", department: "Mechanical Engineering - Div A", shortName: "Arvind Gojare" },
  { name: "Kiran Huparikar", department: "Mechanical Engineering - Div A", shortName: "Kiran Huparikar" },
  { name: "Nandkumar Raul", department: "Mechanical Engineering - Div A", shortName: "Nandkumar Raul" },
  { name: "Onkar Hajare", department: "Mechanical Engineering - Div A", shortName: "Onkar Hajare" },
  { name: "Sagar Patil", department: "Mechanical Engineering - Div A", shortName: "Sagar Patil" },
  { name: "Sourabh Varne", department: "Mechanical Engineering - Div A", shortName: "Sourabh Varne" },
  { name: "Tushar Choutre", department: "Mechanical Engineering - Div A", shortName: "Tushar Choutre" },
  { name: "Uday Patil", department: "Mechanical Engineering - Div A", shortName: "Uday Patil" },
  { name: "Vijay Sawardekar", department: "Mechanical Engineering - Div A", shortName: "Vijay Sawardekar" },
  { name: "Dr. Ujwala Solase", department: "Science & Humanities", shortName: "Ujwala Solase" },
  { name: "Dr. Pravin Vhangutte", department: "Science & Humanities", shortName: "Pravin Vhangutte" },
  { name: "Rajvardhan Ingale", department: "Science & Humanities", shortName: "Rajvardhan Ingale" },
  { name: "Sampann Malavi", department: "Science & Humanities", shortName: "Sampann Malavi" },
  { name: "Samruddhi Desai", department: "Science & Humanities", shortName: "Samruddhi Desai" },
  { name: "Shridhar Desai", department: "Science & Humanities", shortName: "Shridhar Desai" },
  { name: "Vinayak Ghungurkar", department: "Science & Humanities", shortName: "Vinayak Ghungurkar" },
  { name: "Dr. Sachin Abitkar", department: "Science & Humanities", shortName: "Sachin Abitkar" },
  { name: "Meena Morbale", department: "Science & Humanities", shortName: "Meena Morbale" },
  { name: "Pandharinath Regade", department: "Science & Humanities", shortName: "Pandharinath Regade" }
];

const DEFAULT_DEMO_STAFF: Staff[] = PDF_STAFF_RAW.map((item, idx) => ({
  id: `sim_staff_${idx + 1}`,
  name: item.name,
  department: item.department,
  email: cleanShortNameForEmail(item.shortName),
  password: generateDeterministicPassword(item.shortName),
  createdAt: Date.now() - (50 - idx) * 1000
}));

const DEFAULT_DEMO_PRINCIPALS: Principal[] = [
  { email: "principal@attendance.com", password: "principal123", name: "Dr. Ranjeet Powar", createdAt: Date.now() }
];

// Initialize local storage collections if they don't exist
const initializeDemoDB = () => {
  // Clear simulated databases if they contain the deprecated parent Mechanical Engineering department or lack full rosters
  const storedStaff = localStorage.getItem("attendance_staff_sim");
  let storedStudents = localStorage.getItem("attendance_students_sim");
  let shouldReset = false;

  if (storedStaff) {
    const list: Staff[] = JSON.parse(storedStaff);
    if (list.some(s => s.department === "Mechanical Engineering")) {
      shouldReset = true;
    }
  }

  if (storedStudents) {
    const list: Student[] = JSON.parse(storedStudents);
    const hasParentMech = list.some(s => s.department === "Mechanical Engineering");
    const hasDivA = list.some(s => s.department === "Mechanical Engineering - Div A");
    // If it lacks Div A/B or does not contain all semesters of the mechanical classes (expected size > 1000)
    if (hasParentMech || !hasDivA || list.length < 1000) {
      shouldReset = true;
    }
  } else {
    shouldReset = true;
  }

  if (shouldReset) {
    localStorage.removeItem("attendance_staff_sim");
    localStorage.removeItem("attendance_students_sim");
    localStorage.removeItem("attendance_records_sim");
    localStorage.removeItem("attendance_subjects_sim");
  }

  if (!localStorage.getItem("attendance_staff_sim")) {
    localStorage.setItem("attendance_staff_sim", JSON.stringify(DEFAULT_DEMO_STAFF));
  }
  if (!localStorage.getItem("attendance_principals_sim")) {
    localStorage.setItem("attendance_principals_sim", JSON.stringify(DEFAULT_DEMO_PRINCIPALS));
  }
  if (!localStorage.getItem("attendance_subjects_sim")) {
    // Generate subjects catalogue from static subjects mapping
    const initialSubjects: SubjectItem[] = [];
    DEPARTMENTS.forEach(dept => {
      SEMESTERS.forEach(sem => {
        const list = SUBJECT_MAPPING[dept][sem] || [];
        list.forEach(sub => {
          initialSubjects.push({
            name: sub,
            department: dept,
            semester: sem,
            createdAt: Date.now()
          });
        });
      });
    });
    localStorage.setItem("attendance_subjects_sim", JSON.stringify(initialSubjects));
  }

  storedStudents = localStorage.getItem("attendance_students_sim");
  if (!storedStudents || JSON.parse(storedStudents).length === 0) {
    const initialStudents: Student[] = [];
    const mockNames = [
      "Aarav Sharma", "Aditya Patel", "Vihaan Gupta", "Arjun Rao", "Sai Reddy",
      "Ishaan Deshmukh", "Ananya Iyer", "Diya Joshi", "Riya Sen", "Shruti Joshi",
      "Priya Nair", "Amit Patil", "Rohit Shinde", "Rahul Desai", "Siddharth Mehta",
      "Sneha Jadhav", "Tanvi Sawant", "Yash Mohite", "Pranav More", "Neha Gaikwad"
    ];
    DEPARTMENTS.forEach(dept => {
      const sems = dept === "Science & Humanities" ? ["Semester 1", "Semester 2"] : SEMESTERS;
      sems.forEach(sem => {
        // Mock 60 students for Div A, 65 for Div B, and 15 for other classes
        const studentCount = dept === "Mechanical Engineering - Div A" ? 60 : (dept === "Mechanical Engineering - Div B" ? 65 : 15);
        for (let r = 1; r <= studentCount; r++) {
          const nameIndex = (dept.charCodeAt(0) + sem.charCodeAt(9) + r) % mockNames.length;
          initialStudents.push({
            id: `sim_stud_${dept.slice(0,3).replace(/\s+/g, "")}_${sem.slice(-1)}_${r}`,
            rollNo: String(r),
            name: mockNames[nameIndex],
            department: dept,
            semester: sem as Semester,
            academicYear: "2026-2027",
            createdAt: Date.now()
          });
        }
      });
    });
    localStorage.setItem("attendance_students_sim", JSON.stringify(initialStudents));
  }

  // Seed mock attendance records for both Mechanical divisions to show dynamic statistics immediately
  const storedRecords = localStorage.getItem("attendance_records_sim");
  if (!storedRecords || JSON.parse(storedRecords).length === 0) {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    const mockRecords: AttendanceRecord[] = [];

    // Seed 10 records for Div A
    const datesDivA = ["02", "04", "06", "08", "10", "12", "14", "16", "18", "20"];
    datesDivA.forEach((day, idx) => {
      mockRecords.push({
        id: `sim_rec_mecha_${idx}`,
        academicYear: "2026-2027",
        department: "Mechanical Engineering - Div A",
        staffDepartment: "Mechanical Engineering - Div A",
        semester: "Semester 3",
        subject: idx % 2 === 0 ? "Thermal Engineering" : "Machine Drawing",
        lectureType: "Lecture",
        staffName: "Chandrakant Mane",
        date: `${day}/${mm}/${yyyy}`,
        startTime: "09:00",
        endTime: "10:00",
        absentNos: idx % 3 === 0 ? "5,12" : (idx % 3 === 1 ? "24" : ""),
        createdAt: Date.now() - (10 - idx) * 3600 * 1000
      });
    });

    // Seed 10 records for Div B
    const datesDivB = ["03", "05", "07", "09", "11", "13", "15", "17", "19", "20"];
    datesDivB.forEach((day, idx) => {
      mockRecords.push({
        id: `sim_rec_mechb_${idx}`,
        academicYear: "2026-2027",
        department: "Mechanical Engineering - Div B",
        staffDepartment: "Mechanical Engineering - Div A",
        semester: "Semester 3",
        subject: idx % 2 === 0 ? "Manufacturing Processes" : "Strength of Materials",
        lectureType: "Lecture",
        staffName: "Arvind Gojare",
        date: `${day}/${mm}/${yyyy}`,
        startTime: "10:00",
        endTime: "11:00",
        absentNos: idx % 3 === 0 ? "8,45,61" : (idx % 3 === 1 ? "19,33" : ""),
        createdAt: Date.now() - (10 - idx) * 3600 * 1000
      });
    });

    localStorage.setItem("attendance_records_sim", JSON.stringify(mockRecords));
  }
};

initializeDemoDB();

// --- 1. STAFF CRUD FUNCTIONS ---

export const getStaff = async (department?: string): Promise<Staff[]> => {
  if (IS_FIREBASE_CONFIGURED && db) {
    const collRef = fbCollection(db, "staff");
    const q = department
      ? fbQuery(collRef, fbWhere("department", "==", department))
      : fbQuery(collRef);
    const snapshot = await fbGetDocs(q);
    const result: Staff[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      result.push({
        id: doc.id,
        name: data.name,
        department: data.department,
        email: data.email || "",
        password: data.password || "",
        createdAt: data.createdAt || 0
      });
    });
    // Sort in memory to avoid index requirements
    return result.sort((a, b) => b.createdAt - a.createdAt);
  } else {
    const list: Staff[] = JSON.parse(localStorage.getItem("attendance_staff_sim") || "[]");
    const filtered = department ? list.filter(s => s.department === department) : list;
    return filtered.sort((a, b) => b.createdAt - a.createdAt);
  }
};

export const addStaff = async (name: string, department: string, email?: string, password?: string): Promise<void> => {
  const generateStaffEmail = (nameStr: string): string => {
    const parts = nameStr.trim().toLowerCase().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0]}.${parts[parts.length - 1]}@smvicre.edu.in`;
    }
    return `${parts[0]}@smvicre.edu.in`;
  };

  const generateRandomPassword = (): string => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let pwd = "";
    for (let i = 0; i < 6; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  };

  const staffItem: Omit<Staff, "id"> = {
    name: name.trim(),
    department,
    email: (email || generateStaffEmail(name)).trim().toLowerCase(),
    password: (password || generateRandomPassword()).trim(),
    createdAt: Date.now()
  };

  if (IS_FIREBASE_CONFIGURED && db) {
    await fbAddDoc(fbCollection(db, "staff"), staffItem);
  } else {
    const list: Staff[] = JSON.parse(localStorage.getItem("attendance_staff_sim") || "[]");
    list.push({ ...staffItem, id: `sim_staff_${Date.now()}` });
    localStorage.setItem("attendance_staff_sim", JSON.stringify(list));
  }
};

export const deleteStaff = async (id: string): Promise<void> => {
  if (IS_FIREBASE_CONFIGURED && db) {
    await fbDeleteDoc(fbDoc(db, "staff", id));
  } else {
    const list: Staff[] = JSON.parse(localStorage.getItem("attendance_staff_sim") || "[]");
    const filtered = list.filter(s => s.id !== id);
    localStorage.setItem("attendance_staff_sim", JSON.stringify(filtered));
  }
};

export const updateStaff = async (id: string, name: string, department: string, email: string, password: string): Promise<void> => {
  if (IS_FIREBASE_CONFIGURED && db) {
    await fbUpdateDoc(fbDoc(db, "staff", id), {
      name: name.trim(),
      department,
      email: email.trim().toLowerCase(),
      password: password.trim()
    });
  } else {
    const list: Staff[] = JSON.parse(localStorage.getItem("attendance_staff_sim") || "[]");
    const updated = list.map(s => s.id === id ? { ...s, name: name.trim(), department, email: email.trim().toLowerCase(), password: password.trim() } : s);
    localStorage.setItem("attendance_staff_sim", JSON.stringify(updated));
  }
};

export const resetStaffToPDFData = async (): Promise<void> => {
  if (IS_FIREBASE_CONFIGURED && db) {
    const collRef = fbCollection(db, "staff");
    const snapshot = await fbGetDocs(collRef);
    for (const doc of snapshot.docs) {
      await fbDeleteDoc(fbDoc(db, "staff", doc.id));
    }
    for (const staff of DEFAULT_DEMO_STAFF) {
      const staffItem: Omit<Staff, "id"> = {
        name: staff.name,
        department: staff.department,
        email: staff.email || "",
        password: staff.password || "",
        createdAt: staff.createdAt
      };
      await fbAddDoc(collRef, staffItem);
    }
  } else {
    localStorage.setItem("attendance_staff_sim", JSON.stringify(DEFAULT_DEMO_STAFF));
  }
};

export const loginStaff = async (email: string, password: string): Promise<Staff> => {
  const normEmail = email.trim().toLowerCase();
  const pwd = password.trim();

  if (IS_FIREBASE_CONFIGURED && db) {
    const collRef = fbCollection(db, "staff");
    const q = fbQuery(collRef, fbWhere("email", "==", normEmail), fbWhere("password", "==", pwd));
    const snapshot = await fbGetDocs(q);
    if (snapshot.empty) {
      throw new Error("Invalid staff email or password.");
    }
    const docSnap = snapshot.docs[0];
    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: data.name,
      department: data.department,
      email: data.email,
      password: data.password,
      createdAt: data.createdAt || 0
    };
  } else {
    // Simulated Mode
    const list: Staff[] = JSON.parse(localStorage.getItem("attendance_staff_sim") || "[]");
    const staff = list.find(s => s.email?.toLowerCase() === normEmail && s.password === pwd);
    if (!staff) {
      throw new Error("Invalid staff email or password.");
    }
    return staff;
  }
};

// --- 2. SUBJECTS CRUD FUNCTIONS ---

export const getSubjects = async (department: string, semester?: string): Promise<SubjectItem[]> => {
  const targetDept = department.startsWith("Mechanical Engineering") ? "Mechanical Engineering" : department;
  if (IS_FIREBASE_CONFIGURED && db) {
    const collRef = fbCollection(db, "subjects");
    const constraints = [fbWhere("department", "==", targetDept)];
    if (semester) {
      constraints.push(fbWhere("semester", "==", semester));
    }
    const q = fbQuery(collRef, ...constraints);
    const snapshot = await fbGetDocs(q);
    const result: SubjectItem[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      result.push({
        id: doc.id,
        name: data.name,
        department: data.department,
        semester: data.semester,
        createdAt: data.createdAt || 0
      });
    });
    // Sort in memory
    return result.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    // Simulated Mode
    const list: SubjectItem[] = JSON.parse(localStorage.getItem("attendance_subjects_sim") || "[]");
    const filtered = list.filter(s => s.department === targetDept && (!semester || s.semester === semester));
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }
};

export const addSubject = async (name: string, department: string, semester: string): Promise<void> => {
  const targetDept = department.startsWith("Mechanical Engineering") ? "Mechanical Engineering" : department;
  const subjectItem: Omit<SubjectItem, "id"> = {
    name: name.trim(),
    department: targetDept,
    semester,
    createdAt: Date.now()
  };

  if (IS_FIREBASE_CONFIGURED && db) {
    await fbAddDoc(fbCollection(db, "subjects"), subjectItem);
  } else {
    const list: SubjectItem[] = JSON.parse(localStorage.getItem("attendance_subjects_sim") || "[]");
    list.push({ ...subjectItem, id: `sim_sub_${Date.now()}` });
    localStorage.setItem("attendance_subjects_sim", JSON.stringify(list));
  }
};

export const deleteSubject = async (id: string): Promise<void> => {
  if (IS_FIREBASE_CONFIGURED && db) {
    await fbDeleteDoc(fbDoc(db, "subjects", id));
  } else {
    const list: SubjectItem[] = JSON.parse(localStorage.getItem("attendance_subjects_sim") || "[]");
    const filtered = list.filter(s => s.id !== id);
    localStorage.setItem("attendance_subjects_sim", JSON.stringify(filtered));
  }
};

export const updateSubject = async (id: string, name: string): Promise<void> => {
  if (IS_FIREBASE_CONFIGURED && db) {
    await fbUpdateDoc(fbDoc(db, "subjects", id), { name: name.trim() });
  } else {
    const list: SubjectItem[] = JSON.parse(localStorage.getItem("attendance_subjects_sim") || "[]");
    const index = list.findIndex(s => s.id === id);
    if (index !== -1) {
      list[index].name = name.trim();
      localStorage.setItem("attendance_subjects_sim", JSON.stringify(list));
    }
  }
};

/**
 * Automatically populates the FireStore subjects collection with default engineering subjects on first boot.
 */
export const initializeSubjectsIfNeeded = async (): Promise<void> => {
  if (IS_FIREBASE_CONFIGURED && db) {
    try {
      const collRef = fbCollection(db, "subjects");
      const snapshot = await fbGetDocs(fbQuery(collRef, fbWhere("department", "==", "Computer Engineering"), fbWhere("semester", "==", "Semester 1")));

      // If collection is empty, populate it
      if (snapshot.empty) {
        console.log("Subjects collection is empty. Seeding initial values from static mapping...");
        for (const dept of DEPARTMENTS) {
          for (const sem of SEMESTERS) {
            const list = SUBJECT_MAPPING[dept][sem] || [];
            for (const sub of list) {
              await fbAddDoc(collRef, {
                name: sub,
                department: dept,
                semester: sem,
                createdAt: Date.now()
              });
            }
          }
        }
        console.log("Firebase Subjects Seeding Complete.");
      }
    } catch (e) {
      console.error("Failed to check/seed subjects:", e);
    }
  }
};

/**
 * Automatically populates the FireStore students collection with mock Indian students on first boot if empty.
 * Detects and automatically resolves duplication race conditions caused by hot reloads.
 */
export const initializeStudentsIfNeeded = async (): Promise<void> => {
  if (IS_FIREBASE_CONFIGURED && db) {
    if ((window as any).__students_seeding_in_progress || (window as any).__students_seeded) {
      return;
    }
    (window as any).__students_seeding_in_progress = true;

    try {
      const collRef = fbCollection(db, "students");
      const snapshot = await fbGetDocs(fbQuery(collRef, fbWhere("department", "==", "Computer Engineering"), fbWhere("semester", "==", "Semester 1"), fbWhere("academicYear", "==", "2026-2027")));

      const hasDuplicates = snapshot.docs.filter(doc => doc.data().rollNo === "1").length > 1;

      if (snapshot.empty || hasDuplicates) {
        console.log("Wiping students collection to resolve duplicates or initialize seeding...");
        const snapshotAll = await fbGetDocs(collRef);
        
        // Execute batched deletes in chunks of 400
        let deleteBatch = fbWriteBatch(db);
        let deleteCount = 0;
        for (const doc of snapshotAll.docs) {
          deleteBatch.delete(fbDoc(db, "students", doc.id));
          deleteCount++;
          if (deleteCount === 400) {
            await deleteBatch.commit();
            deleteBatch = fbWriteBatch(db);
            deleteCount = 0;
          }
        }
        if (deleteCount > 0) {
          await deleteBatch.commit();
        }

        console.log("Seeding mock Indian students in Firestore (excluding Science & Humanities) via batch writes...");
        const mockNames = [
          "Aarav Sharma", "Aditya Patel", "Vihaan Gupta", "Arjun Rao", "Sai Reddy",
          "Ishaan Deshmukh", "Ananya Iyer", "Diya Joshi", "Riya Sen", "Shruti Joshi",
          "Priya Nair", "Amit Patil", "Rohit Shinde", "Rahul Desai", "Siddharth Mehta",
          "Sneha Jadhav", "Tanvi Sawant", "Yash Mohite", "Pranav More", "Neha Gaikwad"
        ];
        
        let insertBatch = fbWriteBatch(db);
        let insertCount = 0;

        for (const dept of DEPARTMENTS) {
          // Exclude Science & Humanities from seeded student data
          if (dept === "Science & Humanities") continue;

          for (const sem of SEMESTERS) {
            for (let r = 1; r <= 15; r++) {
              const nameIndex = (dept.charCodeAt(0) + sem.charCodeAt(9) + r) % mockNames.length;
              const newDocRef = fbDoc(collRef);
              
              insertBatch.set(newDocRef, {
                rollNo: String(r),
                name: mockNames[nameIndex],
                department: dept,
                semester: sem,
                academicYear: "2026-2027",
                createdAt: Date.now()
              });

              insertCount++;
              if (insertCount === 400) {
                await insertBatch.commit();
                insertBatch = fbWriteBatch(db);
                insertCount = 0;
              }
            }
          }
        }
        if (insertCount > 0) {
          await insertBatch.commit();
        }
        console.log("Firebase Students Seeding Complete.");
      }
      (window as any).__students_seeded = true;
    } catch (e) {
      console.error("Failed to check/seed students:", e);
    } finally {
      (window as any).__students_seeding_in_progress = false;
    }
  }
};

// --- 3. PRINCIPALS CRUD FUNCTIONS ---

export const getPrincipals = async (): Promise<Principal[]> => {
  if (IS_FIREBASE_CONFIGURED && db) {
    const collRef = fbCollection(db, "principals");
    const snapshot = await fbGetDocs(collRef);
    const result: Principal[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      result.push({
        id: doc.id,
        email: data.email,
        name: data.name,
        createdAt: data.createdAt || 0
      });
    });
    return result.sort((a, b) => b.createdAt - a.createdAt);
  } else {
    // Simulated Mode
    const list: Principal[] = JSON.parse(localStorage.getItem("attendance_principals_sim") || "[]");
    return [...list].sort((a, b) => b.createdAt - a.createdAt);
  }
};

export const addPrincipal = async (email: string, name: string, password: string): Promise<void> => {
  const normEmail = email.trim().toLowerCase();

  if (IS_FIREBASE_CONFIGURED && db) {
    // Create a temporary secondary Firebase app specifically to register the principal's
    // account in Firebase Authentication without logging out the logged-in Super Admin.
    const tempAppName = `temp_app_${Date.now()}`;
    const tempApp = initializeApp(firebaseConfig, tempAppName);
    const tempAuth = getAuth(tempApp);

    try {
      const userCred = await createUserWithEmailAndPassword(tempAuth, normEmail, password);
      const uid = userCred.user.uid;

      // Write principal profile metadata document to Firestore under their auth uid
      const docRef = fbDoc(db, "principals", uid);
      await fbSetDoc(docRef, {
        email: normEmail,
        name: name.trim(),
        createdAt: Date.now()
      });
    } catch (e: any) {
      console.error("Error creating principal in Firebase Authentication:", e);
      throw e;
    } finally {
      // Free app reference resources
      await deleteApp(tempApp);
    }
  } else {
    const list: Principal[] = JSON.parse(localStorage.getItem("attendance_principals_sim") || "[]");
    list.push({
      id: `sim_princ_${Date.now()}`,
      email: normEmail,
      name: name.trim(),
      password,
      createdAt: Date.now()
    });
    localStorage.setItem("attendance_principals_sim", JSON.stringify(list));
  }
};

export const deletePrincipal = async (id: string): Promise<void> => {
  if (IS_FIREBASE_CONFIGURED && db) {
    await fbDeleteDoc(fbDoc(db, "principals", id));
  } else {
    const list: Principal[] = JSON.parse(localStorage.getItem("attendance_principals_sim") || "[]");
    const filtered = list.filter(p => p.id !== id);
    localStorage.setItem("attendance_principals_sim", JSON.stringify(filtered));
  }
};

// --- 4. ATTENDANCE LOG ACTIONS ---

export const saveAttendanceRecord = async (record: Omit<AttendanceRecord, "createdAt">): Promise<void> => {
  const newRecord: AttendanceRecord = {
    ...record,
    createdAt: Date.now()
  };

  if (IS_FIREBASE_CONFIGURED && db) {
    await fbAddDoc(fbCollection(db, "attendance"), newRecord);
  } else {
    // Simulated Mode
    const records = localStorage.getItem("attendance_records_sim");
    const list = records ? JSON.parse(records) : [];
    list.push(newRecord);
    localStorage.setItem("attendance_records_sim", JSON.stringify(list));

    // Trigger listeners
    triggerDemoRecordsListeners();
    await new Promise(resolve => setTimeout(resolve, 500));
  }
};

const demoRecordsListeners: Array<(records: AttendanceRecord[]) => void> = [];
const triggerDemoRecordsListeners = () => {
  const records = localStorage.getItem("attendance_records_sim");
  const list = records ? JSON.parse(records) : [];
  const sorted = list.sort((a: any, b: any) => b.createdAt - a.createdAt);
  demoRecordsListeners.forEach(listener => listener(sorted));
};

export const subscribeToAttendanceRecords = (
  onUpdate: (records: AttendanceRecord[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  if (IS_FIREBASE_CONFIGURED && db) {
    const q = fbQuery(fbCollection(db, "attendance"), fbOrderBy("createdAt", "desc"));
    return fbOnSnapshot(q, (snapshot) => {
      const records: AttendanceRecord[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as DocumentData;
        records.push({
          id: doc.id,
          academicYear: data.academicYear || "",
          department: data.department || "",
          staffDepartment: data.staffDepartment || "",
          semester: data.semester || "",
          subject: data.subject || "",
          staffName: data.staffName || "",
          date: data.date || "",
          startTime: data.startTime || "",
          endTime: data.endTime || "",
          absentNos: data.absentNos || "",
          createdAt: data.createdAt || 0
        });
      });
      onUpdate(records);
    }, (error) => {
      console.error("Error listening to attendance logs:", error);
      if (onError) onError(error);
    });
  } else {
    // Simulated Mode
    demoRecordsListeners.push(onUpdate);
    const records = localStorage.getItem("attendance_records_sim");
    const list = records ? JSON.parse(records) : [];
    const sorted = list.sort((a: any, b: any) => b.createdAt - a.createdAt);
    onUpdate(sorted);

    return () => {
      const index = demoRecordsListeners.indexOf(onUpdate);
      if (index > -1) {
        demoRecordsListeners.splice(index, 1);
      }
    };
  }
};

// --- 5. AUTHENTICATION & LOGIN ---

// Shared session variables for simulator and app views
let currentSessionUser: AuthUser | null = null;
const authListeners: Array<(user: AuthUser | null) => void> = [];

const broadcastAuthChange = (user: AuthUser | null) => {
  currentSessionUser = user;
  authListeners.forEach(listener => {
    try {
      listener(user);
    } catch (e) {
      console.error("Auth listener error:", e);
    }
  });
};

let authHasResolved = false;

// Subscribe to standard Firebase Authentication state changes on startup
if (IS_FIREBASE_CONFIGURED && auth) {
  onAuthStateChanged(auth, async (fbUser) => {
    authHasResolved = true;
    if (fbUser) {
      const superAdminEmail = import.meta.env.VITE_SUPER_ADMIN_EMAIL || "superadmin@attendance.com";

      // If Firebase Auth indicates Super Admin email (if they authenticated via Auth)
      if (fbUser.email?.toLowerCase() === superAdminEmail.toLowerCase()) {
        broadcastAuthChange({
          uid: fbUser.uid,
          email: fbUser.email || "",
          role: "super_admin",
          name: "Super Administrator"
        });
      } else {
        // Fetch Principal metadata from Firestore to verify their directory status
        try {
          const docRef = fbDoc(db, "principals", fbUser.uid);
          const docSnap = await fbGetDoc(docRef);
          if (docSnap.exists()) {
            broadcastAuthChange({
              uid: fbUser.uid,
              email: fbUser.email || "",
              role: "principal",
              name: docSnap.data().name || "Principal Admin"
            });
          } else {
            // Document deleted from Firestore = Account Deactivated. Log them out.
            console.warn("User signed in but not found in principals Firestore. Signing out...");
            await signOut(auth);
            broadcastAuthChange(null);
          }
        } catch (e) {
          console.error("Failed to load principal profile on auth change:", e);
          broadcastAuthChange(null);
        }
      }
    } else {
      // Signed out from Firebase Auth. Reset session
      broadcastAuthChange(null);
    }
  });
}

export const loginUser = async (email: string, password: string): Promise<AuthUser> => {
  const superAdminEmail = import.meta.env.VITE_SUPER_ADMIN_EMAIL || "superadmin@attendance.com";
  const superAdminPass = import.meta.env.VITE_SUPER_ADMIN_PASSWORD || "superadmin123";

  // Normalize inputs
  const normEmail = email.trim().toLowerCase();

  // Check 1: Super Admin Login (Hardcoded client session)
  if (normEmail === superAdminEmail && password === superAdminPass) {
    if (IS_FIREBASE_CONFIGURED && auth) {
      try {
        await signOut(auth);
      } catch (e) {
        // ignore
      }
    }
    const user: AuthUser = {
      uid: "super_admin_session",
      email: superAdminEmail,
      role: "super_admin",
      name: "Super Administrator"
    };
    broadcastAuthChange(user);
    return user;
  }

  // Check 2: Principal Login (Standard Firebase Auth)
  if (IS_FIREBASE_CONFIGURED && auth && db) {
    try {
      const userCred = await signInWithEmailAndPassword(auth, normEmail, password);
      const uid = userCred.user.uid;

      // Verify principal profile document in Firestore
      const docRef = fbDoc(db, "principals", uid);
      const docSnap = await fbGetDoc(docRef);

      if (!docSnap.exists()) {
        await signOut(auth);
        throw new Error("This Principal account has been deactivated by the administrator.");
      }

      const user: AuthUser = {
        uid,
        email: normEmail,
        role: "principal",
        name: docSnap.data().name || "Principal Admin"
      };
      broadcastAuthChange(user);
      return user;
    } catch (err: any) {
      console.error("Firebase Sign-in Error:", err);
      throw new Error(err.message || "Authentication failed. Invalid email or password.");
    }
  } else {
    // Simulated Mode for Principal
    await new Promise(resolve => setTimeout(resolve, 600));
    const principals: Principal[] = JSON.parse(localStorage.getItem("attendance_principals_sim") || "[]");
    const matched = principals.find(p => p.email.toLowerCase() === normEmail && p.password === password);

    if (!matched) {
      throw new Error("Invalid admin email or password.");
    }

    const user: AuthUser = {
      uid: matched.id || "simulated_principal_uid",
      email: normEmail,
      role: "principal",
      name: matched.name
    };
    broadcastAuthChange(user);
    return user;
  }
};

export const logoutUser = async (): Promise<void> => {
  if (IS_FIREBASE_CONFIGURED && auth) {
    try {
      await signOut(auth);
    } catch (e) {
      // ignore
    }
  }
  broadcastAuthChange(null);
  await new Promise(resolve => setTimeout(resolve, 200));
};

export const subscribeToAuthChanges = (callback: (user: AuthUser | null) => void): (() => void) => {
  authListeners.push(callback);
  // Send current session user immediately only if it's already resolved or not configured
  if (!IS_FIREBASE_CONFIGURED || authHasResolved) {
    callback(currentSessionUser);
  }

  return () => {
    const index = authListeners.indexOf(callback);
    if (index > -1) {
      authListeners.splice(index, 1);
    }
  };
};

// --- 5. STUDENTS CRUD FUNCTIONS ---

export const getStudents = async (department: string, semester: string, academicYear: string): Promise<Student[]> => {
  if (IS_FIREBASE_CONFIGURED && db) {
    const collRef = fbCollection(db, "students");
    const q = fbQuery(
      collRef,
      fbWhere("department", "==", department),
      fbWhere("semester", "==", semester),
      fbWhere("academicYear", "==", academicYear)
    );
    const snapshot = await fbGetDocs(q);
    const result: Student[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      result.push({
        id: doc.id,
        rollNo: data.rollNo,
        name: data.name,
        department: data.department,
        semester: data.semester,
        academicYear: data.academicYear,
        createdAt: data.createdAt || 0
      });
    });
    return result.sort((a, b) => {
      const numA = parseInt(a.rollNo, 10);
      const numB = parseInt(b.rollNo, 10);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return a.rollNo.localeCompare(b.rollNo);
    });
  } else {
    const list: Student[] = JSON.parse(localStorage.getItem("attendance_students_sim") || "[]");
    const filtered = list.filter(
      s => s.department === department && s.semester === semester && s.academicYear === academicYear
    );
    return filtered.sort((a, b) => {
      const numA = parseInt(a.rollNo, 10);
      const numB = parseInt(b.rollNo, 10);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return a.rollNo.localeCompare(b.rollNo);
    });
  }
};

export const getStudentsCountMap = async (): Promise<Record<string, number>> => {
  const result: Record<string, number> = {};
  if (IS_FIREBASE_CONFIGURED && db) {
    try {
      const collRef = fbCollection(db, "students");
      const snapshot = await fbGetDocs(collRef);
      snapshot.forEach(doc => {
        const s = doc.data();
        const key = `${s.department}_${s.semester}_${s.academicYear}`;
        result[key] = (result[key] || 0) + 1;
      });
    } catch (e) {
      console.error("Failed to query student counts in Firestore:", e);
    }
  } else {
    try {
      const list: Student[] = JSON.parse(localStorage.getItem("attendance_students_sim") || "[]");
      list.forEach(s => {
        const key = `${s.department}_${s.semester}_${s.academicYear}`;
        result[key] = (result[key] || 0) + 1;
      });
    } catch (e) {
      console.error("Failed to query simulated student counts:", e);
    }
  }
  return result;
};

export const addStudent = async (
  rollNo: string,
  name: string,
  department: string,
  semester: string,
  academicYear: string
): Promise<void> => {
  const studentItem: Omit<Student, "id"> = {
    rollNo: rollNo.trim(),
    name: name.trim(),
    department,
    semester,
    academicYear,
    createdAt: Date.now()
  };

  if (IS_FIREBASE_CONFIGURED && db) {
    const collRef = fbCollection(db, "students");
    const q = fbQuery(
      collRef,
      fbWhere("department", "==", department),
      fbWhere("semester", "==", semester),
      fbWhere("academicYear", "==", academicYear),
      fbWhere("rollNo", "==", rollNo.trim())
    );
    const snapshot = await fbGetDocs(q);
    if (!snapshot.empty) {
      throw new Error(`Roll No ${rollNo} already exists in this class.`);
    }
    await fbAddDoc(collRef, studentItem);
  } else {
    const list: Student[] = JSON.parse(localStorage.getItem("attendance_students_sim") || "[]");
    const duplicate = list.some(
      s => s.department === department && s.semester === semester && s.academicYear === academicYear && s.rollNo.toLowerCase() === rollNo.trim().toLowerCase()
    );
    if (duplicate) {
      throw new Error(`Roll No ${rollNo} already exists in this class.`);
    }
    list.push({ ...studentItem, id: `sim_stud_${Date.now()}` });
    localStorage.setItem("attendance_students_sim", JSON.stringify(list));
  }
};

export const updateStudent = async (id: string, rollNo: string, name: string): Promise<void> => {
  if (IS_FIREBASE_CONFIGURED && db) {
    await fbUpdateDoc(fbDoc(db, "students", id), {
      rollNo: rollNo.trim(),
      name: name.trim()
    });
  } else {
    const list: Student[] = JSON.parse(localStorage.getItem("attendance_students_sim") || "[]");
    const index = list.findIndex(s => s.id === id);
    if (index !== -1) {
      list[index].rollNo = rollNo.trim();
      list[index].name = name.trim();
      localStorage.setItem("attendance_students_sim", JSON.stringify(list));
    }
  }
};

export const deleteStudent = async (id: string): Promise<void> => {
  if (IS_FIREBASE_CONFIGURED && db) {
    await fbDeleteDoc(fbDoc(db, "students", id));
  } else {
    const list: Student[] = JSON.parse(localStorage.getItem("attendance_students_sim") || "[]");
    const filtered = list.filter(s => s.id !== id);
    localStorage.setItem("attendance_students_sim", JSON.stringify(filtered));
  }
};

export const addStudentsBatch = async (students: Omit<Student, "id" | "createdAt">[]): Promise<void> => {
  if (IS_FIREBASE_CONFIGURED && db) {
    for (const s of students) {
      await fbAddDoc(fbCollection(db, "students"), {
        ...s,
        createdAt: Date.now()
      });
    }
  } else {
    const list: Student[] = JSON.parse(localStorage.getItem("attendance_students_sim") || "[]");
    students.forEach((s, idx) => {
      list.push({
        ...s,
        id: `sim_stud_${Date.now()}_${idx}`,
        createdAt: Date.now()
      });
    });
    localStorage.setItem("attendance_students_sim", JSON.stringify(list));
  }
};

export const subscribeToStudents = (
  onUpdate: (students: Student[]) => void, 
  onError?: (err: Error) => void
) => {
  if (IS_FIREBASE_CONFIGURED && db) {
    const collRef = fbCollection(db, "students");
    return fbOnSnapshot(
      collRef,
      (snapshot) => {
        const result: Student[] = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          result.push({
            id: doc.id,
            rollNo: data.rollNo,
            name: data.name,
            department: data.department,
            semester: data.semester,
            academicYear: data.academicYear,
            createdAt: data.createdAt || 0
          });
        });
        onUpdate(result);
      },
      (error) => {
        if (onError) onError(error);
      }
    );
  } else {
    // LocalStorage fallback
    const list: Student[] = JSON.parse(localStorage.getItem("attendance_students_sim") || "[]");
    onUpdate(list);
    return () => {};
  }
};

export interface SystemSettings {
  dateLocked: boolean;
}

export const getSystemSettings = async (): Promise<SystemSettings> => {
  if (IS_FIREBASE_CONFIGURED && db) {
    try {
      const docRef = fbDoc(db, "settings", "attendance");
      const docSnap = await fbGetDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as SystemSettings;
      } else {
        const defaultSettings = { dateLocked: false };
        await fbSetDoc(docRef, defaultSettings);
        return defaultSettings;
      }
    } catch (e) {
      console.error("Failed to load settings from Firestore:", e);
      return { dateLocked: false };
    }
  } else {
    const local = localStorage.getItem("attendance_settings_sim");
    if (local) {
      return JSON.parse(local);
    }
    return { dateLocked: false };
  }
};

export const updateSystemSettings = async (settings: Partial<SystemSettings>): Promise<void> => {
  if (IS_FIREBASE_CONFIGURED && db) {
    const docRef = fbDoc(db, "settings", "attendance");
    await fbSetDoc(docRef, settings, { merge: true });
  } else {
    const current = await getSystemSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem("attendance_settings_sim", JSON.stringify(updated));
  }
};

export const subscribeToSystemSettings = (
  onUpdate: (settings: SystemSettings) => void
) => {
  if (IS_FIREBASE_CONFIGURED && db) {
    const docRef = fbDoc(db, "settings", "attendance");
    return fbOnSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          onUpdate(docSnap.data() as SystemSettings);
        } else {
          fbSetDoc(docRef, { dateLocked: false }).then(() => {
            onUpdate({ dateLocked: false });
          });
        }
      }
    );
  } else {
    const checkLocal = () => {
      const current = localStorage.getItem("attendance_settings_sim");
      if (current) {
        onUpdate(JSON.parse(current));
      } else {
        onUpdate({ dateLocked: false });
      }
    };
    checkLocal();
    window.addEventListener("storage", checkLocal);
    return () => {
      window.removeEventListener("storage", checkLocal);
    };
  }
};

export const subscribeToStaff = (
  onUpdate: (staffList: Staff[]) => void
) => {
  if (IS_FIREBASE_CONFIGURED && db) {
    const collRef = fbCollection(db, "staff");
    return fbOnSnapshot(
      fbQuery(collRef, fbOrderBy("name")),
      (snapshot) => {
        const list: Staff[] = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          list.push({
            id: doc.id,
            name: data.name,
            department: data.department,
            email: data.email,
            createdAt: data.createdAt || 0
          });
        });
        onUpdate(list);
      }
    );
  } else {
    const checkLocal = () => {
      const list: Staff[] = JSON.parse(localStorage.getItem("attendance_staff_sim") || "[]");
      onUpdate(list.sort((a, b) => a.name.localeCompare(b.name)));
    };
    checkLocal();
    window.addEventListener("storage", checkLocal);
    return () => {
      window.removeEventListener("storage", checkLocal);
    };
  }
};
