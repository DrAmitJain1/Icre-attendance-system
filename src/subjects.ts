export const DEPARTMENTS = [
  "Science & Humanities",
  "Computer Engineering",
  "Electronics & Tele. Comm. Engineering",
  "Electrical Engineering",
  "Civil & Rural Engineering",
  "Mechanical Engineering"
] as const;

export type Department = typeof DEPARTMENTS[number];

export const SEMESTERS = [
  "Semester 1",
  "Semester 2",
  "Semester 3",
  "Semester 4",
  "Semester 5",
  "Semester 6"
] as const;

export type Semester = typeof SEMESTERS[number];

export const SUBJECT_MAPPING: Record<Department, Record<Semester, string[]>> = {
  "Science & Humanities": {
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
      "Electronic Components and Devices",
      "Building Construction",
      "Engineering Mechanics",
      "Surveying",
      "Basic Manufacturing Processes",
      "Engineering Materials",
      "Social and Life Skills"
    ],
    "Semester 3": [],
    "Semester 4": [],
    "Semester 5": [],
    "Semester 6": []
  },
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
  "Electronics & Tele. Comm. Engineering": {
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
  "Civil & Rural Engineering": {
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

