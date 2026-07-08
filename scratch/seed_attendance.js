import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBTBEK_HcuD4S8-iFfO1y3aq6stWPr-gtI",
  authDomain: "attendence-system-51222.firebaseapp.com",
  projectId: "attendence-system-51222",
  storageBucket: "attendence-system-51222.firebasestorage.app",
  messagingSenderId: "72141614867",
  appId: "1:72141614867:web:051df0088b00dfa98234e6",
  measurementId: "G-BEW2MHZ89W"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Realistic multi-lecture records for July 2026
const mockAttendanceLogs = [
  // --- Class 1: Computer Engineering, Sem 3, Data Structures Using C (8 Lectures) ---
  {
    academicYear: "2026-2027",
    department: "Computer Engineering",
    semester: "Semester 3",
    subject: "Data Structures Using C",
    staffName: "Dr. Ranjeet Powar",
    date: "2026-07-01",
    startTime: "09:00",
    endTime: "10:00",
    absentNos: "5, 12, 18, 45, 52",
    createdAt: Date.now() - 700000000
  },
  {
    academicYear: "2026-2027",
    department: "Computer Engineering",
    semester: "Semester 3",
    subject: "Data Structures Using C",
    staffName: "Dr. Ranjeet Powar",
    date: "2026-07-02",
    startTime: "09:00",
    endTime: "10:00",
    absentNos: "5, 12, 22, 31, 45",
    createdAt: Date.now() - 600000000
  },
  {
    academicYear: "2026-2027",
    department: "Computer Engineering",
    semester: "Semester 3",
    subject: "Data Structures Using C",
    staffName: "Dr. Ranjeet Powar",
    date: "2026-07-03",
    startTime: "09:00",
    endTime: "10:00",
    absentNos: "5, 18, 22, 52, 59",
    createdAt: Date.now() - 500000000
  },
  {
    academicYear: "2026-2027",
    department: "Computer Engineering",
    semester: "Semester 3",
    subject: "Data Structures Using C",
    staffName: "Dr. Ranjeet Powar",
    date: "2026-07-04",
    startTime: "09:00",
    endTime: "10:00",
    absentNos: "12, 18, 31, 45, 59",
    createdAt: Date.now() - 400000000
  },
  {
    academicYear: "2026-2027",
    department: "Computer Engineering",
    semester: "Semester 3",
    subject: "Data Structures Using C",
    staffName: "Dr. Ranjeet Powar",
    date: "2026-07-05",
    startTime: "09:00",
    endTime: "10:00",
    absentNos: "5, 12, 22, 52, 59",
    createdAt: Date.now() - 300000000
  },
  {
    academicYear: "2026-2027",
    department: "Computer Engineering",
    semester: "Semester 3",
    subject: "Data Structures Using C",
    staffName: "Dr. Ranjeet Powar",
    date: "2026-07-06",
    startTime: "09:00",
    endTime: "10:00",
    absentNos: "5, 18, 31, 45, 52",
    createdAt: Date.now() - 200000000
  },
  {
    academicYear: "2026-2027",
    department: "Computer Engineering",
    semester: "Semester 3",
    subject: "Data Structures Using C",
    staffName: "Dr. Ranjeet Powar",
    date: "2026-07-07",
    startTime: "09:00",
    endTime: "10:00",
    absentNos: "5, 12, 18, 22, 59",
    createdAt: Date.now() - 100000000
  },
  {
    academicYear: "2026-2027",
    department: "Computer Engineering",
    semester: "Semester 3",
    subject: "Data Structures Using C",
    staffName: "Dr. Ranjeet Powar",
    date: "2026-07-08",
    startTime: "09:00",
    endTime: "10:00",
    absentNos: "12, 18, 22, 31, 52",
    createdAt: Date.now()
  },

  // --- Class 2: Mechanical Engineering, Sem 5, Design of Machine Elements (6 Lectures) ---
  {
    academicYear: "2026-2027",
    department: "Mechanical Engineering",
    semester: "Semester 5",
    subject: "Design of Machine Elements",
    staffName: "Prof. S. H. Sawant",
    date: "2026-07-01",
    startTime: "11:00",
    endTime: "12:00",
    absentNos: "3, 9, 15, 27",
    createdAt: Date.now() - 650000000
  },
  {
    academicYear: "2026-2027",
    department: "Mechanical Engineering",
    semester: "Semester 5",
    subject: "Design of Machine Elements",
    staffName: "Prof. S. H. Sawant",
    date: "2026-07-02",
    startTime: "11:00",
    endTime: "12:00",
    absentNos: "3, 9, 33",
    createdAt: Date.now() - 550000000
  },
  {
    academicYear: "2026-2027",
    department: "Mechanical Engineering",
    semester: "Semester 5",
    subject: "Design of Machine Elements",
    staffName: "Prof. S. H. Sawant",
    date: "2026-07-03",
    startTime: "11:00",
    endTime: "12:00",
    absentNos: "3, 15, 27, 33",
    createdAt: Date.now() - 450000000
  },
  {
    academicYear: "2026-2027",
    department: "Mechanical Engineering",
    semester: "Semester 5",
    subject: "Design of Machine Elements",
    staffName: "Prof. S. H. Sawant",
    date: "2026-07-06",
    startTime: "11:00",
    endTime: "12:00",
    absentNos: "9, 15, 27",
    createdAt: Date.now() - 250000000
  },
  {
    academicYear: "2026-2027",
    department: "Mechanical Engineering",
    semester: "Semester 5",
    subject: "Design of Machine Elements",
    staffName: "Prof. S. H. Sawant",
    date: "2026-07-07",
    startTime: "11:00",
    endTime: "12:00",
    absentNos: "3, 9, 15, 33",
    createdAt: Date.now() - 150000000
  },
  {
    academicYear: "2026-2027",
    department: "Mechanical Engineering",
    semester: "Semester 5",
    subject: "Design of Machine Elements",
    staffName: "Prof. S. H. Sawant",
    date: "2026-07-08",
    startTime: "11:00",
    endTime: "12:00",
    absentNos: "9, 27, 33",
    createdAt: Date.now() - 5000000
  },

  // --- Class 3: Electronics Engineering, Sem 4, Analog Communication (5 Lectures) ---
  {
    academicYear: "2026-2027",
    department: "Electronics Engineering",
    semester: "Semester 4",
    subject: "Analog Communication",
    staffName: "Prof. Vijay Mane",
    date: "2026-07-01",
    startTime: "10:00",
    endTime: "11:00",
    absentNos: "7, 14, 21",
    createdAt: Date.now() - 620000000
  },
  {
    academicYear: "2026-2027",
    department: "Electronics Engineering",
    semester: "Semester 4",
    subject: "Analog Communication",
    staffName: "Prof. Vijay Mane",
    date: "2026-07-03",
    startTime: "10:00",
    endTime: "11:00",
    absentNos: "7, 14, 28, 35",
    createdAt: Date.now() - 420000000
  },
  {
    academicYear: "2026-2027",
    department: "Electronics Engineering",
    semester: "Semester 4",
    subject: "Analog Communication",
    staffName: "Prof. Vijay Mane",
    date: "2026-07-06",
    startTime: "10:00",
    endTime: "11:00",
    absentNos: "7, 21, 28",
    createdAt: Date.now() - 220000000
  },
  {
    academicYear: "2026-2027",
    department: "Electronics Engineering",
    semester: "Semester 4",
    subject: "Analog Communication",
    staffName: "Prof. Vijay Mane",
    date: "2026-07-07",
    startTime: "10:00",
    endTime: "11:00",
    absentNos: "14, 21, 28, 35",
    createdAt: Date.now() - 120000000
  },
  {
    academicYear: "2026-2027",
    department: "Electronics Engineering",
    semester: "Semester 4",
    subject: "Analog Communication",
    staffName: "Prof. Vijay Mane",
    date: "2026-07-08",
    startTime: "10:00",
    endTime: "11:00",
    absentNos: "7, 14, 21, 35",
    createdAt: Date.now() - 8000000
  },

  // --- Class 4: Electrical Engineering, Sem 4, AC Machines (5 Lectures) ---
  {
    academicYear: "2026-2027",
    department: "Electrical Engineering",
    semester: "Semester 4",
    subject: "AC Machines",
    staffName: "Prof. S. R. Joshi",
    date: "2026-07-02",
    startTime: "09:00",
    endTime: "10:00",
    absentNos: "4, 10, 20",
    createdAt: Date.now() - 580000000
  },
  {
    academicYear: "2026-2027",
    department: "Electrical Engineering",
    semester: "Semester 4",
    subject: "AC Machines",
    staffName: "Prof. S. R. Joshi",
    date: "2026-07-03",
    startTime: "09:00",
    endTime: "10:00",
    absentNos: "4, 30, 40",
    createdAt: Date.now() - 480000000
  },
  {
    academicYear: "2026-2027",
    department: "Electrical Engineering",
    semester: "Semester 4",
    subject: "AC Machines",
    staffName: "Prof. S. R. Joshi",
    date: "2026-07-06",
    startTime: "09:00",
    endTime: "10:00",
    absentNos: "10, 20, 30",
    createdAt: Date.now() - 280000000
  },
  {
    academicYear: "2026-2027",
    department: "Electrical Engineering",
    semester: "Semester 4",
    subject: "AC Machines",
    staffName: "Prof. S. R. Joshi",
    date: "2026-07-07",
    startTime: "09:00",
    endTime: "10:00",
    absentNos: "4, 10, 20, 40",
    createdAt: Date.now() - 180000000
  },
  {
    academicYear: "2026-2027",
    department: "Electrical Engineering",
    semester: "Semester 4",
    subject: "AC Machines",
    staffName: "Prof. S. R. Joshi",
    date: "2026-07-08",
    startTime: "09:00",
    endTime: "10:00",
    absentNos: "4, 20, 30, 40",
    createdAt: Date.now() - 12000000
  },

  // --- Class 5: Civil Engineering, Sem 6, Estimating and Costing (4 Lectures) ---
  {
    academicYear: "2026-2027",
    department: "Civil Engineering",
    semester: "Semester 6",
    subject: "Estimating and Costing",
    staffName: "Dr. N. M. Kulkarni",
    date: "2026-07-02",
    startTime: "14:00",
    endTime: "15:00",
    absentNos: "1, 11, 21",
    createdAt: Date.now() - 570000000
  },
  {
    academicYear: "2026-2027",
    department: "Civil Engineering",
    semester: "Semester 6",
    subject: "Estimating and Costing",
    staffName: "Dr. N. M. Kulkarni",
    date: "2026-07-03",
    startTime: "14:00",
    endTime: "15:00",
    absentNos: "1, 21, 31",
    createdAt: Date.now() - 470000000
  },
  {
    academicYear: "2026-2027",
    department: "Civil Engineering",
    semester: "Semester 6",
    subject: "Estimating and Costing",
    staffName: "Dr. N. M. Kulkarni",
    date: "2026-07-06",
    startTime: "14:00",
    endTime: "15:00",
    absentNos: "1, 11, 31",
    createdAt: Date.now() - 270000000
  },
  {
    academicYear: "2026-2027",
    department: "Civil Engineering",
    semester: "Semester 6",
    subject: "Estimating and Costing",
    staffName: "Dr. N. M. Kulkarni",
    date: "2026-07-07",
    startTime: "14:00",
    endTime: "15:00",
    absentNos: "11, 21, 31",
    createdAt: Date.now() - 170000000
  }
];

async function seedAttendance() {
  const collRef = collection(db, "attendance");

  console.log("1. Fetching current attendance records in Firestore...");
  const snapshot = await getDocs(collRef);
  console.log(`Found ${snapshot.size} existing records. Deleting to avoid overlaps...`);
  
  for (const docSnap of snapshot.docs) {
    await deleteDoc(doc(db, "attendance", docSnap.id));
  }
  console.log("Deleted old logs.");

  console.log("2. Seeding fresh, multi-lecture attendance dataset...");
  let count = 0;
  for (const log of mockAttendanceLogs) {
    await addDoc(collRef, log);
    count++;
  }
  console.log(`Successfully uploaded ${count} logs to Firestore!`);
  process.exit(0);
}

seedAttendance().catch(err => {
  console.error("Error seeding attendance:", err);
  process.exit(1);
});
