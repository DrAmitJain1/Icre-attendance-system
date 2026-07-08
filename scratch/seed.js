import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

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

const mockData = [
  {
    academicYear: "2026-2027",
    department: "Computer Engineering",
    semester: "Semester 3",
    subject: "Data Structures Using C",
    staffName: "Dr. Ranjeet Powar",
    date: "2026-07-08",
    startTime: "10:00",
    endTime: "11:00",
    absentNos: "5, 12, 18",
    createdAt: Date.now() - 50000000
  },
  {
    academicYear: "2026-2027",
    department: "Mechanical Engineering",
    semester: "Semester 5",
    subject: "Design of Machine Elements",
    staffName: "Prof. Amit Patil",
    date: "2026-07-08",
    startTime: "11:15",
    endTime: "12:15",
    absentNos: "2, 8",
    createdAt: Date.now() - 40000000
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
    absentNos: "14, 25, 33, 40",
    createdAt: Date.now() - 150000000
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
    absentNos: "1, 9, 15",
    createdAt: Date.now() - 120000000
  },
  {
    academicYear: "2026-2027",
    department: "Computer Engineering",
    semester: "Semester 1",
    subject: "Basic Mathematics",
    staffName: "Prof. Neha Shah",
    date: "2026-07-06",
    startTime: "10:00",
    endTime: "11:00",
    absentNos: "",
    createdAt: Date.now() - 250000000
  }
];

async function seed() {
  console.log("Starting data seeding to Firebase Firestore...");
  for (const record of mockData) {
    try {
      const docRef = await addDoc(collection(db, "attendance"), record);
      console.log(`Successfully added document: ${docRef.id} for ${record.department} - ${record.subject}`);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  }
  console.log("Seeding complete. Exiting.");
  process.exit(0);
}

seed();
