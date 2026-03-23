export const projects = [
  {
    id: "btn-properti",
    year: "2026",
    company: "Bank BTN",
    title: "Mortgage Scheduling System",
    img: "/images/btn1.png",
    desc: "Engineered a high-concurrency scheduling system for Mortgage signing to strictly prevent race conditions and double bookings.",
    problem:
      "Manual coordination between debtors, notaries, and developers led to frequent double-bookings and lack of service quality monitoring.",
    solution:
      "Implemented Self Service Scheduling with Redis Locks for concurrency control and an Automated Notification Engine.",
    impacts: [
      "Eliminated scheduling conflicts and double bookings.",
      "Automated reminders with precise location details.",
      "Implemented digital review system for quality assurance.",
    ],
    tech: "Next.js • Express.js • JavaScript • RabbitMQ • Redis • MySQL",
  },
  {
    id: "chronos",
    year: "2026",
    company: "Freelance",
    title: "Chronos Attendance Engine",
    img: "/images/chronos1.png",
    desc: "Reduced payroll processing time by 99% (from 1 business day to < 5 minutes) by automating raw fingerprint data parsing.",
    problem:
      "Reconciling raw attendance data from disparate fingerprint machines took 8+ hours manually, leading to human errors in penalty calculations.",
    solution:
      "Created a Universal Data Parser to normalize logs and a dynamic calculation engine for automatic penalty/leave assessment.",
    impacts: [
      "99% efficiency gain (process time reduced from 1 day to 5 minutes).",
      "Unified data from various hardware brands into a single structure.",
      "Eliminated payroll discrepancies through automated logic.",
    ],
    tech: "PHP • Laravel • MySQL • Chart.js • Tailwind CSS",
  },
  {
    id: "payment",
    year: "2024 - 2025",
    company: "CV. Prabubima Tech",
    title: "Bank Payment Integrations (BRI & BNI)",
    img: "/images/bri1.png",
    desc: "Automated school tuition payments via Virtual Accounts, eliminating manual reconciliation.",
    problem:
      "Manual bank mutation checks for school fees were inefficient, slow, and prone to human error.",
    solution:
      "Developed a Unified Payment Module integrating BRI & BNI VA systems with secure callback handling.",
    impacts: [
      "Eliminated manual payment verification for finance teams.",
      "Zero delay in processing with real time callbacks.",
      "Enhanced transparency for parents with instant payment proof.",
    ],
    tech: "PHP • Laravel • MySQL • REST API • Payment Gateway",
  },
  {
    id: "notify",
    year: "2025",
    company: "CV. Prabubima Tech",
    title: "Notify App",
    img: "/images/notify2.png",
    desc: "High volume notification engine ensuring safe delivery of 2.000+ daily messages without spam blocking.",
    problem:
      "Bulk messaging (WhatsApp/Email) resulted in numbers being blocked by providers due to spam detection.",
    solution:
      "Implemented a centralized message queue with throttling, rate limiting, and retry mechanisms.",
    impacts: [
      "Minimized numbers blocked by providers due to safe throttling.",
      "99% delivery reliability.",
      "Real-time monitoring of message delivery status.",
    ],
    tech: "PHP • Laravel • Queue Jobs • MySQL • Throttling",
  },
  {
    id: "library-rfid",
    year: "2025",
    company: "CV. Prabubima Tech",
    title: "Library App (RFID Integrated)",
    img: "/images/sipus3.png",
    desc: "Self service library system integrated with RFID hardware to automate borrowing and returning processes.",
    problem:
      "Manual borrowing caused long queues, errors, and dependency on staff, with limited data insights.",
    solution:
      "Developed an RFID integrated app for self service tapping and comprehensive reporting dashboards.",
    impacts: [
      "Reduced queues with self service tapping.",
      "Minimized manual transaction errors.",
      "Provided real time insights on popular books and active readers.",
    ],
    tech: "PHP • Yii2 • MySQL • JavaScript • RFID Hardware",
  },
  {
    id: "school-billing",
    year: "2024",
    company: "CV. Prabubima Tech",
    title: "School Billing & Pocket Money",
    img: "/images/mbs3.png",
    desc: "A centralized parent app for tracking school bills, pocket money usage, and payment history.",
    problem:
      "Parents struggled to track bills, monitor child's pocket money usage, and view payment history.",
    solution:
      "Built a responsive React.js mobile app for real time billing updates and pocket money tracking.",
    impacts: [
      "Increased visibility on school bills for parents.",
      "Allowed monitoring of daily pocket money spending.",
      "Centralized access to payment history and receipts.",
    ],
    tech: "JavaScript • React.js • REST API • Tailwind",
  },
  {
    id: "etest",
    year: "2025",
    company: "CV. Prabubima Tech",
    title: "eTest Learning Assessment",
    img: "/images/eTest1.png",
    desc: "Assessment platform comparing Pre test vs Post test scores to quantify learning effectiveness.",
    problem:
      "Instructors lacked data on the actual impact of their materials, and manual grading was a bottleneck.",
    solution:
      "Implemented structured Pre test → Material → Post test flow with automated grading for objective questions.",
    impacts: [
      "Quantified learning outcomes through Learning Gain calculation.",
      "Removed grading bottlenecks with automated scoring.",
      "Provided data driven insights into curriculum effectiveness.",
    ],
    tech: "PHP • Laravel • MySQL • JavaScript • Bootstrap",
  },
];
