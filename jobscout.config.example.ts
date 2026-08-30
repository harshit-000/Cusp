import type { JobScoutConfig } from "@/config/schema";

/**
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  TEMPLATE — copy this file to `jobscout.config.ts`, then edit it.         │
 * │                                                                           │
 * │      cp jobscout.config.example.ts jobscout.config.ts                     │
 * │                                                                           │
 * │  Change `profile.name` from "Your Name" to your real name (that's how the │
 * │  app knows it's configured), then set the rest. Put SECRETS (database URL,│
 * │  API keys) in `.env`, never here. `jobscout.config.ts` is git-ignored.    │
 * └─────────────────────────────────────────────────────────────────────────┘
 */
export const config = {
  // ── Who you are & what you want ───────────────────────────────────────────
  profile: {
    name: "Your Name", // ← change this to your real name to activate the app
    basedIn: "India",
    locations: [
      "Pune", "Bengaluru", "Bangalore", "Hyderabad", "Gurugram", "Gurgaon",
      "Noida", "New Delhi", "Delhi", "Mumbai", "Chennai", "Kolkata",
      "Ahmedabad", "India", "Remote",
    ],
    // Location preference — ordered, most preferred first. Ranks roles by location
    // (the strongest lever after experience). Leave empty for no preference.
    preferredLocations: ["Pune", "Remote", "Bengaluru", "Bangalore", "Hyderabad"],
    experienceYears: 2,
    salaryMinLpa: 15,
    salaryMaxLpa: 30,
    // Your expertise — matched against each role's demanded skills to score fit.
    // Include your discipline (e.g. Frontend/UI) so those roles rank as a match
    // even when the title doesn't spell out a specific library.
    skills: [
      "Frontend", "Front End", "Front-End", "UI", "React", "TypeScript",
      "Next.js", "Node.js", "JavaScript", "GraphQL", "React Query", "Zustand",
      "Redux", "Material UI", "tRPC", "Vite", "HTML", "CSS",
    ],
  },

  // ── How jobs are matched & filtered ───────────────────────────────────────
  matching: {
    roleKeywords: [
      "Frontend", "Front End", "Front-End", "React", "UI Engineer",
      "Software Engineer", "Web Developer", "Full Stack", "SDE", "Engineer",
      "Developer",
    ],
    seniority: {
      target: ["SDE-1", "SDE-2", "SDE II", "mid", "associate", "II"],
      stretch: ["senior"], // visible but penalized
      avoid: ["intern", "staff", "principal", "manager", "architect", "lead", "director"],
    },
    // Anything whose title contains one of these is dropped entirely.
    titleExclude: [
      "QA", "SDET", "Tester", "in Test", "Test Engineer", "Quality", "Automation",
      "Customer Experience", "Customer Success", "Customer Support",
      "Support Engineer", "Technical Support", "Support Specialist",
      "Sales", "Sales Engineer", "Solutions Engineer", "Solution Engineer",
      "Solutions Architect", "Solution Architect", "Field Engineer",
      "Pre-Sales", "Presales", "Account Executive", "Account Manager",
      "Business Development", "Partnerships",
      "DevRel", "Developer Advocate", "Developer Relations", "Advocate", "Community",
      "DevOps", "SRE", "Site Reliability", "Data Engineer", "Data Scientist",
      "Data Analyst", "Machine Learning", "ML Engineer", "Android", "iOS",
      "SAP", "RPA", "UiPath", "Technical Services", "Services Engineer",
      "Forward Deployed", "Firmware", "Embedded",
      "Manager", "Director", "Head of", "VP", "Vice President",
      "Recruiter", "Recruiting", "Talent", "Sourcer", "People Ops",
      "Marketing", "Content", "Copywriter", "Designer", "Finance",
      "Accountant", "Legal", "Analyst",
      "Product Manager", "Program Manager", "Salesforce", "IT Support",
      "intern", "talent pool",
    ],
    // Roles requiring these are auto-marked ineligible (for an India-based search).
    blockPhrases: [
      "US citizen", "security clearance", "must be authorized to work in the US",
      "US residency", "GC required",
    ],
    offStack: [],
    // Discipline focus: titles matching `focus` score full; `deprioritize` titles
    // are down-weighted (still shown). Leave both empty to disable.
    focus: ["Frontend", "Front End", "Front-End", "UI", "React", "Full Stack", "Fullstack", "Web"],
    deprioritize: [
      "Backend", "Back End", "Back-End", "Infrastructure", "Infra",
      "Platform", "Systems", "Kernel", "Compiler", "Database", "Security",
    ],
    preferredTiers: ["product_mnc", "big_startup"],
  },

  // ── Job sources (company ATS boards we pull from) ──────────────────────────
  // Find a company's ATS + token from its careers-page URL, e.g.
  //   boards.greenhouse.io/postman → ats:"greenhouse", token:"postman"
  //   jobs.lever.co/cred           → ats:"lever",      token:"cred"
  //   jobs.ashbyhq.com/notion      → ats:"ashby",      token:"notion"
  companies: [
    { name: "Groww", tier: "big_startup", ats: "greenhouse", token: "groww", hiresIn: ["India"] },
    { name: "CRED", tier: "big_startup", ats: "lever", token: "cred", hiresIn: ["India"] },
    { name: "Postman", tier: "big_startup", ats: "greenhouse", token: "postman", hiresIn: ["India"] },
    { name: "Notion", tier: "big_startup", ats: "ashby", token: "notion" },
    { name: "Linear", tier: "big_startup", ats: "ashby", token: "linear" },
    { name: "Ramp", tier: "big_startup", ats: "ashby", token: "ramp" },
    { name: "HackerRank", tier: "big_startup", ats: "greenhouse", token: "hackerrank", hiresIn: ["India"] },
    { name: "Stripe", tier: "product_mnc", ats: "greenhouse", token: "stripe", hiresIn: ["India"] },
    { name: "GitLab", tier: "product_mnc", ats: "greenhouse", token: "gitlab" },
    { name: "MongoDB", tier: "product_mnc", ats: "greenhouse", token: "mongodb", hiresIn: ["India"] },
    { name: "Databricks", tier: "product_mnc", ats: "greenhouse", token: "databricks", hiresIn: ["India"] },
  ],

  // ── Broad discovery (Adzuna) — searches the whole market by your keywords. ──
  // Active only when ADZUNA_APP_ID/ADZUNA_APP_KEY are set in .env.
  // Free key: https://developer.adzuna.com/ · service/staffing firms are dropped.
  discovery: {
    keywords: [
      "Frontend Developer", "React Developer", "Frontend Engineer",
      "Software Engineer", "Full Stack Developer",
    ],
    where: "India",
    maxDaysOld: 30,
    pages: 3,
    excludeServiceCompanies: true,
  },

  // ── Optional: override any scoring weight. Omit to use sensible defaults. ──
  // weights: { skillWeight: 0.9 },
} satisfies JobScoutConfig;
