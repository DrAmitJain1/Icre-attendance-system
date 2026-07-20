export const DEPARTMENTS = [
  "Science & Humanities",
  "Computer Engineering",
  "Electronics & Tele. Comm. Engineering",
  "Electrical Engineering",
  "Civil & Rural Engineering",
  "Mechanical Engineering - Div A",
  "Mechanical Engineering - Div B"
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

const mechanicalSubjects = {
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
};

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
      "Engineering Mechanics",
      "Applied Science (Physics/Chemistry)",
      "Basic Electrical and Electronics Engineering",
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
      "Basic Electronics",
      "Web Technologies",
      "Social and Life Skills"
    ],
    "Semester 3": [
      "Object Oriented Programming Using C++",
      "Data Structure Using C",
      "Computer Graphics",
      "Database Management System",
      "Digital Techniques",
      "Essence of Indian Constitution"
    ],
    "Semester 4": [
      "Java Programming",
      "Software Engineering",
      "Data Communication and Computer Network",
      "Microprocessors",
      "GUI Application Development Using VB.Net",
      "Environmental Studies"
    ],
    "Semester 5": [
      "Operating System",
      "Advanced Java Programming",
      "Software Testing",
      "Client Side Scripting Using JavaScript",
      "Advanced Computer Network",
      "Capstone Project Planning"
    ],
    "Semester 6": [
      "Mobile Application Development",
      "Emerging Trends in Computer and Information Technology",
      "Network and Information Security",
      "Industrial Training / Internship",
      "Project Work",
      "Entrepreneurship Development"
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
      "Electronic Components and Devices",
      "Electric Circuits and Networks",
      "Basic Electronics Workshop",
      "Social and Life Skills"
    ],
    "Semester 3": [
      "Electronic Devices and Circuits",
      "Digital Techniques",
      "Electronics Instruments and Measurement",
      "Electrical Technology",
      "C Programming Language",
      "Essence of Indian Constitution"
    ],
    "Semester 4": [
      "Linear Integrated Circuits",
      "Consumer Electronics",
      "Microcontroller and Applications",
      "Basic Feedback Control Systems",
      "Analog Communication",
      "Environmental Studies"
    ],
    "Semester 5": [
      "Digital Communication",
      "Embedded Systems",
      "Mobile and Wireless Communication",
      "Industrial Automation",
      "Microwave and Radar Engineering",
      "Capstone Project Planning"
    ],
    "Semester 6": [
      "Very Large Scale Integration (VLSI)",
      "Computer Networking and Data Communication",
      "Mechatronics",
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
      "Electrical Materials and Wiring Practice",
      "General Engineering",
      "Social and Life Skills"
    ],
    "Semester 3": [
      "Electrical Circuits",
      "Electrical Measurements and Instrumentation",
      "Electrical Power Generation",
      "Electrical Transmission and Distribution",
      "Analog Electronics",
      "Essence of Indian Constitution"
    ],
    "Semester 4": [
      "A.C. Machines",
      "D.C. Machines and Transformers",
      "Electrical Power Transmission",
      "Industrial Engineering and Management",
      "Digital Electronics and Microcontroller Applications",
      "Environmental Studies"
    ],
    "Semester 5": [
      "Switchgear and Protection",
      "Microprocessor and Microcontroller",
      "Utilization of Electrical Energy",
      "Electrical Estimation and Costing",
      "Special Electrical Machines",
      "Capstone Project Planning"
    ],
    "Semester 6": [
      "Electrical Testing and Commissioning",
      "Industrial Automation and Control",
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
  "Mechanical Engineering - Div A": mechanicalSubjects,
  "Mechanical Engineering - Div B": mechanicalSubjects
};
