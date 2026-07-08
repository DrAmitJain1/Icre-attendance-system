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

const mockStaff = [
  // Science & Humanities
  { name: "Prof. S. A. Kulkarni", department: "Science & Humanities", createdAt: Date.now() },
  { name: "Prof. R. V. Nikam", department: "Science & Humanities", createdAt: Date.now() },

  // Computer
  { name: "Dr. Ranjeet Powar", department: "Computer Engineering", createdAt: Date.now() },
  { name: "Prof. Amit Patil", department: "Computer Engineering", createdAt: Date.now() },
  { name: "Prof. Neha Shah", department: "Computer Engineering", createdAt: Date.now() },
  
  // Electronics & Tele. Comm.
  { name: "Prof. Vijay Mane", department: "Electronics & Tele. Comm. Engineering", createdAt: Date.now() },
  { name: "Prof. Sanjay Patil", department: "Electronics & Tele. Comm. Engineering", createdAt: Date.now() },
  { name: "Prof. K. P. Salunkhe", department: "Electronics & Tele. Comm. Engineering", createdAt: Date.now() },
  
  // Electrical
  { name: "Prof. S. R. Joshi", department: "Electrical Engineering", createdAt: Date.now() },
  { name: "Prof. A. B. Deshmukh", department: "Electrical Engineering", createdAt: Date.now() },
  { name: "Prof. M. S. Gaikwad", department: "Electrical Engineering", createdAt: Date.now() },
  
  // Civil & Rural
  { name: "Dr. N. M. Kulkarni", department: "Civil & Rural Engineering", createdAt: Date.now() },
  { name: "Prof. P. V. Ghadge", department: "Civil & Rural Engineering", createdAt: Date.now() },
  { name: "Prof. R. D. Shinde", department: "Civil & Rural Engineering", createdAt: Date.now() },
  
  // Mechanical
  { name: "Prof. S. H. Sawant", department: "Mechanical Engineering", createdAt: Date.now() },
  { name: "Prof. J. K. Patil", department: "Mechanical Engineering", createdAt: Date.now() },
  { name: "Prof. A. R. Kale", department: "Mechanical Engineering", createdAt: Date.now() }
];

async function seedStaff() {
  const collRef = collection(db, "staff");

  console.log("1. Fetching current staff in Firestore...");
  const snapshot = await getDocs(collRef);
  console.log(`Found ${snapshot.size} existing staff. Deleting to avoid duplicates...`);
  
  for (const docSnap of snapshot.docs) {
    await deleteDoc(doc(db, "staff", docSnap.id));
  }
  console.log("Deleted all old staff entries.");

  console.log("2. Uploading new staff directory...");
  let count = 0;
  for (const staff of mockStaff) {
    await addDoc(collRef, staff);
    count++;
  }
  console.log(`Successfully seeded ${count} staff members across all departments in Firestore!`);
  process.exit(0);
}

seedStaff().catch(err => {
  console.error("Error seeding staff:", err);
  process.exit(1);
});
