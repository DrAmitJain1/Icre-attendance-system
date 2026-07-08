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
  type DocumentData
} from "firebase/firestore";
import { SUBJECT_MAPPING, DEPARTMENTS, SEMESTERS } from "./subjects";

// --- INTERFACES ---

export interface AttendanceRecord {
  id?: string;
  academicYear: string;
  department: string;
  semester: string;
  subject: string;
  staffName: string;
  date: string;
  startTime: string;
  endTime: string;
  absentNos: string;
  createdAt: number;
}

export interface Staff {
  id?: string;
  name: string;
  department: string;
  createdAt: number;
}

export interface SubjectItem {
  id?: string;
  name: string;
  department: string;
  semester: string;
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

const DEFAULT_DEMO_STAFF: Staff[] = [
  { name: "Dr. Ranjeet Powar", department: "Computer Engineering", createdAt: Date.now() },
  { name: "Prof. Amit Patil", department: "Computer Engineering", createdAt: Date.now() },
  { name: "Prof. S. R. Joshi", department: "Electrical Engineering", createdAt: Date.now() },
  { name: "Dr. N. M. Kulkarni", department: "Civil Engineering", createdAt: Date.now() }
];

const DEFAULT_DEMO_PRINCIPALS: Principal[] = [
  { email: "principal@attendance.com", password: "principal123", name: "Dr. Ranjeet Powar", createdAt: Date.now() }
];

// Initialize local storage collections if they don't exist
const initializeDemoDB = () => {
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
        createdAt: data.createdAt || 0
      });
    });
    // Sort in memory to avoid index requirements
    return result.sort((a, b) => b.createdAt - a.createdAt);
  } else {
    // Simulated Mode
    const list: Staff[] = JSON.parse(localStorage.getItem("attendance_staff_sim") || "[]");
    const filtered = department ? list.filter(s => s.department === department) : list;
    return filtered.sort((a, b) => b.createdAt - a.createdAt);
  }
};

export const addStaff = async (name: string, department: string): Promise<void> => {
  const staffItem: Omit<Staff, "id"> = {
    name: name.trim(),
    department,
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

// --- 2. SUBJECTS CRUD FUNCTIONS ---

export const getSubjects = async (department: string, semester: string): Promise<SubjectItem[]> => {
  if (IS_FIREBASE_CONFIGURED && db) {
    const collRef = fbCollection(db, "subjects");
    // Equality-only query (does not require composite index!)
    const q = fbQuery(
      collRef, 
      fbWhere("department", "==", department), 
      fbWhere("semester", "==", semester)
    );
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
    const filtered = list.filter(s => s.department === department && s.semester === semester);
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }
};

export const addSubject = async (name: string, department: string, semester: string): Promise<void> => {
  const subjectItem: Omit<SubjectItem, "id"> = {
    name: name.trim(),
    department,
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

// Subscribe to standard Firebase Authentication state changes on startup
if (IS_FIREBASE_CONFIGURED && auth) {
  onAuthStateChanged(auth, async (fbUser) => {
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
      // Signed out from Firebase Auth. Reset session only if they were principal
      if (currentSessionUser && currentSessionUser.role === "principal") {
        broadcastAuthChange(null);
      }
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
  // Send current session user immediately
  callback(currentSessionUser);

  return () => {
    const index = authListeners.indexOf(callback);
    if (index > -1) {
      authListeners.splice(index, 1);
    }
  };
};
