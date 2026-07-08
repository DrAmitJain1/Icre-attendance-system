import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  addDoc 
} from "firebase/firestore";

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

const SUBJECT_MAPPING = {
  "Computer Engineering": {
    "Semester 1": [
      "Basic Mathematics",
      "Basic Science",
      "Communication Skills (English)",
      "Fundamentals of ICT",
      "Engineering Graphics",
      "Engineering Workshop Practice",
      "Yoga and Meditation"
    ],
    "Semester 2": [
      "Applied Mathematics",
      "Professional Communication",
      "Programming in C",
      "Basic Electrical and Electronics Engineering",
      "Web Page Designing",
      "Linux Basics",
      "Social and Life Skills"
    ],
    "Semester 3": [
      "Data Structures Using C",
      "Database Management System",
      "Digital Techniques",
      "Object Oriented Programming Using C++",
      "Computer Graphics",
      "Essence of Indian Constitution"
    ],
    "Semester 4": [
      "Java Programming",
      "Python Programming",
      "Computer Network",
      "Microprocessor",
      "Software Engineering",
      "Environmental Studies"
    ],
    "Semester 5": [
      "Operating Systems",
      "Advanced Java Programming",
      "Web-Based Application Development",
      "Computer Security",
      "Emerging Trends in Computer Engineering",
      "Capstone Project Planning"
    ],
    "Semester 6": [
      "Mobile Application Development",
      "Cloud Computing",
      "Industrial Training / Internship",
      "Project Work",
      "Entrepreneurship Development",
      "Management"
    ]
  },
  "Electronics Engineering": {
    "Semester 1": [
      "Basic Mathematics",
      "Basic Science",
      "Communication Skills (English)",
      "Fundamentals of ICT",
      "Engineering Graphics",
      "Engineering Workshop Practice",
      "Yoga and Meditation"
    ],
    "Semester 2": [
      "Applied Mathematics",
      "Professional Communication",
      "Basic Electrical Engineering",
      "Electronic Components and Devices",
      "Electronic Engineering Workshop",
      "Social and Life Skills"
    ],
    "Semester 3": [
      "Electronic Circuits",
      "Digital Electronics",
      "Network Analysis",
      "Electrical Machines",
      "Programming in C",
      "Essence of Indian Constitution"
    ],
    "Semester 4": [
      "Microcontroller and Applications",
      "Analog Communication",
      "Linear Integrated Circuits",
      "Power Electronics",
      "Consumer Electronics",
      "Environmental Studies"
    ],
    "Semester 5": [
      "Digital Communication",
      "Embedded Systems",
      "Industrial Electronics",
      "VLSI",
      "Computer Hardware and Networking",
      "Capstone Project Planning"
    ],
    "Semester 6": [
      "Industrial Automation",
      "Internet of Things (IoT)",
      "Microwave and Satellite Communication",
      "Industrial Training / Internship",
      "Project Work",
      "Entrepreneurship Development"
    ]
  },
  "Electrical Engineering": {
    "Semester 1": [
      "Basic Mathematics",
      "Basic Science",
      "Communication Skills (English)",
      "Fundamentals of ICT",
      "Engineering Graphics",
      "Engineering Workshop Practice",
      "Yoga and Meditation"
    ],
    "Semester 2": [
      "Applied Mathematics",
      "Professional Communication",
      "Basic Electrical Engineering",
      "Electrical Workshop",
      "Electronic Components and Devices",
      "Social and Life Skills"
    ],
    "Semester 3": [
      "Electrical Circuits",
      "Electrical Machines",
      "Digital Electronics",
      "Electrical Measuring Instruments",
      "Programming in C",
      "Essence of Indian Constitution"
    ],
    "Semester 4": [
      "Power Generation",
      "Power Electronics",
      "Electrical Installation and Maintenance",
      "AC Machines",
      "Microcontroller and Applications",
      "Environmental Studies"
    ],
    "Semester 5": [
      "Transmission and Distribution of Electrical Power",
      "Switchgear and Protection",
      "Industrial Automation",
      "Utilization of Electrical Energy",
      "Renewable Energy Sources",
      "Capstone Project Planning"
    ],
    "Semester 6": [
      "Electrical Design, Estimation and Costing",
      "Industrial Drives and Control",
      "Energy Conservation and Audit",
      "Industrial Training / Internship",
      "Project Work",
      "Entrepreneurship Development"
    ]
  },
  "Civil Engineering": {
    "Semester 1": [
      "Basic Mathematics",
      "Basic Science",
      "Communication Skills (English)",
      "Fundamentals of ICT",
      "Engineering Graphics",
      "Engineering Workshop Practice",
      "Yoga and Meditation"
    ],
    "Semester 2": [
      "Applied Mathematics",
      "Professional Communication",
      "Building Construction",
      "Engineering Mechanics",
      "Surveying",
      "Social and Life Skills"
    ],
    "Semester 3": [
      "Construction Materials",
      "Concrete Technology",
      "Surveying",
      "Strength of Materials",
      "Computer-Aided Drafting",
      "Essence of Indian Constitution"
    ],
    "Semester 4": [
      "Structural Engineering",
      "Transportation Engineering",
      "Geotechnical Engineering",
      "Water Supply Engineering",
      "Environmental Studies",
      "Civil Engineering Drawing"
    ],
    "Semester 5": [
      "Design of Reinforced Cement Concrete Structures",
      "Quantity Surveying and Valuation",
      "Construction Management",
      "Environmental Engineering",
      "Advanced Surveying",
      "Capstone Project Planning"
    ],
    "Semester 6": [
      "Estimating and Costing",
      "Irrigation Engineering",
      "Maintenance and Repairs of Structures",
      "Industrial Training / Internship",
      "Project Work",
      "Entrepreneurship Development"
    ]
  },
  "Mechanical Engineering": {
    "Semester 1": [
      "Basic Mathematics",
      "Basic Science",
      "Communication Skills (English)",
      "Fundamentals of ICT",
      "Engineering Graphics",
      "Engineering Workshop Practice",
      "Yoga and Meditation"
    ],
    "Semester 2": [
      "Applied Mathematics",
      "Professional Communication",
      "Engineering Mechanics",
      "Basic Manufacturing Processes",
      "Engineering Materials",
      "Social and Life Skills"
    ],
    "Semester 3": [
      "Manufacturing Processes",
      "Strength of Materials",
      "Thermal Engineering",
      "Machine Drawing",
      "Computer Aided Drafting",
      "Essence of Indian Constitution"
    ],
    "Semester 4": [
      "Theory of Machines",
      "Fluid Mechanics and Machinery",
      "Metrology and Quality Control",
      "Hydraulics and Pneumatics",
      "Electrical and Electronics Engineering",
      "Environmental Studies"
    ],
    "Semester 5": [
      "Design of Machine Elements",
      "Industrial Engineering",
      "CNC Machines and Automation",
      "Refrigeration and Air Conditioning",
      "Production Planning and Control",
      "Capstone Project Planning"
    ],
    "Semester 6": [
      "Automobile Engineering",
      "Advanced Manufacturing Processes",
      "Industrial Training / Internship",
      "Project Work",
      "Entrepreneurship Development",
      "Management"
    ]
  }
};

async function seedSubjects() {
  const collRef = collection(db, "subjects");

  console.log("1. Fetching current subjects in Firestore...");
  const snapshot = await getDocs(collRef);
  console.log(`Found ${snapshot.size} existing subjects. Deleting them to avoid duplicates...`);
  
  let deleteCount = 0;
  for (const docSnap of snapshot.docs) {
    await deleteDoc(doc(db, "subjects", docSnap.id));
    deleteCount++;
  }
  console.log(`Deleted ${deleteCount} subject documents.`);

  console.log("2. Uploading new curriculum subjects map...");
  let insertCount = 0;
  for (const [dept, semesters] of Object.entries(SUBJECT_MAPPING)) {
    for (const [sem, subjects] of Object.entries(semesters)) {
      for (const subjectName of subjects) {
        await addDoc(collRef, {
          name: subjectName,
          department: dept,
          semester: sem,
          createdAt: Date.now()
        });
        insertCount++;
      }
    }
  }

  console.log(`Successfully uploaded ${insertCount} curriculum subjects to Firestore!`);
  console.log("Subject seeding operation completed. Exiting.");
  process.exit(0);
}

seedSubjects().catch(err => {
  console.error("Error seeding subjects:", err);
  process.exit(1);
});
