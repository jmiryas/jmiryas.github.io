export const profile = {
  name: "Rizky Ramadhan",
  role: "Fullstack Web Developer",
  location: "South Jakarta, Indonesia",
  email: "jmiryas@email.com",
  linkedin: "https://www.linkedin.com/in/rizky-ramadhan-7418b6268/",
  // Menggunakan path dari markdown
  photo: "/assets/profile.png",
  about: `Fullstack Developer with 2+ years of experience dedicated to building efficient backend architectures. I have had the opportunity to optimize complex systems, resulting in a 99% reduction in processing time and the successful management of high-volume payment integrations. My work prioritizes scalability and stability, utilizing tools like Redis and RabbitMQ to solve technical challenges effectively.`,
};

export const experiences = [
  {
    company: "PT Metrocom Jaddi Technology",
    role: "Fullstack Web Developer",
    period: "Oct 2025 - Present",
  },
  {
    company: "CV. Prabubima Tech",
    role: "Fullstack Web Developer",
    period: "Oct 2023 - Sep 2025",
  },
];

export const projects = [
  {
    title: "Mortgage Scheduling System",
    company: "PT Bank Tabungan Negara (BTN)",
    year: "2025",
    tech: [
      "JavaScript",
      "Express.js",
      "Redis",
      "RabbitMQ",
      "MySQL",
      "REST API",
    ],
    image: "/assets/btn1.png",
    description:
      "Engineered a high-concurrency scheduling system for Mortgage signing to strictly prevent race conditions and double-bookings.",
    problem:
      "Manual coordination between debtors, notaries, and developers led to frequent double-bookings and lack of service quality monitoring.",
    solution:
      "Implemented Self-Service Scheduling with Redis Locks for concurrency control and an Automated Notification Engine.",
    impact: [
      "Eliminated scheduling conflicts and double-bookings.",
      "Automated reminders with precise location details.",
      "Implemented digital review system for quality assurance.",
    ],
  },
  {
    title: "Chronos Attendance Engine",
    company: "Freelance",
    year: "2025",
    tech: ["PHP", "Laravel", "SQLite", "Chart.js", "Tailwind"],
    image: "/assets/scm1.png",
    description:
      "Reduced payroll processing time by 99% (from 1 business day to <5 minutes) by automating raw fingerprint data parsing.",
    problem:
      "Reconciling raw attendance data from disparate fingerprint machines took 8+ hours manually, leading to human errors in penalty calculations.",
    solution:
      "Created a Universal Data Parser to normalize logs and a dynamic calculation engine for automatic penalty/leave assessment.",
    impact: [
      "99% efficiency gain (process time reduced from 1 day to 5 minutes).",
      "Unified data from various hardware brands into a single structure.",
      "Eliminated payroll discrepancies through automated logic.",
    ],
  },
  {
    title: "Bank Payment Integrations (BRI & BNI)",
    company: "CV Prabubima Tech",
    year: "2024 - 2025",
    tech: ["PHP", "Laravel", "REST API", "Payment Gateway", "MySQL"],
    image: "/assets/bri2.png",
    description:
      "Automated school tuition payments via Virtual Accounts, eliminating manual reconciliation.",
    problem:
      "Manual bank mutation checks for school fees were inefficient, slow, and prone to human error.",
    solution:
      "Developed a Unified Payment Module integrating BRI & BNI VA systems with secure callback handling.",
    impact: [
      "Eliminated manual payment verification for finance teams.",
      "Zero delay in processing with real-time callbacks.",
      "Enhanced transparency for parents with instant payment proof.",
    ],
  },
  {
    title: "Notify App",
    company: "CV Prabubima Tech",
    year: "2025",
    tech: ["PHP", "Laravel", "Queue Jobs", "MySQL", "Throttling"],
    image: "/assets/notify2.png",
    description:
      "High-volume notification engine ensuring safe delivery of 2,000+ daily messages without spam blocking.",
    problem:
      "Bulk messaging (WhatsApp/Email) resulted in numbers being blocked by providers due to spam detection.",
    solution:
      "Implemented a centralized message queue with throttling, rate-limiting, and retry mechanisms.",
    impact: [
      "Minimized numbers blocked by providers due to safe throttling.",
      "99% delivery reliability.",
      "Real-time monitoring of message delivery status.",
    ],
  },
  {
    title: "Library App (RFID Integrated)",
    company: "CV Prabubima Tech",
    year: "2025",
    tech: ["PHP", "Yii2", "MySQL", "JavaScript", "RFID Hardware"],
    image: "/assets/sipus3.png",
    description:
      "Self-service library system integrated with RFID hardware to automate borrowing and returning processes.",
    problem:
      "Manual borrowing caused long queues, errors, and dependency on staff, with limited data insights.",
    solution:
      "Developed an RFID-integrated app for self-service tapping and comprehensive reporting dashboards.",
    impact: [
      "Reduced queues with self-service tapping.",
      "Minimized manual transaction errors.",
      "Provided real-time insights on popular books and active readers.",
    ],
  },
  {
    title: "School Billing & Pocket Money",
    company: "CV Prabubima Tech",
    year: "2024",
    tech: ["JavaScript", "React.js", "REST API", "Tailwind"],
    image: "/assets/mbs3.png",
    description:
      "A centralized parent app for tracking school bills, pocket money usage, and payment history.",
    problem:
      "Parents struggled to track bills, monitor child's pocket money usage, and view payment history.",
    solution:
      "Built a responsive React.js mobile app for real-time billing updates and pocket money tracking.",
    impact: [
      "Increased visibility on school bills for parents.",
      "Allowed monitoring of daily pocket money spending.",
      "Centralized access to payment history and receipts.",
    ],
  },
  {
    title: "eTest Learning Assessment",
    company: "CV Prabubima Tech",
    year: "2025",
    tech: ["PHP", "Laravel", "MySQL", "JavaScript", "Bootstrap"],
    image: "/assets/eTest1.png",
    description:
      "Assessment platform comparing Pre-test vs Post-test scores to quantify learning effectiveness.",
    problem:
      "Instructors lacked data on the actual impact of their materials, and manual grading was a bottleneck.",
    solution:
      "Implemented structured Pre-test → Material → Post-test flow with automated grading for objective questions.",
    impact: [
      "Quantified learning outcomes through Learning Gain calculation.",
      "Removed grading bottlenecks with automated scoring.",
      "Provided data-driven insights into curriculum effectiveness.",
    ],
  },
];
